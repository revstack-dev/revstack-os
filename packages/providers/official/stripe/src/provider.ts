import { getClient } from "@/clients/factory";
import { manifest } from "@/manifest";
import {
  BaseProvider,
  CheckoutSessionInput,
  CheckoutSessionResult,
  CreateCustomerInput,
  createError,
  CreatePaymentInput,
  CreateSubscriptionInput,
  Customer,
  InstallInput,
  InstallResult,
  PaginatedResult,
  PaginationOptions,
  Payment,
  PaymentMethod,
  PaymentResult,
  ProviderContext,
  RefundPaymentInput,
  RevstackErrorCode,
  RevstackEvent,
  Subscription,
  SubscriptionResult,
  UninstallInput,
  UpdateCustomerInput,
  WebhookResponse,
} from "@revstackhq/providers-core";

export class StripeProvider extends BaseProvider {
  static manifest = manifest;
  manifest = manifest;

  async onInstall(
    ctx: ProviderContext,
    input: InstallInput,
  ): Promise<InstallResult> {
    const client = getClient(input.config);
    const installVersion = manifest.version;

    const isValid = await client.validateCredentials({
      ...ctx,
      config: input.config,
    });

    if (!isValid) {
      throw createError(
        RevstackErrorCode.InvalidCredentials,
        "Failed to connect to provider. Please check your API Key / Secrets.",
      );
    }

    let webhookData: Record<string, any> = {};

    if (client.setupWebhooks && input.webhookUrl) {
      try {
        const wh = await client.setupWebhooks(
          { ...ctx, config: input.config },
          input.webhookUrl,
        );

        if (!wh.success || !wh.data) {
          throw createError(
            RevstackErrorCode.UnknownError,
            "Failed to setup webhooks in Stripe",
          );
        }

        webhookData = {
          webhookEndpointId: wh.data.webhookEndpointId,
          webhookSecret: wh.data.webhookSecret,
        };
      } catch (error: any) {
        console.warn("Webhook setup failed (non-fatal):", error.message);
      }
    }

    return {
      success: true,
      data: {
        ...input.config,
        ...webhookData,
        _providerVersion: installVersion,
      },
    };
  }

  async onUninstall(
    ctx: ProviderContext,
    input: UninstallInput,
  ): Promise<boolean> {
    const client = getClient(input.config);

    if (client.removeWebhooks && input.data.webhookEndpointId) {
      try {
        await client.removeWebhooks(ctx, input.data.webhookEndpointId);
      } catch (e) {
        console.warn("Failed to remove webhook on uninstall:", e);
      }
    }
    return true;
  }

  async verifyWebhookSignature(
    ctx: ProviderContext,
    payload: string | Buffer,
    headers: Record<string, string | string[] | undefined>,
    secret: string,
  ): Promise<boolean> {
    const client = getClient(ctx.config);

    return client.verifyWebhookSignature(ctx, payload, headers, secret);
  }

  async parseWebhookEvent(payload: any): Promise<RevstackEvent | null> {
    const client = getClient({});
    return client.parseWebhookEvent(payload);
  }

  async getWebhookResponse(): Promise<WebhookResponse> {
    return { statusCode: 200, body: { received: true } };
  }

  async createPayment(
    ctx: ProviderContext,
    input: CreatePaymentInput,
  ): Promise<PaymentResult> {
    const client = getClient(ctx.config);

    if (!client.createPayment) {
      throw createError(
        RevstackErrorCode.NotImplemented,
        "Create payment not supported",
      );
    }

    return client.createPayment(ctx, input);
  }

  async getPayment(ctx: ProviderContext, id: string): Promise<Payment> {
    const client = getClient(ctx.config);

    if (!client.getPayment) {
      throw createError(
        RevstackErrorCode.NotImplemented,
        "Get payment not supported",
      );
    }

    return client.getPayment(ctx, id);
  }

  async refundPayment(
    ctx: ProviderContext,
    input: RefundPaymentInput,
  ): Promise<Payment> {
    const client = getClient(ctx.config);

    if (!client.refundPayment) {
      throw createError(
        RevstackErrorCode.NotImplemented,
        "Refunds not supported by this provider version",
      );
    }

    return client.refundPayment(ctx, input);
  }

