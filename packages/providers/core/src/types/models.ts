// =============================================================================
// PAYMENT MODELS
// =============================================================================

export enum PaymentStatus {
  /** created but not yet processed */
  Pending = "pending",
  /** requires additional user action (e.g., 3DS authentication) */
  RequiresAction = "requires_action",
  /** authorized but not captured yet */
  Authorized = "authorized",
  /** completed successfully */
  Succeeded = "succeeded",
  /** failed */
  Failed = "failed",
  /** canceled */
  Canceled = "canceled",
  /** fully refunded */
  Refunded = "refunded",
  /** partially refunded */
  PartiallyRefunded = "partially_refunded",
  /** under dispute */
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
  /** revstack internal id */
  id: string;
  /** provider slug (e.g. "stripe") */
  providerId: string;
  /** external provider id (e.g. stripe pi_xxx) */
  externalId: string;
  /** amount in cents */
  amount: number;
  /** iso currency (e.g. USD) */
  currency: string;
  /** normalized revstack status */
  status: PaymentStatus;

  /** amount breakdown */
  amountDetails?: {
    /** subtotal in cents */
    subtotal: number;
    /** tax in cents */
    tax: number;
    /** shipping in cents */
    shipping: number;
    /** discount in cents */
    discount: number;
    /** fee in cents */
    fee?: number;
  };

  /** refunded amount in cents */
  amountRefunded: number;

  /** payment method details when available. */
  method?: PaymentMethodDetails;
  /** optional description */
  description?: string;

  /** bank statement descriptor */
  statementDescriptor?: string;

  /** revstack customer id */
  customerId?: string;
  /** external customer id */
  externalCustomerId?: string;

  /** provider failure code, when the payment fails. */
  failureCode?: string;
  /** failure message, when the payment fails. */
  failureMessage?: string;

  /** iso created at */
  createdAt: string;
  /** iso updated at */
  updatedAt?: string;
  /** custom metadata */
  metadata?: Record<string, any>;
  /** raw provider payload */
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
  /** in trial period */
  Trialing = "trialing",
  /** active */
  Active = "active",
  /** past due (payment failed or pending) */
  PastDue = "past_due",
  /** has been canceled */
  Canceled = "canceled",
  /** unpaid (final state after retries) */
  Unpaid = "unpaid",
  /** paused */
  Paused = "paused",
}

export type Subscription = {
  /** revstack subscription id */
  id: string;
  /** provider slug (e.g. "stripe") */
  providerId: string;
  /** external subscription id */
  externalId: string;
  /** normalized status */
  status: SubscriptionStatus;

  /** revstack plan id */
  planId?: string;
  /** external plan id */
  externalPlanId?: string;

  /** amount in the smallest currency unit */
  amount: number;
  /** iso currency (e.g. USD) */
  currency: string;
  /** billing interval */
  interval: "day" | "week" | "month" | "year";

  /** revstack customer id. */
  customerId: string;

  /** period start iso */
  currentPeriodStart: string;
  /** period end iso */
  currentPeriodEnd: string;

  /** cancels at period end */
  cancelAtPeriodEnd: boolean;
  /** canceled at iso */
  canceledAt?: string;
  /** started at iso */
  startedAt: string;
  /** ended at iso */
  endedAt?: string;

  /** trial start iso */
  trialStart?: string;
  /** trial end iso */
  trialEnd?: string;

  /** resume at iso */
  pauseResumesAt?: string;

  /** custom metadata */
  metadata?: Record<string, any>;
  /** raw provider payload */
  raw: any;
};

// =============================================================================
// INPUTS
// =============================================================================

export type CreateCustomerInput = {
  /** customer email */
  email: string;
  /** customer full name */
  name?: string;
  /** customer phone */
  phone?: string;
  /** optional description */
  description?: string;
  /** billing address */
  address?: Address;
  /** custom metadata */
  metadata?: Record<string, any>;
};

export type UpdateCustomerInput = Partial<CreateCustomerInput>;

export type CreatePaymentInput = {
  /** amount in cents */
  amount: number;
  /** iso currency (e.g. USD) */
  currency: string;
  /** revstack customer id */
  customerId?: string;
  /** external payment method id */
  paymentMethodId?: string;
  /** optional description */
  description?: string;

  /** bank statement descriptor */
  statementDescriptor?: string;

  /** capture immediately or authorize only */
  capture?: boolean;
  /** redirect return url */
  returnUrl?: string;
  /** billing address */
  billingAddress?: Address;
  /** shipping address */
  shippingAddress?: Address;
  /** custom metadata */
  metadata?: Record<string, any>;
  /** provider specific options */
  providerOptions?: any;
};

