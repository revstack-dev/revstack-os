import { mapError } from "@/shared/error-map";
import {
  ProviderContext,
  InstallResult,
  RevstackEvent,
  RevstackError,
  AsyncActionResult,
  RevstackErrorCode,
} from "@revstackhq/providers-core";
import Stripe from "stripe";
import { getOrCreateClient } from "@/api/v1/client";
import { EVENT_MAP } from "@/shared/event-map";

/**
 * Natively securely verifies active Stripe account credentials.
 * Operates an explicit test lookup securely guaranteeing configured secret keys reliably structurally map
 * directly accurately to active functional Stripe environments natively safely.
 *
 * @param ctx - The core provider execution context cleanly tracking active connection strings securely.
 * @returns An AsyncActionResult affirmatively returning boolean authentication success states safely.
 */
export async function validateCredentials(
  ctx: ProviderContext,
): Promise<AsyncActionResult<boolean>> {
  if (!ctx.config.apiKey) return { data: false, status: "success" };

  try {
    const stripe = getOrCreateClient(ctx.config.apiKey);
    await stripe.paymentIntents.list({ limit: 1 });
    return { data: true, status: "success" };
  } catch {
    return { data: false, status: "failed" };
  }
}

/**
 * Architecturally generates and natively provisions robust Stripe Webhook Endpoints systematically securely natively.
 * Checks globally actively mapped endpoints; smartly natively updates safely existing endpoints preserving explicit secrets securely,
 * or natively accurately strictly generates natively brand new webhooks reliably capturing uniquely critical initial secrets.
 *
 * @param ctx - The core provider execution context cleanly tracking operational idempotency globally safely.
 * @param webhookUrl - The strict absolute securely formatted URL designated accurately explicitly natively to receive event payloads securely natively.
 * @returns An AsyncActionResult returning unique Endpoint IDs natively cleanly combined natively with one-time secrets successfully automatically securely natively.
 */
export async function setupWebhooks(
  ctx: ProviderContext,
  webhookUrl: string,
): Promise<AsyncActionResult<InstallResult>> {
  const stripe = getOrCreateClient(ctx.config.apiKey);

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
    const mapped = mapError(error);
    throw new RevstackError({
      code: mapped.code,
      message: mapped.message,
      provider: "stripe",
      cause: error,
    });
  }
}

/**
 * Operates a systematic native cleanup explicitly cleanly deleting reliably active existing configured webhooks automatically.
 * Catches softly redundant cleanup requests globally safely returning cleanly reliably unconditionally actively.
 *
 * @param ctx - The core provider execution context.
 * @param webhookId - The target configured webhook endpoint ID natively globally securely properly identified aggressively clearly.
 * @returns An AsyncActionResult securely globally boolean reflecting definitive removal success states natively correctly.
 */
export async function removeWebhooks(
  ctx: ProviderContext,
  webhookId: string,
): Promise<AsyncActionResult<boolean>> {
  const stripe = getOrCreateClient(ctx.config.apiKey);
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

/**
 * Architecturally strictly securely natively uniquely verifies incoming Stripe event payload signatures.
 * Traps precisely complex untrustworthy payload structures cleanly actively guaranteeing uniquely explicitly native origin security definitively safely intelligently.
 *
 * @param ctx - The core provider context.
 * @param payload - The literal unaltered definitively raw byte buffer natively globally precisely capturing natively webhook bodies.
 * @param headers - The explicit un-parsed explicitly securely raw HTTP headers.
 * @param secret - The precisely captured logically active webhook boundary secret.
 * @returns An AsyncActionResult yielding boolean confirmation safely.
 */
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

  const stripe = getOrCreateClient(ctx.config.apiKey);
  try {
    stripe.webhooks.constructEvent(payload, signature, secret);
    return { data: true, status: "success" };
  } catch {
    return { data: false, status: "failed" };
  }
}

/**
 * Dynamically resolves internal Stripe payload object associations cleanly returning canonical internal representations.
 *
 * @param event - The generic strictly typed unverified localized Stripe object.
 * @returns An optional resolved unified entity reference string.
 */
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
  const obj = event.data.object as any;
  const mappedType = EVENT_MAP[event.type];

  const resourceId = extractResourceId(event);

  if (!event?.data?.object) {
    return {
      data: null,
      status: "failed",
      error: {
        code: RevstackErrorCode.InvalidWebhookPayload,
        message: "Payload missing data.object structure",
      },
    };
  }

  if (!mappedType || !resourceId)
    return {
      data: null,
      status: "failed",
      error: {
        code: RevstackErrorCode.InvalidWebhookPayload,
        message: "Invalid webhook payload",
      },
    };

  return {
    data: {
      type: mappedType,
      providerEventId: event.id,
      createdAt: new Date(event.created * 1000),

      resourceId,
      customerId: obj.customer || undefined,
      clientReferenceId: obj.client_reference_id || undefined,

      metadata: {
        stripeType: event.type,
        ...(obj.metadata || {}),
      },
      originalPayload: payload,
    },
    status: "success",
  };
}
