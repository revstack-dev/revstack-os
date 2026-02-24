import { getClient } from "@/clients/factory";
import { manifest } from "@/manifest";
import {
  AsyncActionResult,
  BaseProvider,
  CheckoutSessionInput,
  CheckoutSessionResult,
  CreateCustomerInput,
  CreatePaymentInput,
  CreateSubscriptionInput,
  Customer,
  InstallInput,
  InstallResult,
  PaginatedResult,
  PaginationOptions,
  Payment,
  PaymentMethod,
  ProviderContext,
  RefundPaymentInput,
  RevstackErrorCode,
  RevstackEvent,
  Subscription,
  UninstallInput,
  UpdateCustomerInput,
  WebhookResponse,
} from "@revstackhq/providers-core";

export class StripeProvider extends BaseProvider {
  static manifest = manifest;
  manifest = manifest;

  async onInstall(
    ctx: ProviderContext,
    input: InstallInput
  ): Promise<AsyncActionResult<InstallResult>> {
    const client = getClient(input.config);
    const installVersion = manifest.version;

    const isValid = await client.validateCredentials({
      ...ctx,
      config: input.config,
    });

    if (!isValid) {
      return {
        data: { success: false },
        status: "failed",
        error: {
          code: RevstackErrorCode.InvalidCredentials,
          message:
            "Failed to connect to provider. Please check your API Key / Secrets.",
        },
      };
    }

    let webhookData: Record<string, any> = {};

    if (client.setupWebhooks && input.webhookUrl) {
      try {
        const wh = await client.setupWebhooks(
          { ...ctx, config: input.config },
          input.webhookUrl
        );

        const whData = wh.data as InstallResult;

        if (!wh.data || !whData.success) {
          return {
            data: { success: false },
            status: "failed",
            error: {
              code: RevstackErrorCode.UnknownError,
              message: "Failed to setup webhooks in Stripe",
            },
          };
        }

        webhookData = {
          webhookEndpointId: whData.data?.webhookEndpointId,
          webhookSecret: whData.data?.webhookSecret,
        };
      } catch (error: any) {
        console.warn("Webhook setup failed (non-fatal):", error.message);
        return {
          data: { success: false },
          status: "failed",
          error: {
            code: RevstackErrorCode.MisconfiguredProvider,
            message: `Webhook setup failed: ${error.message}`,
          },
        };
      }
    }

    return {
      data: {
        success: true,
        data: {
          ...input.config,
          ...webhookData,
          _providerVersion: installVersion,
        },
      },
      status: "success",
    };
  }

  async onUninstall(
    ctx: ProviderContext,
    input: UninstallInput
  ): Promise<AsyncActionResult<boolean>> {
    const client = getClient(input.config);

    if (client.removeWebhooks && input.data.webhookEndpointId) {
      try {
        await client.removeWebhooks(
          ctx,
          input.data.webhookEndpointId as string
        );
      } catch (e) {
        console.warn("Failed to remove webhook on uninstall:", e);
      }
    }
    return {
      data: true,
      status: "success",
    };
  }

  async verifyWebhookSignature(
    ctx: ProviderContext,
    payload: string | Buffer,
    headers: Record<string, string | string[] | undefined>,
    secret: string
  ): Promise<AsyncActionResult<boolean>> {
    const client = getClient(ctx.config);
    return client.verifyWebhookSignature(ctx, payload, headers, secret);
  }

  async parseWebhookEvent(
    ctx: ProviderContext,
    payload: any
  ): Promise<AsyncActionResult<RevstackEvent | null>> {
    const client = getClient(ctx.config);
    return client.parseWebhookEvent(payload);
  }

  async getWebhookResponse(): Promise<AsyncActionResult<WebhookResponse>> {
    return {
      data: { statusCode: 200, body: { received: true } },
      status: "success",
    };
  }

  // ===========================================================================
  // PAYMENTS
  // ===========================================================================

  async createPayment(
    ctx: ProviderContext,
    input: CreatePaymentInput
  ): Promise<AsyncActionResult<Payment>> {
    const client = getClient(ctx.config);

    if (!client.createPayment) {
      return {
        data: null,
        status: "failed",
        error: {
          code: RevstackErrorCode.NotImplemented,
          message: `Provider '${this.manifest.slug}' does not support createPayment.`,
        },
      };
    }

    return client.createPayment(ctx, input);
  }

  async getPayment(
    ctx: ProviderContext,
    id: string
  ): Promise<AsyncActionResult<Payment>> {
    const client = getClient(ctx.config);

    if (!client.getPayment) {
      return {
        data: null,
        status: "failed",
        error: {
          code: RevstackErrorCode.NotImplemented,
          message: "Get payment not supported",
        },
      };
    }

    return client.getPayment(ctx, id);
  }

  async refundPayment(
    ctx: ProviderContext,
    input: RefundPaymentInput
  ): Promise<AsyncActionResult<Payment>> {
    const client = getClient(ctx.config);

    if (!client.refundPayment) {
      return {
        data: null,
        status: "failed",
        error: {
          code: RevstackErrorCode.NotImplemented,
          message: "Refunds not supported by this provider version",
        },
      };
    }

    return client.refundPayment(ctx, input);
  }

  async listPayments(
    ctx: ProviderContext,
    pagination: PaginationOptions
  ): Promise<AsyncActionResult<PaginatedResult<Payment>>> {
    const client = getClient(ctx.config);

    if (!client.listPayments) {
      return {
        data: null,
        status: "failed",
        error: {
          code: RevstackErrorCode.NotImplemented,
          message: "List payments not supported",
        },
      };
    }

    return client.listPayments(ctx, pagination);
  }

