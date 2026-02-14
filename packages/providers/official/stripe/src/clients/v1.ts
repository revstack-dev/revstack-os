import { EVENT_MAP } from "@/clients/event-map";
import { ProviderClient } from "@/clients/interface";
import { manifest } from "@/manifest";
import {
  ProviderContext,
  InstallInput,
  InstallResult,
  UninstallInput,
  RevstackEvent,
  BaseProvider,
  ProviderManifest,
  createError,
  RevstackErrorCode,
  CheckoutSessionInput,
  CheckoutSessionResult,
  CreateCustomerInput,
  CreatePaymentInput,
  CreateSubscriptionInput,
  Customer,
  PaginatedResult,
  PaginationOptions,
  Payment,
  PaymentMethod,
  PaymentResult,
  RefundPaymentInput,
  Subscription,
  SubscriptionResult,
  UpdateCustomerInput,
} from "@revstackhq/providers-core";
import Stripe from "stripe";

const STRIPE_API_VERSION: Stripe.LatestApiVersion = "2026-01-28.clover";

export class StripeClientV1 implements ProviderClient {
  private getStripeClient(apiKey: string) {
    return new Stripe(apiKey, {
      apiVersion: STRIPE_API_VERSION,
      typescript: true,
    });
  }

  async validateCredentials(ctx: ProviderContext): Promise<boolean> {
    if (!ctx.config.apiKey) return false;

    try {
      const stripe = this.getStripeClient(ctx.config.apiKey);
      await stripe.paymentIntents.list({ limit: 1 });
      return true;
    } catch (e) {
      return false;
    }
  }

  async setupWebhooks(
    ctx: ProviderContext,
    webhookUrl: string,
  ): Promise<InstallResult> {
    const stripe = this.getStripeClient(ctx.config.apiKey);

    const enabled_events: Stripe.WebhookEndpointCreateParams.EnabledEvent[] = [
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

    try {
      const webhooks = await stripe.webhookEndpoints.list({ limit: 100 });
      const existingWebhook = webhooks.data.find((wh) => wh.url === webhookUrl);

      let webhookEndpoint;

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
          url: webhookUrl,
        });
      }

      return {
        success: true,
        data: {
          webhookEndpointId: webhookEndpoint.id,
          webhookSecret: webhookEndpoint.secret!,
        },
      };
    } catch (error: any) {
      console.error("Stripe Webhook Setup Failed:", error);
      throw createError(
        RevstackErrorCode.UnknownError,
        "Failed to setup webhooks in Stripe",
      );
    }
  }

  async removeWebhooks(
    ctx: ProviderContext,
    webhookId: string,
  ): Promise<boolean> {
    const stripe = this.getStripeClient(ctx.config.apiKey);
    try {
      await stripe.webhookEndpoints.del(webhookId);
      return true;
    } catch (error) {
      console.warn("Webhook deletion failed (maybe already deleted):", error);
      return false;
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

    const stripe = this.getStripeClient(ctx.config.apiKey);
    try {
      stripe.webhooks.constructEvent(payload, signature, secret);
      return true;
    } catch (err) {
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
      metadata: { stripeType: event.type },
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

  createPayment?(
    ctx: ProviderContext,
    input: CreatePaymentInput,
  ): Promise<PaymentResult> {
    throw new Error("Method not implemented.");
  }

  getPayment?(ctx: ProviderContext, id: string): Promise<Payment> {
    throw new Error("Method not implemented.");
  }

  refundPayment?(
    ctx: ProviderContext,
    input: RefundPaymentInput,
  ): Promise<Payment> {
    throw new Error("Method not implemented.");
  }

  listPayments?(
    ctx: ProviderContext,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<Payment>> {
    throw new Error("Method not implemented.");
  }

  createSubscription?(
    ctx: ProviderContext,
    input: CreateSubscriptionInput,
  ): Promise<SubscriptionResult> {
    throw new Error("Method not implemented.");
  }

  getSubscription?(ctx: ProviderContext, id: string): Promise<Subscription> {
    throw new Error("Method not implemented.");
  }

  cancelSubscription?(
    ctx: ProviderContext,
    id: string,
    reason?: string,
  ): Promise<SubscriptionResult> {
    throw new Error("Method not implemented.");
  }

  pauseSubscription?(
    ctx: ProviderContext,
    id: string,
    reason?: string,
  ): Promise<SubscriptionResult> {
    throw new Error("Method not implemented.");
  }

  resumeSubscription?(
    ctx: ProviderContext,
    id: string,
    reason?: string,
  ): Promise<SubscriptionResult> {
    throw new Error("Method not implemented.");
  }

  createCheckoutSession?(
    ctx: ProviderContext,
    input: CheckoutSessionInput,
  ): Promise<CheckoutSessionResult> {
    throw new Error("Method not implemented.");
  }

  createCustomer?(
    ctx: ProviderContext,
    input: CreateCustomerInput,
  ): Promise<Customer> {
    throw new Error("Method not implemented.");
  }

  updateCustomer?(
    ctx: ProviderContext,
    id: string,
    input: UpdateCustomerInput,
  ): Promise<Customer> {
    throw new Error("Method not implemented.");
  }

  deleteCustomer?(ctx: ProviderContext, id: string): Promise<boolean> {
    throw new Error("Method not implemented.");
  }

  getCustomer?(ctx: ProviderContext, id: string): Promise<Customer> {
    throw new Error("Method not implemented.");
  }

  listPaymentMethods?(
    ctx: ProviderContext,
    customerId: string,
  ): Promise<PaymentMethod[]> {
    throw new Error("Method not implemented.");
  }

  deletePaymentMethod?(ctx: ProviderContext, id: string): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
}
