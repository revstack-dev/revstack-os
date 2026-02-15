// =============================================================================
// PAYMENT MODELS
// =============================================================================

export enum PaymentStatus {
  /** The payment was created but not yet processed. */
  Pending = "pending",
  /** The payment requires additional user action (e.g., 3DS authentication). */
  RequiresAction = "requires_action",
  /** The payment is authorized but not captured yet. */
  Authorized = "authorized",
  /** The payment completed successfully. */
  Succeeded = "succeeded",
  /** The payment failed. */
  Failed = "failed",
  /** The payment was canceled. */
  Canceled = "canceled",
  /** The payment was fully refunded. */
  Refunded = "refunded",
  /** The payment was partially refunded. */
  PartiallyRefunded = "partially_refunded",
  /** The payment is under dispute. */
  Disputed = "disputed",
}

export type PaymentMethodDetails = {
  /** The high-level payment method category. */
  type: "card" | "bank_transfer" | "wallet" | "crypto" | "checkout";
  /** The card/wallet brand (e.g., visa, mastercard). */
  brand?: string;
  /** Last 4 digits for card-like instruments. */
  last4?: string;
  /** Customer email when available (e.g., wallet payments). */
  email?: string;
  /** Card expiry month (1-12) when available. */
  expiryMonth?: number;
  /** Card expiry year (4-digit) when available. */
  expiryYear?: number;
  /** The cardholder name when available. */
  cardHolderName?: string;
  /** The bank name for bank transfer methods when available. */
  bankName?: string;
};

export type Payment = {
  /** Internal payment identifier in Revstack. */
  id: string;
  /** Provider identifier (e.g., "stripe"). */
  providerId: string;
  /** Provider-side payment identifier (e.g., Stripe PaymentIntent id). */
  externalId: string;
  /** Total amount in the smallest currency unit (e.g., cents). */
  amount: number;
  /** ISO currency code (e.g., "USD"). */
  currency: string;
  /** Current payment status in the Revstack domain model. */
  status: PaymentStatus;

  /** Breakdown of the total amount, when provided by the provider. */
  amountDetails?: {
    /** Subtotal amount in the smallest currency unit. */
    subtotal: number;
    /** Tax amount in the smallest currency unit. */
    tax: number;
    /** Shipping amount in the smallest currency unit. */
    shipping: number;
    /** Discount amount in the smallest currency unit. */
    discount: number;
    /** Processing fee amount in the smallest currency unit, when available. */
    fee?: number;
  };

  /** Amount refunded so far in the smallest currency unit. */
  amountRefunded: number;

  /** Payment method details when available. */
  method?: PaymentMethodDetails;
  /** Optional payment description. */
  description?: string;

  /** Statement descriptor shown on the buyer's bank statement, when supported. */
  statementDescriptor?: string;

  /** Internal customer identifier in Revstack, when applicable. */
  customerId?: string;
  /** Provider-side customer identifier, when applicable. */
  externalCustomerId?: string;

  /** Provider failure code, when the payment fails. */
  failureCode?: string;
  /** Human-readable failure message, when the payment fails. */
  failureMessage?: string;

  /** ISO timestamp when the payment was created. */
  createdAt: string;
  /** ISO timestamp when the payment was last updated, when available. */
  updatedAt?: string;
  /** Arbitrary key-value metadata attached to the payment. */
  metadata?: Record<string, any>;
  /** Raw provider payload for debugging/inspection. */
  raw?: any;
};

// =============================================================================
// SUBSCRIPTION MODELS
// =============================================================================

export enum SubscriptionStatus {
  /** Created but awaiting first successful payment or confirmation. */
  Incomplete = "incomplete",
  /** Incomplete subscription expired before being completed. */
  IncompleteExpired = "incomplete_expired",
  /** Subscription is in trial period. */
  Trialing = "trialing",
  /** Subscription is active. */
  Active = "active",
  /** Subscription is past due (payment failed or pending). */
  PastDue = "past_due",
  /** Subscription has been canceled. */
  Canceled = "canceled",
  /** Subscription is unpaid (final state after retries). */
  Unpaid = "unpaid",
  /** Subscription is paused. */
  Paused = "paused",
}

