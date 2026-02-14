import {
  ProviderContext,
  CreatePaymentInput,
  PaymentResult,
  RefundPaymentInput,
  Payment,
  PaginationOptions,
  PaginatedResult,
  CreateSubscriptionInput,
  SubscriptionResult,
  Subscription,
  CheckoutSessionInput,
  CheckoutSessionResult,
  CreateCustomerInput,
  Customer,
  UpdateCustomerInput,
  PaymentMethod,
  RevstackEvent,
  InstallResult,
} from "@revstackhq/providers-core";

export interface ProviderClient {
  validateCredentials(ctx: ProviderContext): Promise<boolean>;

  setupWebhooks?(
    ctx: ProviderContext,
    webhookUrl: string,
  ): Promise<InstallResult>;

  removeWebhooks?(ctx: ProviderContext, webhookId: string): Promise<boolean>;

  createPayment?(
    ctx: ProviderContext,
    input: CreatePaymentInput,
  ): Promise<PaymentResult>;

  getPayment?(ctx: ProviderContext, id: string): Promise<Payment>;

  refundPayment?(
    ctx: ProviderContext,
    input: RefundPaymentInput,
  ): Promise<Payment>;

  listPayments?(
    ctx: ProviderContext,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<Payment>>;

  createSubscription?(
    ctx: ProviderContext,
    input: CreateSubscriptionInput,
  ): Promise<SubscriptionResult>;

  getSubscription?(ctx: ProviderContext, id: string): Promise<Subscription>;

  cancelSubscription?(
    ctx: ProviderContext,
    id: string,
    reason?: string,
  ): Promise<SubscriptionResult>;

  pauseSubscription?(
    ctx: ProviderContext,
    id: string,
    reason?: string,
  ): Promise<SubscriptionResult>;

  resumeSubscription?(
    ctx: ProviderContext,
    id: string,
    reason?: string,
  ): Promise<SubscriptionResult>;

  createCheckoutSession?(
    ctx: ProviderContext,
    input: CheckoutSessionInput,
  ): Promise<CheckoutSessionResult>;

  createCustomer?(
    ctx: ProviderContext,
    input: CreateCustomerInput,
  ): Promise<Customer>;

  updateCustomer?(
    ctx: ProviderContext,
    id: string,
    input: UpdateCustomerInput,
  ): Promise<Customer>;

  deleteCustomer?(ctx: ProviderContext, id: string): Promise<boolean>;

  getCustomer?(ctx: ProviderContext, id: string): Promise<Customer>;

  listPaymentMethods?(
    ctx: ProviderContext,
    customerId: string,
  ): Promise<PaymentMethod[]>;

  deletePaymentMethod?(ctx: ProviderContext, id: string): Promise<boolean>;

  verifyWebhookSignature(
    ctx: ProviderContext,
    payload: string | Buffer,
    headers: Record<string, string | string[] | undefined>,
    secret: string,
  ): Promise<boolean>;

  parseWebhookEvent(payload: any): Promise<RevstackEvent | null>;
}
