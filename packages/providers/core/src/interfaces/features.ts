import { ProviderContext } from "@/context";
import { ProviderManifest } from "@/manifest";
import { RevstackEvent, WebhookResponse } from "@/types/events";
import { InstallInput, InstallResult, UninstallInput } from "@/types/lifecycle";
import {
  CreatePaymentInput,
  PaymentResult,
  CreateSubscriptionInput,
  SubscriptionResult,
  CheckoutSessionInput,
  CheckoutSessionResult,
  Subscription,
  CreateCustomerInput,
  Customer,
  UpdateCustomerInput,
  PaymentMethod,
  RefundPaymentInput,
  Payment,
  PaginationOptions,
  PaginatedResult,
} from "@/types/models";

export interface IPaymentFeature {
  createPayment(
    ctx: ProviderContext,
    input: CreatePaymentInput,
  ): Promise<PaymentResult>;
  getPayment(ctx: ProviderContext, id: string): Promise<Payment>;
  refundPayment(
    ctx: ProviderContext,
    input: RefundPaymentInput,
  ): Promise<Payment>;
  // Optional: List payments
  listPayments?(
    ctx: ProviderContext,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<Payment>>;
}

export interface ISubscriptionFeature {
  createSubscription(
    ctx: ProviderContext,
    input: CreateSubscriptionInput,
  ): Promise<SubscriptionResult>;
  cancelSubscription(
    ctx: ProviderContext,
    id: string,
    reason?: string,
  ): Promise<SubscriptionResult>;
  pauseSubscription(
    ctx: ProviderContext,
    id: string,
  ): Promise<SubscriptionResult>;
  resumeSubscription(
    ctx: ProviderContext,
    id: string,
  ): Promise<SubscriptionResult>;
  getSubscription(ctx: ProviderContext, id: string): Promise<Subscription>;
}

export interface ICheckoutFeature {
  createCheckoutSession(
    ctx: ProviderContext,
    input: CheckoutSessionInput,
  ): Promise<CheckoutSessionResult>;
}

export interface ICustomerFeature {
  createCustomer(
    ctx: ProviderContext,
    input: CreateCustomerInput,
  ): Promise<Customer>;
  updateCustomer(
    ctx: ProviderContext,
    id: string,
    input: UpdateCustomerInput,
  ): Promise<Customer>;
  deleteCustomer(ctx: ProviderContext, id: string): Promise<boolean>;
  getCustomer(ctx: ProviderContext, id: string): Promise<Customer>;
}

export interface IPaymentMethodFeature {
  listPaymentMethods(
    ctx: ProviderContext,
    customerId: string,
  ): Promise<PaymentMethod[]>;
  deletePaymentMethod(ctx: ProviderContext, id: string): Promise<boolean>;
}

/**
 * Unified interface that all providers must satisfy.
 * (Even if they just throw 'Not Implemented' errors for unsupported features).
 */
export interface IProvider
  extends
    IPaymentFeature,
    ISubscriptionFeature,
    ICheckoutFeature,
    ICustomerFeature,
    IPaymentMethodFeature {
  // ==========================================================
  // METADATA (Required by Core at runtime)
  // ==========================================================
  readonly manifest: ProviderManifest;

  // ==========================================================
  // LIFECYCLE (Installation/Uninstallation)
  // ==========================================================
  onInstall(ctx: ProviderContext, input: InstallInput): Promise<InstallResult>;
  onUninstall(ctx: ProviderContext, input: UninstallInput): Promise<boolean>;

  // ==========================================================
  // WEBHOOKS (Required for endpoint processing)
  // ==========================================================
  /**
   * Validates the authenticity of the incoming webhook request.
   */
  verifyWebhookSignature(
    ctx: ProviderContext,
    payload: string | Buffer,
    headers: Record<string, string | string[] | undefined>,
    secret: string,
  ): Promise<boolean>;

  /**
   * Maps provider-specific payloads into standardized Revstack events.
   */
  parseWebhookEvent(payload: any): Promise<RevstackEvent | null>;

  /**
   * Returns the expected HTTP response for the provider's webhook acknowledgment.
   */
  getWebhookResponse(): Promise<WebhookResponse>;
}