export type Subscription = {
  /** Internal subscription identifier in Revstack. */
  id: string;
  /** Provider identifier (e.g., "stripe"). */
  providerId: string;
  /** Provider-side subscription identifier. */
  externalId: string;
  /** Current subscription status in the Revstack domain model. */
  status: SubscriptionStatus;

  /** Internal plan identifier in Revstack, when applicable. */
  planId?: string;
  /** Provider-side plan identifier, when applicable. */
  externalPlanId?: string;

  /** Subscription amount in the smallest currency unit. */
  amount: number;
  /** ISO currency code (e.g., "USD"). */
  currency: string;
  /** Billing interval unit. */
  interval: "day" | "week" | "month" | "year";

  /** Internal customer identifier in Revstack. */
  customerId: string;

  /** ISO timestamp of the current billing period start. */
  currentPeriodStart: string;
  /** ISO timestamp of the current billing period end. */
  currentPeriodEnd: string;

  /** Whether the subscription will cancel at the end of the current period. */
  cancelAtPeriodEnd: boolean;
  /** ISO timestamp when the subscription was canceled, when available. */
  canceledAt?: string;
  /** ISO timestamp when the subscription started. */
  startedAt: string;
  /** ISO timestamp when the subscription ended, when available. */
  endedAt?: string;

  /** ISO timestamp when the trial started, when available. */
  trialStart?: string;
  /** ISO timestamp when the trial ends, when available. */
  trialEnd?: string;

  /** ISO timestamp when a paused subscription will resume, when available. */
  pauseResumesAt?: string;

  /** Arbitrary key-value metadata attached to the subscription. */
  metadata?: Record<string, any>;
  /** Raw provider payload for debugging/inspection. */
  raw: any;
};

// =============================================================================
// INPUTS
// =============================================================================

export type CreateCustomerInput = {
  /** Customer email address. */
  email: string;
  /** Customer full name, when available. */
  name?: string;
  /** Customer phone number, when available. */
  phone?: string;
  /** Optional customer description. */
  description?: string;
  /** Customer billing address, when available. */
  address?: Address;
  /** Arbitrary key-value metadata attached to the customer. */
  metadata?: Record<string, any>;
};

export type UpdateCustomerInput = Partial<CreateCustomerInput>;

export type CreatePaymentInput = {
  /** Amount to charge in the smallest currency unit. */
  amount: number;
  /** ISO currency code (e.g., "USD"). */
  currency: string;
  /** Internal customer identifier in Revstack, when applicable. */
  customerId?: string;
  /** Provider-side payment method identifier, when applicable. */
  paymentMethodId?: string;
  /** Optional payment description. */
  description?: string;

  /** Statement descriptor shown on the buyer's bank statement, when supported. */
  statementDescriptor?: string;

  /** Whether to capture immediately (true) or authorize only (false), when supported. */
  capture?: boolean;
  /** URL to redirect the user back after completing required actions. */
  returnUrl?: string;
  /** Billing address for the payment, when supported. */
  billingAddress?: Address;
  /** Shipping address for the payment, when supported. */
  shippingAddress?: Address;
  /** Arbitrary key-value metadata attached to the payment. */
  metadata?: Record<string, any>;
  /** Provider-specific options payload. */
  providerOptions?: any;
};

export type RefundPaymentInput = {
  /** Internal payment identifier in Revstack. */
  paymentId: string;
  /** Provider-side payment identifier, when known. */
  externalPaymentId?: string;
  /** Amount to refund in the smallest currency unit (defaults to full amount). */
  amount?: number;
  /** Refund reason, when supported by the provider. */
  reason?: "duplicate" | "fraudulent" | "requested_by_customer";
  /** Arbitrary key-value metadata attached to the refund request. */
  metadata?: Record<string, any>;
};

export type SetupPaymentMethodInput = {
  /** Internal customer identifier in Revstack. */
  customerId: string;
  /** URL to redirect the user back after setup completes. */
  returnUrl: string;
  /** Arbitrary key-value metadata attached to the setup request. */
  metadata?: Record<string, any>;
};

export type CheckoutSessionInput = {
  /** Internal customer identifier in Revstack, when applicable. */
  customerId?: string;
  /** Customer email address when no customer id exists. */
  customerEmail?: string;

  /** Merchant-provided reference id for reconciling sessions. */
  clientReferenceId?: string;

  /** Whether to save the payment method for future usage, when supported. */
  setupFutureUsage?: boolean;
  /** Items included in the checkout session. */
  lineItems: {
    /** Display name of the item. */
    name: string;
    /** Optional description of the item. */
    description?: string;
    /** Unit amount in the smallest currency unit. */
    amount: number;
    /** Quantity of the item. */
    quantity: number;
    /** ISO currency code (e.g., "USD"). */
    currency: string;
    /** Optional array of image URLs for the item. */
    images?: string[];
    /** Provider-side tax rate identifiers, when supported. */
    taxRates?: string[];
  }[];
  /** URL to redirect the user on successful completion. */
  successUrl: string;
  /** URL to redirect the user on cancellation. */
  cancelUrl: string;
  /** Controls collection of the billing address, when supported. */
  billingAddressCollection?: "auto" | "required";
  /** Checkout mode for the session. */
  mode: "payment" | "subscription" | "setup";

  /** Whether promotion codes are allowed, when supported. */
  allowPromotionCodes?: boolean;

  /** Arbitrary key-value metadata attached to the session. */
  metadata?: Record<string, any>;
};

