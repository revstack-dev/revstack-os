import { EVENT_MAP } from "@/maps/event-map";
import {
  mapStripePaymentMethodToPaymentMethod,
  mapStripeError,
} from "@/maps/mappers";
import {
  ProviderContext,
  InstallResult,
  RevstackEvent,
  RevstackError,
  PaymentMethod,
  AsyncActionResult,
} from "@revstackhq/providers-core";
import Stripe from "stripe";
import { getOrCreateStripe } from "./shared";

export async function validateCredentials(
  ctx: ProviderContext,
): Promise<AsyncActionResult<boolean>> {
  if (!ctx.config.apiKey) return { data: false, status: "success" };

  try {
    const stripe = getOrCreateStripe(ctx.config.apiKey);
    await stripe.paymentIntents.list({ limit: 1 });
    return { data: true, status: "success" };
  } catch {
    return { data: false, status: "failed" };
  }
}

export async function setupWebhooks(
  ctx: ProviderContext,
  webhookUrl: string,
): Promise<AsyncActionResult<InstallResult>> {
  const stripe = getOrCreateStripe(ctx.config.apiKey);

  const enabled_events: Stripe.WebhookEndpointCreateParams.EnabledEvent[] = [
    "payment_intent.succeeded",
    "payment_intent.payment_failed",
    "payment_intent.processing",
    "payment_intent.canceled",
    "checkout.session.completed",
    "charge.refunded",
    "customer.subscription.created",
    "customer.subscription.updated",
    "customer.subscription.deleted",
    "customer.subscription.paused",
    "customer.subscription.resumed",
    "customer.subscription.trial_will_end",
    "charge.dispute.created",
    "charge.dispute.closed",
    "invoice.payment_succeeded",
    "invoice.payment_failed",
    "payment_method.attached",
    "payment_method.detached",
  ];

  try {
    const webhooks = await stripe.webhookEndpoints.list({ limit: 100 });
    const existingWebhook = webhooks.data.find((wh) => wh.url === webhookUrl);

    let webhookEndpoint;
    let secret: string | undefined;

    if (existingWebhook) {
      // update just refreshes events — stripe does NOT return the secret on update
      webhookEndpoint = await stripe.webhookEndpoints.update(
        existingWebhook.id,
        { enabled_events },
      );
      // keep whatever secret was stored before, caller must not overwrite
      secret = undefined;
    } else {
      webhookEndpoint = await stripe.webhookEndpoints.create({
        enabled_events,
        url: webhookUrl,
      });
      // secret is only available on create
      secret = webhookEndpoint.secret;
    }

    const data: Record<string, any> = {
      webhookEndpointId: webhookEndpoint.id,
    };
    // only include secret when we actually have one (new endpoints)
    if (secret) {
      data.webhookSecret = secret;
    }

    return {
      data: { success: true, data },
      status: "success",
    };
  } catch (error: unknown) {
    const mapped = mapStripeError(error);
    throw new RevstackError({
      code: mapped.code,
      message: mapped.message,
      provider: "stripe",
      cause: error,
    });
  }
}

export async function removeWebhooks(
  ctx: ProviderContext,
  webhookId: string,
): Promise<AsyncActionResult<boolean>> {
  const stripe = getOrCreateStripe(ctx.config.apiKey);
  try {
    await stripe.webhookEndpoints.del(webhookId);
    return { data: true, status: "success" };
  } catch (error: unknown) {
    console.warn(
      "Webhook deletion failed (maybe already deleted):",
      error as Error,
    );
    return { data: false, status: "failed" };
  }
}

export async function verifyWebhookSignature(
  ctx: ProviderContext,
  payload: string | Buffer,
  headers: Record<string, string | string[] | undefined>,
  secret: string,
): Promise<AsyncActionResult<boolean>> {
  const signatureHeader = headers["stripe-signature"];
  if (!signatureHeader || !secret) return { data: false, status: "failed" };

  const signature = Array.isArray(signatureHeader)
    ? signatureHeader[0]
    : signatureHeader;
  if (!signature) return { data: false, status: "failed" };

  const stripe = getOrCreateStripe(ctx.config.apiKey);
  try {
    stripe.webhooks.constructEvent(payload, signature, secret);
    return { data: true, status: "success" };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (err) {
    return { data: false, status: "failed" };
  }
}

export function extractResourceId(event: Stripe.Event): string | null {
  const obj = event.data.object as any;

  if (event.type.startsWith("customer.subscription")) return obj.id;
  if (event.type.startsWith("payment_intent")) return obj.id;
  if (event.type === "checkout.session.completed") return obj.id;
  if (event.type.startsWith("charge.dispute"))
    return obj.payment_intent || obj.charge;
  return obj.id || null;
}

export async function parseWebhookEvent(
  payload: unknown,
): Promise<AsyncActionResult<RevstackEvent | null>> {
  const event = payload as Stripe.Event;
  if (!event || !event.type) return { data: null, status: "failed" };

  const mappedType = EVENT_MAP[event.type as keyof typeof EVENT_MAP];
  if (!mappedType) return { data: null, status: "failed" };

  const resourceId = extractResourceId(event);

  return {
    data: {
      type: mappedType,
      providerEventId: event.id,
      createdAt: new Date(event.created * 1000),
      resourceId: resourceId || event.id,
      originalPayload: payload,
      metadata: { stripeType: event.type },
    },
    status: "success",
  };
}

export async function listPaymentMethods(
  ctx: ProviderContext,
  customerId: string,
): Promise<AsyncActionResult<PaymentMethod[]>> {
  const stripe = getOrCreateStripe(ctx.config.apiKey);

  try {
    const [paymentMethods, customer] = await Promise.all([
      stripe.paymentMethods.list({
        customer: customerId,
        limit: 100,
      }),
      stripe.customers.retrieve(customerId),
    ]);

    if (customer.deleted) {
      throw new Error("Customer deleted");
    }

    const defaultPaymentMethodId =
      (customer as Stripe.Customer).invoice_settings?.default_payment_method ||
      (customer as Stripe.Customer).default_source;

    const mappedMethods = paymentMethods.data.map((pm) =>
      mapStripePaymentMethodToPaymentMethod(
        pm,
        defaultPaymentMethodId as string,
      ),
    );

    return {
      data: mappedMethods,
      status: "success",
    };
  } catch (error: unknown) {
    const mapped = mapStripeError(error);
    return {
      data: [],
      status: "failed",
      error: mapped,
    };
  }
}

export async function deletePaymentMethod(
  ctx: ProviderContext,
  id: string,
): Promise<AsyncActionResult<boolean>> {
  const stripe = getOrCreateStripe(ctx.config.apiKey);

  try {
    await stripe.paymentMethods.detach(id);

    return {
      data: true,
      status: "success",
    };
  } catch (error: unknown) {
    const mapped = mapStripeError(error);
    return {
      data: false,
      status: "failed",
      error: mapped,
    };
  }
}
