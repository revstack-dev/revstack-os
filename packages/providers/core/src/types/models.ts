/**
 * * Normalized data models for the Revstack ecosystem.
 * These types represent the "Internal Source of Truth" for the OS.
 */

// =============================================================================
// PAYMENT MODELS
// =============================================================================

export enum PaymentStatus {
  Pending = "pending",
  Authorized = "authorized", // Funds held but not captured yet
  Succeeded = "succeeded",
  Failed = "failed",
  Refunded = "refunded",
  PartiallyRefunded = "partially_refunded",
  Disputed = "disputed",
  Canceled = "canceled",
}

export type PaymentMethodDetails = {
  type: "card" | "bank_transfer" | "wallet" | "crypto" | "checkout";
  brand?: string; // Visa, Mastercard, Amex
  last4?: string;
  email?: string;
  expiryMonth?: number;
  expiryYear?: number;
  cardHolderName?: string;
};

export type Payment = {
  id: string;
  providerId: string;
  externalId: string;
  amount: number;
  /** * Financial breakdown, vital for invoicing and tax calculation.
   */
  amountDetails?: {
    subtotal: number;
    tax: number;
    shipping: number;
    discount: number;
    fee?: number; // Provider processing fee
  };
  amountRefunded: number;
  currency: string;
  status: PaymentStatus;
  method?: PaymentMethodDetails;
  description?: string;
  customerId?: string;
  externalCustomerId?: string;
  createdAt: string;
  updatedAt?: string;
  metadata?: Record<string, any>;
  raw?: any; // Original provider payload for debugging
};

// =============================================================================
// SUBSCRIPTION MODELS
// =============================================================================

export enum SubscriptionStatus {
  Trialing = "trialing",
  Active = "active",
  PastDue = "past_due",
  Canceled = "canceled",
  Unpaid = "unpaid",
  Incomplete = "incomplete",
  IncompleteExpired = "incomplete_expired",
  Paused = "paused",
}

export type Subscription = {
  id: string;
  providerId: string;
  externalId: string;
  status: SubscriptionStatus;
  planId?: string;
  externalPlanId?: string;
  amount: number;
  currency: string;
  interval: "day" | "week" | "month" | "year";
  customerId: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  canceledAt?: string;
  startedAt: string;
  endedAt?: string;
  trialStart?: string;
  trialEnd?: string;
  metadata?: Record<string, any>;
};

export type SubscriptionInterval = "day" | "week" | "month" | "year";

// =============================================================================
// INPUT / OUTPUT TYPES FOR FEATURES
// =============================================================================

export type CreateCustomerInput = {
  email: string;
  name?: string;
  phone?: string;
  description?: string;
  address?: Address;
  metadata?: Record<string, any>;
};

export type UpdateCustomerInput = Partial<CreateCustomerInput>;

export type CreatePaymentInput = {
  amount: number;
  currency: string;
  customerId?: string; // If the customer exists in Revstack
  paymentMethodId?: string; // If paying with a vaulted method
  description?: string;
  capture?: boolean; // Defaults to true. False for auth-only.
  billingAddress?: Address;
  shippingAddress?: Address;
  metadata?: Record<string, any>;
  providerOptions?: any; // Pass-through for provider specific fields
};

export type RefundPaymentInput = {
  paymentId: string; // Internal ID
  externalPaymentId?: string; // External ID (optimization)
  amount?: number; // Optional (Total refund if undefined)
  reason?: "duplicate" | "fraudulent" | "requested_by_customer";
  metadata?: Record<string, any>;
};

export type SetupPaymentMethodInput = {
  customerId: string;
  returnUrl: string; // For 3DS setup flows
  metadata?: Record<string, any>;
};

export type CheckoutSessionInput = {
  customerId?: string; // Existing Customer (Revstack ID)
  customerEmail?: string; // New Customer / Guest
  setupFutureUsage?: boolean; // Save card for future off-session usage?
  lineItems: {
    name: string;
    amount: number;
    quantity: number;
    currency: string;
    images?: string[];
    taxRates?: string[];
  }[];
  successUrl: string;
  cancelUrl: string;
  billingAddressCollection?: "auto" | "required";
  mode: "payment" | "subscription" | "setup";
  metadata?: Record<string, any>;
};

export type CreateSubscriptionInput = {
  customerId: string;
  planId?: string;
  priceId?: string; // External Price ID
  quantity?: number;
  trialDays?: number;
  metadata?: Record<string, any>;
};

export type PaymentResult = {
  payment: Payment;
  /**
   * Action required to complete the payment (e.g., 3DS Redirect).
   */
  nextAction?: {
    type: "redirect" | "modal";
    url: string;
  };
};

export type SubscriptionResult = {
  subscription: Subscription;
};

export type CheckoutSessionResult = {
  id: string;
  url: string;
  expiresAt?: string;
};

export type PaginationOptions = {
  limit?: number;
  cursor?: string; // For cursor-based pagination (e.g., Stripe)
  startingAfter?: string; // Common alternative
  page?: number; // For offset-based pagination (legacy)
};

export type PaginatedResult<T> = {
  data: T[];
  hasMore: boolean;
  nextCursor?: string;
};

export type Address = {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string; // ISO 3166-1 alpha-2
};

export type Customer = {
  id: string;
  providerId: string;
  externalId: string;
  email: string;
  name?: string;
  phone?: string;
  metadata?: Record<string, any>;
  createdAt: string;
};

export type PaymentMethod = {
  id: string;
  customerId: string; // Internal Revstack ID
  externalId: string; // Provider ID (e.g., pm_123)
  type: "card" | "bank_transfer" | "wallet";
  details: PaymentMethodDetails;
  isDefault: boolean;
  metadata?: Record<string, any>;
};