export type CreateSubscriptionInput = {
  /** Internal customer identifier in Revstack. */
  customerId: string;
  /** Internal plan identifier in Revstack, when applicable. */
  planId?: string;
  /** Provider-side price identifier, when applicable. */
  priceId?: string;
  /** Quantity for metered/seat-based plans, when supported. */
  quantity?: number;
  /** URL to return to after completing subscription flow, when supported. */
  returnUrl?: string;
  /** URL to return to if the user cancels the flow, when supported. */
  cancelUrl?: string;
  /** Trial period length in days, when supported. */
  trialDays?: number;

  /** Internal discount identifier in Revstack, when applicable. */
  discountId?: string;
  /** Provider-side promotion code, when applicable. */
  promotionCode?: string;

  /** Arbitrary key-value metadata attached to the subscription. */
  metadata?: Record<string, any>;
};

// =============================================================================
// RESULTS & SHARED
// =============================================================================

export type ActionStatus = "success" | "pending" | "requires_action" | "failed";

export type AsyncActionResult<T> = {
  /** Result data when available; null if not available or on failure. */
  data: T | null;
  /** Current action status. */
  status: ActionStatus;
  /** Follow-up action required to complete the flow, when applicable. */
  nextAction?: {
    /** Next action type to complete the flow. */
    type: "redirect" | "url_load" | "show_modal";
    /** URL to redirect/load, when applicable. */
    url?: string;
    /** Provider-specific payload for the next step, when applicable. */
    payload?: any;
  };
  /** Error information when the action fails. */
  error?: {
    /** Stable error code for programmatic handling. */
    code: string;
    /** Human-readable error message. */
    message: string;
    /** Provider-specific error details, when available. */
    providerError?: string;
  };
};

export type CheckoutSessionResult = {
  /** Provider-side checkout session identifier. */
  id: string;
  /** ISO timestamp when the session expires, when available. */
  expiresAt?: string;
};

export type PaginationOptions = {
  /** Maximum number of items to return. */
  limit?: number;
  /** Opaque cursor for cursor-based pagination. */
  cursor?: string;
  /** Provider-side startingAfter cursor, when supported. */
  startingAfter?: string;
  /** Page number for page-based pagination, when supported. */
  page?: number;
};

export type PaginatedResult<T> = {
  /** Page items. */
  data: T[];
  /** Whether there are more items after this page. */
  hasMore: boolean;
  /** Opaque cursor for the next page, when available. */
  nextCursor?: string;
};

export type Address = {
  /** Address line 1. */
  line1: string;
  /** Address line 2, when available. */
  line2?: string;
  /** City or locality. */
  city: string;
  /** State/region, when available. */
  state?: string;
  /** Postal or ZIP code. */
  postalCode: string;
  /** Country code (ISO 3166-1 alpha-2). */
  country: string; // ISO 3166-1 alpha-2
};

export type Customer = {
  /** Internal customer identifier in Revstack. */
  id: string;
  /** Provider identifier (e.g., "stripe"). */
  providerId: string;
  /** Provider-side customer identifier. */
  externalId: string;
  /** Customer email address. */
  email: string;
  /** Customer full name, when available. */
  name?: string;
  /** Customer phone number, when available. */
  phone?: string;
  /** Arbitrary key-value metadata attached to the customer. */
  metadata?: Record<string, any>;
  /** ISO timestamp when the customer was created. */
  createdAt: string;
  /** Whether the customer was deleted, when supported. */
  deleted?: boolean;
};

export type PaymentMethod = {
  /** Internal payment method identifier in Revstack. */
  id: string;
  /** Internal customer identifier in Revstack. */
  customerId: string;
  /** Provider-side payment method identifier. */
  externalId: string;
  /** High-level payment method type. */
  type: "card" | "bank_transfer" | "wallet";
  /** Detailed payment method metadata. */
  details: PaymentMethodDetails;
  /** Whether this payment method is the default for the customer. */
  isDefault: boolean;
  /** Arbitrary key-value metadata attached to the payment method. */
  metadata?: Record<string, any>;
};
