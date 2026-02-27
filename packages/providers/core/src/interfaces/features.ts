import { ProviderContext } from "@/context";
import { ProviderManifest } from "@/manifest";
import { RevstackEvent, WebhookResponse } from "@/types/events";
import { InstallInput, InstallResult, UninstallInput } from "@/types/lifecycle";
import {
  CreatePaymentInput,
  CreateSubscriptionInput,
  UpdateSubscriptionInput,
  CheckoutSessionInput,
  CheckoutSessionResult,
  BillingPortalInput,
  BillingPortalResult,
  SetupPaymentMethodInput,
  Subscription,
  CreateCustomerInput,
  Customer,
  UpdateCustomerInput,
  PaymentMethod,
  RefundPaymentInput,
  Payment,
  PaginationOptions,
  PaginatedResult,
  AsyncActionResult,
} from "@/types/models";

/**
 * Interface for One-Time Payment operations.
 * Handles the lifecycle of a single transaction (Auth, Capture, Refund).
 */
export interface IPaymentFeature {
  /**
   * Initiates a one-time payment transaction.
   *
   * Depending on the provider and configuration, this may return:
   * - `success`: Payment was authorized or captured immediately.
   * - `requires_action`: The user must be redirected (3DS, Bank Redirect, Hosted Checkout).
   * - `pending`: The payment is processing asynchronously (e.g., Boleto, Wire).
   *
   * @param ctx - The execution context containing decrypted credentials and trace IDs.
   * @param input - The payment details (amount, currency, customer, method).
   * @returns The entity ID wrapped in an AsyncActionResult.
   */
  createPayment(
    ctx: ProviderContext,
    input: CreatePaymentInput,
  ): Promise<AsyncActionResult<string>>;

  /**
   * Retrieves the current status and details of a specific payment.
   * Useful for polling status updates or displaying transaction history.
   *
   * @param ctx - The execution context.
   * @param id - The Provider's external ID (e.g., `pi_123...`).
   */
  getPayment(
    ctx: ProviderContext,
    id: string,
  ): Promise<AsyncActionResult<Payment>>;

  /**
   * Refunds a payment, either partially or in full.
   *
   * @param ctx - The execution context.
   * @param input - Contains the payment ID, amount to refund, and reason.
   */
  refundPayment(
    ctx: ProviderContext,
    input: RefundPaymentInput,
  ): Promise<AsyncActionResult<string>>;

  /**
   * Lists historical payments with pagination support.
   *
   * @param ctx - The execution context.
   * @param pagination - Options for limit and cursor-based navigation.
   */
  listPayments?(
    ctx: ProviderContext,
    pagination: PaginationOptions,
  ): Promise<AsyncActionResult<PaginatedResult<Payment>>>;

  /**
   * Captures a previously authorized payment.
   * Only applicable when `capture: true` is set in capabilities.
   *
   * @param ctx - The execution context.
   * @param id - The Payment ID to capture.
   * @param amount - Optional amount to capture (partial capture).
   */
  capturePayment?(
    ctx: ProviderContext,
    id: string,
    amount?: number,
  ): Promise<AsyncActionResult<string>>;
}

/**
 * Interface for Recurring Billing operations.
 * Manages the lifecycle of subscriptions (Start, Stop, Pause, Resume).
 */
export interface ISubscriptionFeature {
  /**
   * Creates a new recurring subscription.
   * Usually involves setting up a billing schedule and charging the first period.
   *
   * @param ctx - The execution context.
   * @param input - Customer ID, Price/Plan ID, and trial configuration.
   */
  createSubscription(
    ctx: ProviderContext,
    input: CreateSubscriptionInput,
  ): Promise<AsyncActionResult<string>>;

  /**
   * Cancels an active subscription.
   *
   * Standard behavior should be `cancel_at_period_end` to avoid pro-ration issues,
   * unless immediate cancellation is explicitly required by logic.
   *
   * @param ctx - The execution context.
   * @param id - The Subscription ID.
   * @param reason - Optional reason for churn analysis (e.g., "too_expensive").
   */
  cancelSubscription(
    ctx: ProviderContext,
    id: string,
    reason?: string,
  ): Promise<AsyncActionResult<string>>;

