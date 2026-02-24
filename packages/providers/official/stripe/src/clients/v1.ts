import { EVENT_MAP } from "@/clients/event-map";
import { ProviderClient } from "@/clients/interface";
import {
  mapAddressToStripe,
  mapSessionToCheckoutResult,
  mapSessionToPaymentResult,
  mapSessionToSubscriptionResult,
  mapStripeCustomerToCustomer,
  mapStripePaymentMethodToPaymentMethod,
  mapStripePaymentToPayment,
  mapStripeSubscriptionToSubscription,
} from "@/clients/mappers";
import {
  ProviderContext,
  InstallResult,
  RevstackEvent,
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
  RefundPaymentInput,
  Subscription,
  UpdateCustomerInput,
  AsyncActionResult,
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

  async validateCredentials(
    ctx: ProviderContext
  ): Promise<AsyncActionResult<boolean>> {
    if (!ctx.config.apiKey) return { data: false, status: "success" };

    try {
      const stripe = this.getStripeClient(ctx.config.apiKey);
      await stripe.paymentIntents.list({ limit: 1 });
      return { data: true, status: "success" };
    } catch {
      return { data: false, status: "failed" };
    }
  }

  async setupWebhooks(
    ctx: ProviderContext,
    webhookUrl: string
  ): Promise<AsyncActionResult<InstallResult>> {
    const stripe = this.getStripeClient(ctx.config.apiKey);

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

      if (existingWebhook) {
        webhookEndpoint = await stripe.webhookEndpoints.update(
          existingWebhook.id,
          { enabled_events }
        );
      } else {
        webhookEndpoint = await stripe.webhookEndpoints.create({
          enabled_events,
          url: webhookUrl,
        });
      }

      return {
        data: {
          success: true,
          data: {
            webhookEndpointId: webhookEndpoint.id,
            webhookSecret: webhookEndpoint.secret!,
          },
        },
        status: "success",
      };
    } catch (error: unknown) {
      console.error("Stripe Webhook Setup Failed:", error as Error);
      throw createError(
        RevstackErrorCode.UnknownError,
        "Failed to setup webhooks in Stripe"
      );
    }
  }

  async removeWebhooks(
    ctx: ProviderContext,
    webhookId: string
  ): Promise<AsyncActionResult<boolean>> {
    const stripe = this.getStripeClient(ctx.config.apiKey);
    try {
      await stripe.webhookEndpoints.del(webhookId);
      return { data: true, status: "success" };
    } catch (error: unknown) {
      console.warn(
        "Webhook deletion failed (maybe already deleted):",
        error as Error
      );
      return { data: false, status: "failed" };
    }
  }

  async verifyWebhookSignature(
    ctx: ProviderContext,
    payload: string | Buffer,
    headers: Record<string, string | string[] | undefined>,
    secret: string
  ): Promise<AsyncActionResult<boolean>> {
    const signatureHeader = headers["stripe-signature"];
    if (!signatureHeader || !secret) return { data: false, status: "failed" };

    const signature = Array.isArray(signatureHeader)
      ? signatureHeader[0]
      : signatureHeader;
    if (!signature) return { data: false, status: "failed" };

    const stripe = this.getStripeClient(ctx.config.apiKey);
    try {
      stripe.webhooks.constructEvent(payload, signature, secret);
      return { data: true, status: "success" };
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      return { data: false, status: "failed" };
    }
  }

  async parseWebhookEvent(
    payload: unknown
  ): Promise<AsyncActionResult<RevstackEvent | null>> {
    const event = payload as Stripe.Event;
    if (!event || !event.type) return { data: null, status: "failed" };

    const mappedType = EVENT_MAP[event.type as keyof typeof EVENT_MAP];
    if (!mappedType) return { data: null, status: "failed" };

    const resourceId = this.extractResourceId(event);

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

  async createCheckoutSession(
    ctx: ProviderContext,
    input: CheckoutSessionInput
  ): Promise<AsyncActionResult<CheckoutSessionResult>> {
    const stripe = this.getStripeClient(ctx.config.apiKey);

    try {
      const sessionParams: Stripe.Checkout.SessionCreateParams = {
        mode: input.mode,
        client_reference_id: input.clientReferenceId,
        success_url: input.successUrl + "&session_id={CHECKOUT_SESSION_ID}",
        cancel_url: input.cancelUrl,
        customer: input.customerId,
        customer_email: !input.customerId ? input.customerEmail : undefined,
        allow_promotion_codes: input.allowPromotionCodes,
        payment_method_types: ["card"],
        line_items: input.lineItems.map((item) => ({
          price_data: {
            currency: item.currency.toLowerCase(),
            product_data: {
              name: item.name,
              description: item.description,
              images: item.images,
            },
            unit_amount: item.amount,
            tax_behavior: item.taxRates ? "exclusive" : "unspecified",
          },
          tax_rates: item.taxRates,
          quantity: item.quantity,
        })),
        metadata: {
          ...input.metadata,
          revstack_trace_id: ctx.traceId ?? null,
        },
      };

      const session = await stripe.checkout.sessions.create(sessionParams, {
        idempotencyKey: ctx.idempotencyKey,
      });

      return {
        data: mapSessionToCheckoutResult(session),
        status: "requires_action",
        nextAction: {
          type: "redirect",
          url: session.url!,
        },
      };
    } catch (error: unknown) {
      return {
        data: null,
        status: "failed",
        error: {
          code: RevstackErrorCode.UnknownError,
          message: (error as Error).message,
        },
      };
    }
  }

  async createPayment(
    ctx: ProviderContext,
    input: CreatePaymentInput
  ): Promise<AsyncActionResult<Payment>> {
    const stripe = this.getStripeClient(ctx.config.apiKey);

    try {
      const session = await stripe.checkout.sessions.create(
        {
          mode: "payment",
          customer: input.customerId,
          payment_intent_data: {
            capture_method: input.capture === false ? "manual" : "automatic",
            statement_descriptor: input.statementDescriptor?.slice(0, 22),
            metadata: {
              ...input.metadata,
              revstack_trace_id: ctx.traceId ?? null,
            },
          },
          line_items: [
            {
              price_data: {
                currency: input.currency.toLowerCase(),
                product_data: {
                  name: input.description || "Payment",
                },
                unit_amount: input.amount,
              },
              quantity: 1,
            },
          ],
          success_url: input.returnUrl + "?session_id={CHECKOUT_SESSION_ID}",
          cancel_url: input.returnUrl + "?canceled=true",
          metadata: {
            ...input.metadata,
            revstack_trace_id: ctx.traceId ?? null,
          },
        },
        { idempotencyKey: ctx.idempotencyKey }
      );

      return {
        data: mapSessionToPaymentResult(
          session,
          input.amount,
          input.currency,
          input.customerId
        ),
        status: "requires_action",
        nextAction: {
          type: "redirect",
          url: session.url!,
        },
      };
    } catch (error: unknown) {
      return {
        data: null,
        status: "failed",
        error: {
          code: RevstackErrorCode.PaymentFailed,
          message: (error as Error).message,
        },
      };
    }
  }

  async createSubscription(
    ctx: ProviderContext,
    input: CreateSubscriptionInput
  ): Promise<AsyncActionResult<Subscription>> {
    const stripe = this.getStripeClient(ctx.config.apiKey);

    try {
      const discounts = input.discountId
        ? [{ coupon: input.discountId }]
        : undefined;

      const session = await stripe.checkout.sessions.create(
        {
          mode: "subscription",
          customer: input.customerId,
          discounts,
          allow_promotion_codes:
            !discounts && input.promotionCode ? true : undefined,

          line_items: [
            {
              price: input.priceId,
              quantity: input.quantity || 1,
            },
          ],
          subscription_data: {
            trial_period_days: input.trialDays,
            metadata: { revstack_trace_id: ctx.traceId ?? null },
          },
          success_url: input.returnUrl,
          cancel_url: input.cancelUrl,
          metadata: {
            ...input.metadata,
            revstack_trace_id: ctx.traceId ?? null,
          },
        },
        { idempotencyKey: ctx.idempotencyKey }
      );

      return {
        data: mapSessionToSubscriptionResult(session, input.customerId),
        status: "requires_action",
        nextAction: {
          type: "redirect",
          url: session.url!,
        },
      };
    } catch (error: unknown) {
      return {
        data: null,
        status: "failed",
        error: {
          code: RevstackErrorCode.PaymentFailed,
          message: (error as Error).message,
        },
      };
    }
  }

  async getPayment(
    ctx: ProviderContext,
    id: string
  ): Promise<AsyncActionResult<Payment>> {
    const stripe = this.getStripeClient(ctx.config.apiKey);

    try {
      const pi = await stripe.paymentIntents.retrieve(id);
      return {
        data: mapStripePaymentToPayment(pi),
        status: "success",
      };
    } catch (error: unknown) {
      return {
        data: null,
        status: "failed",
        error: {
          code: RevstackErrorCode.ResourceNotFound,
          message: (error as Error).message,
        },
      };
    }
  }

  async refundPayment(
    ctx: ProviderContext,
    input: RefundPaymentInput
  ): Promise<AsyncActionResult<Payment>> {
    const stripe = this.getStripeClient(ctx.config.apiKey);

    try {
      await stripe.refunds.create(
        {
          payment_intent: input.paymentId,
          amount: input.amount,
          reason: input.reason as Stripe.RefundCreateParams.Reason,
          metadata: {
            revstack_trace_id: ctx.traceId || null,
          },
        },
        { idempotencyKey: ctx.idempotencyKey }
      );

      return this.getPayment(ctx, input.paymentId);
    } catch (error: unknown) {
      return {
        data: null,
        status: "failed",
        error: {
          code: RevstackErrorCode.RefundFailed,
          message: (error as Error).message,
        },
      };
    }
  }

  async listPayments(
    ctx: ProviderContext,
    pagination: PaginationOptions
  ): Promise<AsyncActionResult<PaginatedResult<Payment>>> {
    const stripe = this.getStripeClient(ctx.config.apiKey);

    try {
      const params: Stripe.PaymentIntentListParams = {
        limit: pagination.limit || 20,
      };

      if (pagination.cursor) {
        params.starting_after = pagination.cursor;
      }

      const result = await stripe.paymentIntents.list(params);

      return {
        data: {
          data: result.data.map(mapStripePaymentToPayment),
          hasMore: result.has_more,
          nextCursor:
            result.data.length > 0
              ? result.data[result.data.length - 1]?.id
              : undefined,
        },
        status: "success",
      };
    } catch (error: unknown) {
      return {
        data: null,
        status: "failed",
        error: {
          code: RevstackErrorCode.UnknownError,
          message: (error as Error).message,
        },
      };
    }
  }

  async getSubscription(
    ctx: ProviderContext,
    id: string
  ): Promise<AsyncActionResult<Subscription>> {
    const stripe = this.getStripeClient(ctx.config.apiKey);

    try {
      const sub = await stripe.subscriptions.retrieve(id);
      return {
        data: mapStripeSubscriptionToSubscription(sub),
        status: "success",
      };
    } catch (error: unknown) {
      return {
        data: null,
        status: "failed",
        error: {
          code: RevstackErrorCode.ResourceNotFound,
          message: (error as Error).message,
        },
      };
    }
  }

  async cancelSubscription(
    ctx: ProviderContext,
    id: string,
    reason?: string
  ): Promise<AsyncActionResult<Subscription>> {
    const stripe = this.getStripeClient(ctx.config.apiKey);

    try {
      const sub = await stripe.subscriptions.update(id, {
        cancel_at_period_end: true,
        cancellation_details: {
          comment: reason || null,
          feedback: "other",
        },
      });

      return {
        data: mapStripeSubscriptionToSubscription(sub),
        status: "success",
      };
    } catch (error: unknown) {
      return {
        data: null,
        status: "failed",
        error: {
          code: RevstackErrorCode.SubscriptionNotFound,
          message: (error as Error).message,
        },
      };
    }
  }

  async pauseSubscription(
    ctx: ProviderContext,
    id: string
  ): Promise<AsyncActionResult<Subscription>> {
    const stripe = this.getStripeClient(ctx.config.apiKey);

    try {
      const sub = await stripe.subscriptions.update(
        id,
        {
          pause_collection: {
            behavior: "void",
          },
        },
        { idempotencyKey: ctx.idempotencyKey }
      );

      return {
        data: mapStripeSubscriptionToSubscription(sub),
        status: "success",
      };
    } catch (error: unknown) {
      return {
        data: null,
        status: "failed",
        error: {
          code: RevstackErrorCode.UnknownError,
          message: (error as Error).message,
        },
      };
    }
  }

  async resumeSubscription(
    ctx: ProviderContext,
    id: string
  ): Promise<AsyncActionResult<Subscription>> {
    const stripe = this.getStripeClient(ctx.config.apiKey);

    try {
      const sub = await stripe.subscriptions.update(
        id,
        {
          pause_collection: null,
        },
        { idempotencyKey: ctx.idempotencyKey }
      );

      return {
        data: mapStripeSubscriptionToSubscription(sub),
        status: "success",
      };
    } catch (error: unknown) {
      return {
        data: null,
        status: "failed",
        error: {
          code: RevstackErrorCode.UnknownError,
          message: (error as Error).message,
        },
      };
    }
  }

  async createCustomer(
    ctx: ProviderContext,
    input: CreateCustomerInput
  ): Promise<AsyncActionResult<Customer>> {
    const stripe = this.getStripeClient(ctx.config.apiKey);

    try {
      const customer = await stripe.customers.create(
        {
          email: input.email,
          name: input.name,
          phone: input.phone,
          description: input.description,
          address: mapAddressToStripe(input.address),
          metadata: {
            ...input.metadata,
            revstack_trace_id: ctx.traceId || null,
          },
        },
        { idempotencyKey: ctx.idempotencyKey }
      );

      return {
        data: mapStripeCustomerToCustomer(customer),
        status: "success",
      };
    } catch (error: unknown) {
      return {
        data: null,
        status: "failed",
        error: {
          code: RevstackErrorCode.InvalidInput,
          message: (error as Error).message,
        },
      };
    }
  }

  async updateCustomer(
    ctx: ProviderContext,
    id: string,
    input: UpdateCustomerInput
  ): Promise<AsyncActionResult<Customer>> {
    const stripe = this.getStripeClient(ctx.config.apiKey);

    try {
      const customer = await stripe.customers.update(id, {
        email: input.email,
        name: input.name,
        phone: input.phone,
        description: input.description,
        address: mapAddressToStripe(input.address),
        metadata: input.metadata,
      });

      return {
        data: mapStripeCustomerToCustomer(customer),
        status: "success",
      };
    } catch (error: unknown) {
      return {
        data: null,
        status: "failed",
        error: {
          code: RevstackErrorCode.ResourceNotFound,
          message: (error as Error).message,
        },
      };
    }
  }

  async deleteCustomer(
    ctx: ProviderContext,
    id: string
  ): Promise<AsyncActionResult<boolean>> {
    const stripe = this.getStripeClient(ctx.config.apiKey);

    try {
      const deleted = await stripe.customers.del(id);
      return {
        data: deleted.deleted,
        status: "success",
      };
    } catch (error: unknown) {
      return {
        data: false,
        status: "failed",
        error: {
          code: RevstackErrorCode.UnknownError,
          message: (error as Error).message,
        },
      };
    }
  }

  async getCustomer(
    ctx: ProviderContext,
    id: string
  ): Promise<AsyncActionResult<Customer>> {
    const stripe = this.getStripeClient(ctx.config.apiKey);

    try {
      const customer = await stripe.customers.retrieve(id);

      if (customer.deleted) {
        return {
          data: null,
          status: "failed",
          error: {
            code: RevstackErrorCode.ResourceNotFound,
            message: "Customer has been deleted in Stripe",
          },
        };
      }

      return {
        data: mapStripeCustomerToCustomer(customer),
        status: "success",
      };
    } catch (error: unknown) {
      return {
        data: null,
        status: "failed",
        error: {
          code: RevstackErrorCode.ResourceNotFound,
          message: (error as Error).message,
        },
      };
    }
  }

  async listPaymentMethods(
    ctx: ProviderContext,
    customerId: string
  ): Promise<AsyncActionResult<PaymentMethod[]>> {
    const stripe = this.getStripeClient(ctx.config.apiKey);

    try {
      const [paymentMethods, customer] = await Promise.all([
        stripe.paymentMethods.list({
          customer: customerId,
          type: "card",
          limit: 100,
        }),
        stripe.customers.retrieve(customerId),
      ]);

      if (customer.deleted) {
        throw new Error("Customer deleted");
      }

      const defaultPaymentMethodId =
        (customer as Stripe.Customer).invoice_settings
          ?.default_payment_method ||
        (customer as Stripe.Customer).default_source;

      const mappedMethods = paymentMethods.data.map((pm) =>
        mapStripePaymentMethodToPaymentMethod(
          pm,
          defaultPaymentMethodId as string
        )
      );

      return {
        data: mappedMethods,
        status: "success",
      };
    } catch (error: unknown) {
      return {
        data: [],
        status: "failed",
        error: {
          code: RevstackErrorCode.UnknownError,
          message: (error as Error).message,
        },
      };
    }
  }

  async deletePaymentMethod(
    ctx: ProviderContext,
    id: string
  ): Promise<AsyncActionResult<boolean>> {
    const stripe = this.getStripeClient(ctx.config.apiKey);

    try {
      await stripe.paymentMethods.detach(id);

      return {
        data: true,
        status: "success",
      };
    } catch (error: unknown) {
      return {
        data: false,
        status: "failed",
        error: {
          code: RevstackErrorCode.UnknownError,
          message: (error as Error).message,
        },
      };
    }
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
