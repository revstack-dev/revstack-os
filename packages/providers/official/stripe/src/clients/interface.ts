import {
  ProviderContext,
  CreatePaymentInput,
  RefundPaymentInput,
  Payment,
  PaginationOptions,
  PaginatedResult,
  CreateSubscriptionInput,
  UpdateSubscriptionInput,
  Subscription,
  CheckoutSessionInput,
  CheckoutSessionResult,
  BillingPortalInput,
  BillingPortalResult,
  SetupPaymentMethodInput,
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
  ): Promise<AsyncActionResult<string>>;

  getPayment?(
    ctx: ProviderContext,
    id: string,
  ): Promise<AsyncActionResult<Payment>>;

  refundPayment?(
    ctx: ProviderContext,
    input: RefundPaymentInput,
  ): Promise<AsyncActionResult<string>>;

  listPayments?(
    ctx: ProviderContext,
    pagination: PaginationOptions,
  ): Promise<AsyncActionResult<PaginatedResult<Payment>>>;

  capturePayment?(
    ctx: ProviderContext,
    id: string,
    amount?: number,
  ): Promise<AsyncActionResult<string>>;

  createSubscription?(
    ctx: ProviderContext,
    input: CreateSubscriptionInput,
  ): Promise<AsyncActionResult<string>>;

  getSubscription?(
    ctx: ProviderContext,
    id: string,
  ): Promise<AsyncActionResult<Subscription>>;

  cancelSubscription?(
    ctx: ProviderContext,
    id: string,
    reason?: string,
  ): Promise<AsyncActionResult<string>>;

  pauseSubscription?(
    ctx: ProviderContext,
    id: string,
    reason?: string,
  ): Promise<AsyncActionResult<string>>;

  resumeSubscription?(
    ctx: ProviderContext,
    id: string,
    reason?: string,
  ): Promise<AsyncActionResult<string>>;

  listSubscriptions?(
    ctx: ProviderContext,
    pagination: PaginationOptions,
  ): Promise<AsyncActionResult<PaginatedResult<Subscription>>>;

  updateSubscription?(
    ctx: ProviderContext,
    id: string,
    input: UpdateSubscriptionInput,
  ): Promise<AsyncActionResult<string>>;

  createCheckoutSession?(
    ctx: ProviderContext,
    input: CheckoutSessionInput,
  ): Promise<AsyncActionResult<CheckoutSessionResult>>;

  setupPaymentMethod?(
    ctx: ProviderContext,
    input: SetupPaymentMethodInput,
  ): Promise<AsyncActionResult<CheckoutSessionResult>>;

  createBillingPortalSession?(
    ctx: ProviderContext,
    input: BillingPortalInput,
  ): Promise<AsyncActionResult<BillingPortalResult>>;

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

  listCustomers?(
    ctx: ProviderContext,
    pagination: PaginationOptions,
  ): Promise<AsyncActionResult<PaginatedResult<Customer>>>;

  verifyWebhookSignature(
    ctx: ProviderContext,
    payload: string | Buffer,
    headers: Record<string, string | string[] | undefined>,
    secret: string,
  ): Promise<AsyncActionResult<boolean>>;

  parseWebhookEvent(
    payload: unknown,
  ): Promise<AsyncActionResult<RevstackEvent | null>>;
}
