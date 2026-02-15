import { ProviderManifest } from "@/manifest";
import { ProviderContext } from "@/context";
import { InstallInput, InstallResult, UninstallInput } from "@/types/lifecycle";
import { RevstackEvent, WebhookResponse } from "@/types/events";
import { IProvider } from "@/interfaces/features";
import {
  CreatePaymentInput,
  CreateSubscriptionInput,
  CheckoutSessionInput,
  CheckoutSessionResult,
  CreateCustomerInput,
  Customer,
  PaginatedResult,
  PaginationOptions,
  Payment,
  PaymentMethod,
  RefundPaymentInput,
  Subscription,
  UpdateCustomerInput,
  AsyncActionResult,
} from "@/types/models";
import { RevstackErrorCode } from "@/types/errors";

export abstract class BaseProvider implements IProvider {
  private notImplemented(methodName: string): AsyncActionResult<any> {
    return {
      data: null,
      status: "failed",
      error: {
        code: RevstackErrorCode.NotImplemented,
        message: `Provider '${this.manifest.slug}' does not support ${methodName}.`,
      },
    };
  }

  // --- FEATURES ---

  async getPayment(
    ctx: ProviderContext,
    id: string,
  ): Promise<AsyncActionResult<Payment>> {
    return this.notImplemented("getPayment");
  }

  async refundPayment(
    ctx: ProviderContext,
    input: RefundPaymentInput,
  ): Promise<AsyncActionResult<Payment>> {
    return this.notImplemented("refundPayment");
  }

  async listPayments(
    ctx: ProviderContext,
    pagination: PaginationOptions,
  ): Promise<AsyncActionResult<PaginatedResult<Payment>>> {
    return this.notImplemented("listPayments");
  }

  async getSubscription(
    ctx: ProviderContext,
    id: string,
  ): Promise<AsyncActionResult<Subscription>> {
    return this.notImplemented("getSubscription");
  }

  async createCustomer(
    ctx: ProviderContext,
    input: CreateCustomerInput,
  ): Promise<AsyncActionResult<Customer>> {
    return this.notImplemented("createCustomer");
  }

  async updateCustomer(
    ctx: ProviderContext,
    id: string,
    input: UpdateCustomerInput,
  ): Promise<AsyncActionResult<Customer>> {
    return this.notImplemented("updateCustomer");
  }

  async deleteCustomer(
    ctx: ProviderContext,
    id: string,
  ): Promise<AsyncActionResult<boolean>> {
    return this.notImplemented("deleteCustomer");
  }

  async getCustomer(
    ctx: ProviderContext,
    id: string,
  ): Promise<AsyncActionResult<Customer>> {
    return this.notImplemented("getCustomer");
  }

  async listPaymentMethods(
    ctx: ProviderContext,
    customerId: string,
  ): Promise<AsyncActionResult<PaymentMethod[]>> {
    return this.notImplemented("listPaymentMethods");
  }

  async deletePaymentMethod(
    ctx: ProviderContext,
    id: string,
  ): Promise<AsyncActionResult<boolean>> {
    return this.notImplemented("deletePaymentMethod");
  }

  abstract readonly manifest: ProviderManifest;

  // --- LIFECYCLE ---

  abstract onInstall(
    ctx: ProviderContext,
    input: InstallInput,
  ): Promise<AsyncActionResult<InstallResult>>;

  abstract onUninstall(
    ctx: ProviderContext,
    input: UninstallInput,
  ): Promise<AsyncActionResult<boolean>>;

  // --- WEBHOOKS ---

  abstract verifyWebhookSignature(
    ctx: ProviderContext,
    payload: string | Buffer,
    headers: Record<string, string | string[] | undefined>,
    secret: string,
  ): Promise<AsyncActionResult<boolean>>;

  abstract parseWebhookEvent(
    ctx: ProviderContext,
    payload: any,
  ): Promise<AsyncActionResult<RevstackEvent | null>>;

  async getWebhookResponse(
    ctx: ProviderContext,
  ): Promise<AsyncActionResult<WebhookResponse>> {
    return {
      data: {
        statusCode: 200,
        body: { received: true },
      },
      status: "success",
    };
  }

  // --- PAYMENT / SUBSCRIPTION / CHECKOUT (Optional Overrides) ---

  async createPayment(
    ctx: ProviderContext,
    input: CreatePaymentInput,
  ): Promise<AsyncActionResult<Payment>> {
    return this.notImplemented("createPayment");
  }

  async createSubscription(
    ctx: ProviderContext,
    input: CreateSubscriptionInput,
  ): Promise<AsyncActionResult<Subscription>> {
    return this.notImplemented("createSubscription");
  }

  async cancelSubscription(
    ctx: ProviderContext,
    id: string,
    reason?: string,
  ): Promise<AsyncActionResult<Subscription>> {
    return this.notImplemented("cancelSubscription");
  }

  async pauseSubscription(
    ctx: ProviderContext,
    id: string,
    reason?: string,
  ): Promise<AsyncActionResult<Subscription>> {
    return this.notImplemented("pauseSubscription");
  }

  async resumeSubscription(
    ctx: ProviderContext,
    id: string,
    reason?: string,
  ): Promise<AsyncActionResult<Subscription>> {
    return this.notImplemented("resumeSubscription");
  }

  async createCheckoutSession(
    ctx: ProviderContext,
    input: CheckoutSessionInput,
  ): Promise<AsyncActionResult<CheckoutSessionResult>> {
    return this.notImplemented("createCheckoutSession");
  }
}