  // ===========================================================================
  // SUBSCRIPTIONS
  // ===========================================================================

  async createSubscription(
    ctx: ProviderContext,
    input: CreateSubscriptionInput
  ): Promise<AsyncActionResult<Subscription>> {
    const client = getClient(ctx.config);

    if (!client.createSubscription) {
      return {
        data: null,
        status: "failed",
        error: {
          code: RevstackErrorCode.NotImplemented,
          message: "Subscriptions not supported",
        },
      };
    }

    return client.createSubscription(ctx, input);
  }

  async getSubscription(
    ctx: ProviderContext,
    id: string
  ): Promise<AsyncActionResult<Subscription>> {
    const client = getClient(ctx.config);

    if (!client.getSubscription) {
      return {
        data: null,
        status: "failed",
        error: {
          code: RevstackErrorCode.NotImplemented,
          message: "Get subscription not supported",
        },
      };
    }

    return client.getSubscription(ctx, id);
  }

  async cancelSubscription(
    ctx: ProviderContext,
    id: string,
    reason?: string
  ): Promise<AsyncActionResult<Subscription>> {
    const client = getClient(ctx.config);

    if (!client.cancelSubscription) {
      return {
        data: null,
        status: "failed",
        error: {
          code: RevstackErrorCode.NotImplemented,
          message: "Cancel subscription not supported",
        },
      };
    }

    return client.cancelSubscription(ctx, id, reason);
  }

  async pauseSubscription(
    ctx: ProviderContext,
    id: string,
    reason?: string
  ): Promise<AsyncActionResult<Subscription>> {
    const client = getClient(ctx.config);

    if (!client.pauseSubscription) {
      return {
        data: null,
        status: "failed",
        error: {
          code: RevstackErrorCode.NotImplemented,
          message: "Pause subscription not supported",
        },
      };
    }

    return client.pauseSubscription(ctx, id, reason);
  }

  async resumeSubscription(
    ctx: ProviderContext,
    id: string,
    reason?: string
  ): Promise<AsyncActionResult<Subscription>> {
    const client = getClient(ctx.config);

    if (!client.resumeSubscription) {
      return {
        data: null,
        status: "failed",
        error: {
          code: RevstackErrorCode.NotImplemented,
          message: "Resume subscription not supported",
        },
      };
    }

    return client.resumeSubscription(ctx, id, reason);
  }

  // ===========================================================================
  // CHECKOUT
  // ===========================================================================

  async createCheckoutSession(
    ctx: ProviderContext,
    input: CheckoutSessionInput
  ): Promise<AsyncActionResult<CheckoutSessionResult>> {
    const client = getClient(ctx.config);

    if (!client.createCheckoutSession) {
      return {
        data: null,
        status: "failed",
        error: {
          code: RevstackErrorCode.NotImplemented,
          message: "Checkout not supported",
        },
      };
    }

    return client.createCheckoutSession(ctx, input);
  }

  // ===========================================================================
  // CUSTOMERS
  // ===========================================================================

  async createCustomer(
    ctx: ProviderContext,
    input: CreateCustomerInput
  ): Promise<AsyncActionResult<Customer>> {
    const client = getClient(ctx.config);

    if (!client.createCustomer) {
      return {
        data: null,
        status: "failed",
        error: {
          code: RevstackErrorCode.NotImplemented,
          message: "Customer management not supported",
        },
      };
    }

    return client.createCustomer(ctx, input);
  }

  async updateCustomer(
    ctx: ProviderContext,
    id: string,
    input: UpdateCustomerInput
  ): Promise<AsyncActionResult<Customer>> {
    const client = getClient(ctx.config);

    if (!client.updateCustomer) {
      return {
        data: null,
        status: "failed",
        error: {
          code: RevstackErrorCode.NotImplemented,
          message: "Customer update not supported",
        },
      };
    }

    return client.updateCustomer(ctx, id, input);
  }

  async deleteCustomer(
    ctx: ProviderContext,
    id: string
  ): Promise<AsyncActionResult<boolean>> {
    const client = getClient(ctx.config);

    if (!client.deleteCustomer) {
      return {
        data: false,
        status: "failed",
        error: {
          code: RevstackErrorCode.NotImplemented,
          message: "Customer deletion not supported",
        },
      };
    }

    return client.deleteCustomer(ctx, id);
  }

  async getCustomer(
    ctx: ProviderContext,
    id: string
  ): Promise<AsyncActionResult<Customer>> {
    const client = getClient(ctx.config);

    if (!client.getCustomer) {
      return {
        data: null,
        status: "failed",
        error: {
          code: RevstackErrorCode.NotImplemented,
          message: "Get customer not supported",
        },
      };
    }

    return client.getCustomer(ctx, id);
  }

  // ===========================================================================
  // PAYMENT METHODS
  // ===========================================================================

  async listPaymentMethods(
    ctx: ProviderContext,
    customerId: string
  ): Promise<AsyncActionResult<PaymentMethod[]>> {
    const client = getClient(ctx.config);

    if (!client.listPaymentMethods) {
      return {
        data: null,
        status: "failed",
        error: {
          code: RevstackErrorCode.NotImplemented,
          message: "List payment methods not supported",
        },
      };
    }

    return client.listPaymentMethods(ctx, customerId);
  }

  async deletePaymentMethod(
    ctx: ProviderContext,
    id: string
  ): Promise<AsyncActionResult<boolean>> {
    const client = getClient(ctx.config);

    if (!client.deletePaymentMethod) {
      return {
        data: false,
        status: "failed",
        error: {
          code: RevstackErrorCode.NotImplemented,
          message: "Delete payment method not supported",
        },
      };
    }

    return client.deletePaymentMethod(ctx, id);
  }
}