  async listPayments(
    ctx: ProviderContext,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<Payment>> {
    const client = getClient(ctx.config);

    if (!client.listPayments)
      throw createError(
        RevstackErrorCode.NotImplemented,
        "List payments not supported",
      );

    return client.listPayments(ctx, pagination);
  }

  async createSubscription(
    ctx: ProviderContext,
    input: CreateSubscriptionInput,
  ): Promise<SubscriptionResult> {
    const client = getClient(ctx.config);

    if (!client.createSubscription)
      throw createError(
        RevstackErrorCode.NotImplemented,
        "Subscriptions not supported",
      );

    return client.createSubscription(ctx, input);
  }

  async getSubscription(
    ctx: ProviderContext,
    id: string,
  ): Promise<Subscription> {
    const client = getClient(ctx.config);

    if (!client.getSubscription)
      throw createError(
        RevstackErrorCode.NotImplemented,
        "Get subscription not supported",
      );

    return client.getSubscription(ctx, id);
  }

  async cancelSubscription(
    ctx: ProviderContext,
    id: string,
    reason?: string,
  ): Promise<SubscriptionResult> {
    const client = getClient(ctx.config);

    if (!client.cancelSubscription)
      throw createError(
        RevstackErrorCode.NotImplemented,
        "Cancel subscription not supported",
      );

    return client.cancelSubscription(ctx, id, reason);
  }

  async pauseSubscription(
    ctx: ProviderContext,
    id: string,
    reason?: string,
  ): Promise<SubscriptionResult> {
    const client = getClient(ctx.config);

    if (!client.pauseSubscription)
      throw createError(
        RevstackErrorCode.NotImplemented,
        "Pause subscription not supported",
      );

    return client.pauseSubscription(ctx, id, reason);
  }

  async resumeSubscription(
    ctx: ProviderContext,
    id: string,
    reason?: string,
  ): Promise<SubscriptionResult> {
    const client = getClient(ctx.config);

    if (!client.resumeSubscription)
      throw createError(
        RevstackErrorCode.NotImplemented,
        "Resume subscription not supported",
      );

    return client.resumeSubscription(ctx, id, reason);
  }

  async createCheckoutSession(
    ctx: ProviderContext,
    input: CheckoutSessionInput,
  ): Promise<CheckoutSessionResult> {
    const client = getClient(ctx.config);

    if (!client.createCheckoutSession)
      throw createError(
        RevstackErrorCode.NotImplemented,
        "Checkout not supported",
      );

    return client.createCheckoutSession(ctx, input);
  }

  async createCustomer(
    ctx: ProviderContext,
    input: CreateCustomerInput,
  ): Promise<Customer> {
    const client = getClient(ctx.config);

    if (!client.createCustomer)
      throw createError(
        RevstackErrorCode.NotImplemented,
        "Customer management not supported",
      );

    return client.createCustomer(ctx, input);
  }

  async updateCustomer(
    ctx: ProviderContext,
    id: string,
    input: UpdateCustomerInput,
  ): Promise<Customer> {
    const client = getClient(ctx.config);

    if (!client.updateCustomer)
      throw createError(
        RevstackErrorCode.NotImplemented,
        "Customer update not supported",
      );

    return client.updateCustomer(ctx, id, input);
  }

  async deleteCustomer(ctx: ProviderContext, id: string): Promise<boolean> {
    const client = getClient(ctx.config);

    if (!client.deleteCustomer)
      throw createError(
        RevstackErrorCode.NotImplemented,
        "Customer deletion not supported",
      );

    return client.deleteCustomer(ctx, id);
  }

  async getCustomer(ctx: ProviderContext, id: string): Promise<Customer> {
    const client = getClient(ctx.config);

    if (!client.getCustomer)
      throw createError(
        RevstackErrorCode.NotImplemented,
        "Get customer not supported",
      );

    return client.getCustomer(ctx, id);
  }

  async listPaymentMethods(
    ctx: ProviderContext,
    customerId: string,
  ): Promise<PaymentMethod[]> {
    const client = getClient(ctx.config);

    if (!client.listPaymentMethods)
      throw createError(
        RevstackErrorCode.NotImplemented,
        "List payment methods not supported",
      );

    return client.listPaymentMethods(ctx, customerId);
  }

  async deletePaymentMethod(
    ctx: ProviderContext,
    id: string,
  ): Promise<boolean> {
    const client = getClient(ctx.config);

    if (!client.deletePaymentMethod)
      throw createError(
        RevstackErrorCode.NotImplemented,
        "Delete payment method not supported",
      );

    return client.deletePaymentMethod(ctx, id);
  }
}