  /**
   * Temporarily halts billing and service access without deleting the subscription.
   * Used for "keep-your-data" flows.
   *
   * @param ctx - The execution context.
   * @param id - The Subscription ID.
   */
  pauseSubscription(
    ctx: ProviderContext,
    id: string,
  ): Promise<AsyncActionResult<string>>;

  /**
   * Reactivates a paused subscription, resuming the billing cycle.
   *
   * @param ctx - The execution context.
   * @param id - The Subscription ID.
   */
  resumeSubscription(
    ctx: ProviderContext,
    id: string,
  ): Promise<AsyncActionResult<string>>;

  /**
   * Retrieves the latest state of a subscription.
   *
   * @param ctx - The execution context.
   * @param id - The Subscription ID.
   */
  getSubscription(
    ctx: ProviderContext,
    id: string,
  ): Promise<AsyncActionResult<Subscription>>;

  /**
   * Lists subscriptions with pagination.
   */
  listSubscriptions?(
    ctx: ProviderContext,
    pagination: PaginationOptions,
  ): Promise<AsyncActionResult<PaginatedResult<Subscription>>>;

  /**
   * Updates an existing subscription (e.g., upgrade/downgrade plan, change quantity).
   *
   * @param ctx - The execution context.
   * @param id - The Subscription ID.
   * @param input - Fields to update.
   */
  updateSubscription?(
    ctx: ProviderContext,
    id: string,
    input: UpdateSubscriptionInput,
  ): Promise<AsyncActionResult<string>>;
}

/**
 * Interface for Hosted Checkout operations.
 * Generates secure URLs for off-site payment pages (e.g., Stripe Checkout).
 */
export interface ICheckoutFeature {
  /**
   * Generates a hosted checkout session URL.
   *
   * This is the preferred integration method for security compliance, as it
   * offloads PCI-DSS responsibility to the provider.
   *
   * @param ctx - The execution context.
   * @param input - Line items, success/cancel URLs, and mode (payment/subscription).
   * @returns A result containing the `nextAction.url` for redirection.
   */
  createCheckoutSession(
    ctx: ProviderContext,
    input: CheckoutSessionInput,
  ): Promise<AsyncActionResult<CheckoutSessionResult>>;

  /**
   * Creates a setup-mode checkout session to save a payment method.
   */
  setupPaymentMethod?(
    ctx: ProviderContext,
    input: SetupPaymentMethodInput,
  ): Promise<AsyncActionResult<CheckoutSessionResult>>;

  /**
   * Creates a billing portal session for customer self-service.
   */
  createBillingPortalSession?(
    ctx: ProviderContext,
    input: BillingPortalInput,
  ): Promise<AsyncActionResult<BillingPortalResult>>;
}

/**
 * Interface for Customer Management.
 * Syncs user identities between Revstack and the Payment Provider.
 */
export interface ICustomerFeature {
  /**
   * Creates a customer profile in the provider's system.
   * This allows attaching payment methods and subscriptions to a user.
   *
   * @param ctx - The execution context.
   * @param input - Email, Name, Phone, and Address.
   */
  createCustomer(
    ctx: ProviderContext,
    input: CreateCustomerInput,
  ): Promise<AsyncActionResult<Customer>>;

  /**
   * Updates an existing customer's details (e.g., changing email or address).
   *
   * @param ctx - The execution context.
   * @param id - The Provider's Customer ID (e.g., `cus_123`).
   * @param input - The fields to update.
   */
  updateCustomer(
    ctx: ProviderContext,
    id: string,
    input: UpdateCustomerInput,
  ): Promise<AsyncActionResult<Customer>>;

  /**
   * Deletes (or archives) a customer in the provider's system.
   * Note: Some providers only support soft-deletes.
   *
   * @param ctx - The execution context.
   * @param id - The Provider's Customer ID.
   */
  deleteCustomer(
    ctx: ProviderContext,
    id: string,
  ): Promise<AsyncActionResult<boolean>>;

  /**
   * Retrieves customer details.
   *
   * @param ctx - The execution context.
   * @param id - The Provider's Customer ID.
   */
  getCustomer(
    ctx: ProviderContext,
    id: string,
  ): Promise<AsyncActionResult<Customer>>;