export type RefundPaymentInput = {
  /** revstack internal id */
  paymentId: string;
  /** external payment id */
  externalPaymentId?: string;
  /** refund amount in cents */
  amount?: number;
  /** refund reason */
  reason?: "duplicate" | "fraudulent" | "requested_by_customer";
  /** custom metadata */
  metadata?: Record<string, any>;
};

export type SetupPaymentMethodInput = {
  /** revstack customer id. */
  customerId: string;
  /** redirect return url */
  returnUrl: string;
  /** custom metadata */
  metadata?: Record<string, any>;
};

export type CheckoutSessionInput = {
  /** revstack customer id */
  customerId?: string;
  /** fallback customer email */
  customerEmail?: string;

  /** client reference id */
  clientReferenceId?: string;

  /** save payment method */
  setupFutureUsage?: boolean;
  /** checkout line items */
  lineItems: {
    /** item name */
    name: string;
    /** item description */
    description?: string;
    /** unit amount in cents */
    amount: number;
    /** quantity */
    quantity: number;
    /** iso currency (e.g. USD) */
    currency: string;
    /** item image urls */
    images?: string[];
    /** external tax rates */
    taxRates?: string[];
  }[];
  /** success url */
  successUrl: string;
  /** cancel url */
  cancelUrl: string;
  /** billing address collection mode */
  billingAddressCollection?: "auto" | "required";
  /** checkout mode */
  mode: "payment" | "subscription" | "setup";

  /** allow promo codes */
  allowPromotionCodes?: boolean;

  /** custom metadata */
  metadata?: Record<string, any>;
};

export type CreateSubscriptionInput = {
  /** revstack customer id. */
  customerId: string;
  /** revstack plan id */
  planId?: string;
  /** external price id */
  priceId?: string;
  /** metered quantity */
  quantity?: number;
  /** return url */
  returnUrl?: string;
  /** cancel url */
  cancelUrl?: string;
  /** trial days */
  trialDays?: number;

  /** revstack discount id */
  discountId?: string;
  /** external promo code */
  promotionCode?: string;

  /** custom metadata */
  metadata?: Record<string, any>;
};

// =============================================================================
// RESULTS & SHARED
// =============================================================================

export type ActionStatus = "success" | "pending" | "requires_action" | "failed";

export type AsyncActionResult<T> = {
  /** result data payload */
  data: T | null;
  /** action status */
  status: ActionStatus;
  /** next action required */
  nextAction?: {
    /** next action type */
    type: "redirect" | "url_load" | "show_modal";
    /** action url */
    url?: string;
    /** provider payload */
    payload?: any;
  };
  /** error information */
  error?: {
    /** stable error code */
    code: string;
    /** Human-readable error message. */
    message: string;
    /** provider specific error details */
    providerError?: string;
  };
};

export type CheckoutSessionResult = {
  /** external checkout session id */
  id: string;
  /** expires at iso */
  expiresAt?: string;
};

export type PaginationOptions = {
  /** max limit */
  limit?: number;
  /** pagination cursor */
  cursor?: string;
  /** external startingAfter cursor */
  startingAfter?: string;
  /** page number */
  page?: number;
};

export type PaginatedResult<T> = {
  /** page items */
  data: T[];
  /** has more flag */
  hasMore: boolean;
  /** next page cursor */
  nextCursor?: string;
};

export type Address = {
  /** address line 1 */
  line1: string;
  /** address line 2 */
  line2?: string;
  /** city */
  city: string;
  /** state */
  state?: string;
  /** postal code */
  postalCode: string;
  /** iso country code */
  country: string; // ISO 3166-1 alpha-2
};

export type Customer = {
  /** revstack customer id. */
  id: string;
  /** provider slug (e.g. "stripe") */
  providerId: string;
  /** external customer id. */
  externalId: string;
  /** customer email */
  email: string;
  /** customer full name */
  name?: string;
  /** customer phone */
  phone?: string;
  /** custom metadata */
  metadata?: Record<string, any>;
  /** created at iso */
  createdAt: string;
  /** deleted flag */
  deleted?: boolean;
};

export type PaymentMethod = {
  /** revstack payment method id */
  id: string;
  /** revstack customer id. */
  customerId: string;
  /** external payment method id. */
  externalId: string;
  /** payment method type */
  type: "card" | "bank_transfer" | "wallet";
  /** Detailed payment method metadata. */
  details: PaymentMethodDetails;
  /** is default flag */
  isDefault: boolean;
  /** custom metadata */
  metadata?: Record<string, any>;
};
