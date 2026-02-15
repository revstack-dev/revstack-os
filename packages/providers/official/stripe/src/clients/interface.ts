import {
  ProviderContext,
  CreatePaymentInput,
  RefundPaymentInput,
  Payment,
  PaginationOptions,
  PaginatedResult,
  CreateSubscriptionInput,
  Subscription,
  CheckoutSessionInput,
  CheckoutSessionResult,
  CreateCustomerInput,
  Customer,
  UpdateCustomerInput,
  PaymentMethod,
  RevstackEvent,
  InstallResult,
  AsyncActionResult,
} from "@revstackhq/providers-core";

export interface ProviderClient {
  validateCredentials(
    ctx: ProviderContext,
  ): Promise<AsyncActionResult<boolean>>;

  setupWebhooks?(
    ctx: ProviderContext,
    webhookUrl: string,
  ): Promise<AsyncActionResult<InstallResult>>;

  removeWebhooks?(
    ctx: ProviderContext,
    webhookId: string,
  ): Promise<AsyncActionResult<boolean>>;

  createPayment?(
    ctx: ProviderContext,
    input: CreatePaymentInput,
  ): Promise<AsyncActionResult<Payment>>;

  getPayment?(
    ctx: ProviderContext,
    id: string,
  ): Promise<AsyncActionResult<Payment>>;

  refundPayment?(
    ctx: ProviderContext,
    input: RefundPaymentInput,
  ): Promise<AsyncActionResult<Payment>>;

  listPayments?(
    ctx: ProviderContext,
    pagination: PaginationOptions,
  ): Promise<AsyncActionResult<PaginatedResult<Payment>>>;

  createSubscription?(
    ctx: ProviderContext,
    input: CreateSubscriptionInput,
  ): Promise<AsyncActionResult<Subscription>>;

  getSubscription?(
    ctx: ProviderContext,
    id: string,
  ): Promise<AsyncActionResult<Subscription>>;

  cancelSubscription?(
    ctx: ProviderContext,
    id: string,
    reason?: string,
  ): Promise<AsyncActionResult<Subscription>>;

  pauseSubscription?(
    ctx: ProviderContext,
    id: string,
    reason?: string,
  ): Promise<AsyncActionResult<Subscription>>;

  resumeSubscription?(
    ctx: ProviderContext,
    id: string,
    reason?: string,
  ): Promise<AsyncActionResult<Subscription>>;

  createCheckoutSession?(
    ctx: ProviderContext,
    input: CheckoutSessionInput,
  ): Promise<AsyncActionResult<CheckoutSessionResult>>;

  createCustomer?(
    ctx: ProviderContext,
    input: CreateCustomerInput,
  ): Promise<AsyncActionResult<Customer>>;

  updateCustomer?(
    ctx: ProviderContext,
    id: string,
    input: UpdateCustomerInput,
  ): Promise<AsyncActionResult<Customer>>;

  deleteCustomer?(
    ctx: ProviderContext,
    id: string,
  ): Promise<AsyncActionResult<boolean>>;

  getCustomer?(
    ctx: ProviderContext,
    id: string,
  ): Promise<AsyncActionResult<Customer>>;

  listPaymentMethods?(
    ctx: ProviderContext,
    customerId: string,
  ): Promise<AsyncActionResult<PaymentMethod[]>>;

  deletePaymentMethod?(
    ctx: ProviderContext,
    id: string,
  ): Promise<AsyncActionResult<boolean>>;

  verifyWebhookSignature(
    ctx: ProviderContext,
    payload: string | Buffer,
    headers: Record<string, string | string[] | undefined>,
    secret: string,
  ): Promise<AsyncActionResult<boolean>>;

  parseWebhookEvent(
    payload: any,
  ): Promise<AsyncActionResult<RevstackEvent | null>>;
}