  /**
   * Lists customers with pagination.
   */
  listCustomers?(
    ctx: ProviderContext,
    pagination: PaginationOptions,
  ): Promise<AsyncActionResult<PaginatedResult<Customer>>>;
}

/**
 * Interface for managing saved Payment Instruments (Vaulting).
 */
export interface IPaymentMethodFeature {
  /**
   * Lists all valid payment methods (cards, bank accounts) attached to a customer.
   * Useful for "My Wallet" or "Change Payment Method" screens.
   *
   * @param ctx - The execution context.
   * @param customerId - The Provider's Customer ID.
   */
  listPaymentMethods(
    ctx: ProviderContext,
    customerId: string,
  ): Promise<AsyncActionResult<PaymentMethod[]>>;

  /**
   * Detaches or deletes a payment method from a customer.
   * Prevents future charges on that instrument.
   *
   * @param ctx - The execution context.
   * @param id - The Payment Method ID (e.g., `pm_123`).
   */
  deletePaymentMethod(
    ctx: ProviderContext,
    id: string,
  ): Promise<AsyncActionResult<boolean>>;
}

/**
 * Unified interface that all providers must satisfy.
 *
 * This aggregate interface serves as the main contract for the Revstack Core.
 * Any method not supported by a specific provider (e.g., "PayPal doesn't support Pause")
 * must still be implemented but should return a `status: 'failed'` result with
 * `RevstackErrorCode.NotImplemented`.
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
  /**
   * Static definition of the provider's capabilities, version, and config schema.
   * Used by the Core to render UI and validate features.
   */
  readonly manifest: ProviderManifest;

  // ==========================================================
  // LIFECYCLE (Installation/Uninstallation)
  // ==========================================================
  /**
   * Called when a merchant installs or updates this provider.
   *
   * RESPONSIBILITIES:
   * 1. Validate credentials (e.g., by making a 'ping' request).
   * 2. Automatically register webhooks (if `webhookUrl` is provided).
   * 3. Return encrypted configuration data to be stored in the DB.
   */
  onInstall(
    ctx: ProviderContext,
    input: InstallInput,
  ): Promise<AsyncActionResult<InstallResult>>;

  /**
   * Called when a merchant uninstalls this provider.
   *
   * RESPONSIBILITIES:
   * 1. Cleanup remote resources (e.g., delete the webhook endpoint in Stripe).
   * 2. Perform any necessary teardown logic.
   */
  onUninstall(
    ctx: ProviderContext,
    input: UninstallInput,
  ): Promise<AsyncActionResult<boolean>>;

  // ==========================================================
  // WEBHOOKS (Required for endpoint processing)
  // ==========================================================
  /**
   * Verifies the cryptographic signature of an incoming webhook request.
   *
   * SECURITY CRITICAL:
   * This ensures that the request actually originated from the Payment Provider
   * and hasn't been tampered with.
   *
   * @param payload - The raw body of the request.
   * @param headers - The HTTP headers (containing signature and timestamp).
   * @param secret - The signing secret stored in the database.
   */
  verifyWebhookSignature(
    ctx: ProviderContext,
    payload: string | Buffer,
    headers: Record<string, string | string[] | undefined>,
    secret: string,
  ): Promise<AsyncActionResult<boolean>>;

  /**
   * Transforms a raw provider payload into a standardized Revstack Event.
   *
   * acts as the "Translation Layer" or "Adapter" for incoming events,
   * converting `payment_intent.succeeded` -> `PAYMENT_SUCCEEDED`.
   *
   * @param ctx - The execution context.
   * @param payload - The raw JSON body from the provider.
   */
  parseWebhookEvent(
    ctx: ProviderContext,
    payload: any,
  ): Promise<AsyncActionResult<RevstackEvent | null>>;

  /**
   * Returns the expected HTTP response for the provider's webhook acknowledgment.
   *
   * Usually returns 200 OK with specific body content required by the provider
   * to stop retrying the event delivery.
   */
  getWebhookResponse(
    ctx: ProviderContext,
  ): Promise<AsyncActionResult<WebhookResponse>>;
}
