import { manifest } from "@/manifest";
import {
  BaseProvider,
  EventType,
  InstallInput,
  InstallResult,
  ProviderContext,
  RevstackEvent,
  RevstackErrorCode,
  createError,
  UninstallInput,
} from "@revstackhq/providers-core";
import Stripe from "stripe";

const STRIPE_API_VERSION: Stripe.LatestApiVersion = "2026-01-28.clover";

export class StripeProvider extends BaseProvider {
  static manifest = manifest;
  manifest = manifest;

  private getStripeClient(apiKey: string) {
    return new Stripe(apiKey, {
      apiVersion: STRIPE_API_VERSION,
      typescript: true,
    });
  }

  async onInstall(
    _ctx: ProviderContext,
    input: InstallInput,
  ): Promise<InstallResult> {
    if (!input.config.apiKey) {
      throw createError(RevstackErrorCode.InvalidInput, "API Key is required");
    }

    const stripe = this.getStripeClient(input.config.apiKey);

    if (!input.webhookUrl) {
      throw createError(
        RevstackErrorCode.InvalidInput,
        "Webhook URL is required",
      );
    }

    try {
      const webhooks = await stripe.webhookEndpoints.list({ limit: 100 });

      const existingWebhook = webhooks.data.find(
        (wh) => wh.url === input.webhookUrl,
      );

      let webhookEndpoint;

      const enabled_events: Stripe.WebhookEndpointCreateParams.EnabledEvent[] =
        [
          "payment_intent.succeeded",
          "payment_intent.payment_failed",
          "checkout.session.completed",
          "charge.refunded",
          "customer.subscription.created",
          "customer.subscription.updated",
          "customer.subscription.deleted",
          "charge.dispute.created",
          "charge.dispute.closed",
        ];

      if (existingWebhook) {
        webhookEndpoint = await stripe.webhookEndpoints.update(
          existingWebhook.id,
          {
            enabled_events,
          },
        );
      } else {
        webhookEndpoint = await stripe.webhookEndpoints.create({
          enabled_events,
          url: input.webhookUrl,
        });
      }

      return {
        success: true,
        data: {
          webhookEndpointId: webhookEndpoint.id,
          webhookSecret: webhookEndpoint.secret,
          apiKey: input.config.apiKey,
        },
      };
    } catch (error: any) {
      console.error(error);
      throw createError(
        RevstackErrorCode.UnknownError,
        "Failed to install provider",
      );
    }
  }

  async onUninstall(
    ctx: ProviderContext,
    input: UninstallInput,
  ): Promise<boolean> {
    if (!input.config.apiKey) {
      throw createError(RevstackErrorCode.InvalidInput, "API Key is required");
    }

    const stripe = this.getStripeClient(input.config.apiKey);

    try {
      await stripe.webhookEndpoints.del(input.data.webhookEndpointId);
      return true;
    } catch (error: any) {
      console.error(error);
      throw createError(
        RevstackErrorCode.UnknownError,
        "Failed to uninstall provider",
      );
    }
  }

  async verifyWebhookSignature(
    ctx: ProviderContext,
    payload: string | Buffer,
    headers: Record<string, string | string[] | undefined>,
    secret: string,
  ): Promise<boolean> {
    const signatureHeader = headers["stripe-signature"];

    if (!signatureHeader || !secret) return false;

    const signature = Array.isArray(signatureHeader)
      ? signatureHeader[0]
      : signatureHeader;

    if (!signature) return false;

    const stripe = new Stripe(ctx.config.apiKey, {
      apiVersion: STRIPE_API_VERSION,
    });

    try {
      stripe.webhooks.constructEvent(payload, signature, secret);
      return true;
    } catch (err) {
      console.error("Stripe signature verification failed:", err);
      return false;
    }
  }

  async parseWebhookEvent(payload: any): Promise<RevstackEvent | null> {
    const event = payload as Stripe.Event;

    if (!event || !event.type) return null;

    const mappedType = EVENT_MAP[event.type as keyof typeof EVENT_MAP];

    if (!mappedType) return null;

    const resourceId = this.extractResourceId(event);

    return {
      type: mappedType,
      providerEventId: event.id,
      createdAt: new Date(event.created * 1000),
      resourceId: resourceId || event.id,
      originalPayload: payload,
      metadata: {
        stripeType: event.type,
      },
    };
  }

  private extractResourceId(event: Stripe.Event): string | null {
    const obj = event.data.object as any;

    if (event.type.startsWith("customer.subscription")) return obj.id;
    if (event.type.startsWith("payment_intent")) return obj.id;
    if (event.type === "checkout.session.completed") return obj.id;
    if (event.type.startsWith("charge.dispute"))
      return obj.payment_intent || obj.charge;

    return obj.id || null;
  }
}

export const EVENT_MAP: Record<string, EventType> = {
  "checkout.session.completed": "PAYMENT_SUCCEEDED",

  "payment_intent.succeeded": "PAYMENT_SUCCEEDED",
  "payment_intent.payment_failed": "PAYMENT_FAILED",
  "payment_intent.amount_capturable_updated": "PAYMENT_AUTHORIZED",

  "charge.captured": "PAYMENT_CAPTURED",

  "charge.refunded": "REFUND_PROCESSED",

  "customer.subscription.created": "SUBSCRIPTION_CREATED",
  "customer.subscription.updated": "SUBSCRIPTION_UPDATED",
  "customer.subscription.deleted": "SUBSCRIPTION_CANCELED",

  "charge.dispute.created": "DISPUTE_CREATED",
  "charge.dispute.closed": "DISPUTE_RESOLVED",
};
