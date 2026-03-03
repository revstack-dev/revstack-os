import { Address, LineItem } from "@/types/models/shared";
import { RevstackCurrency } from "@/types/models/currency";

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
  currency: RevstackCurrency;
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
  /** purchased line items if available */
  lineItems?: LineItem[];
  /** raw provider payload */
  raw?: any;
};

// =============================================================================
// PAYMENT INPUTS
// =============================================================================

export type CreatePaymentInput = {
  /** external reference id for webhooks (e.g. internal user or order id) */
  clientReferenceId?: string;
  /** revstack customer id */
  customerId?: string;
  /** fallback customer email for guest checkouts */
  customerEmail?: string;
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
  /** redirect cancel url */
  cancelUrl?: string;
  /** billing address */
  billingAddress?: Address;
  /** shipping address */
  shippingAddress?: Address;
  /** custom metadata */
  metadata?: Record<string, any>;
  /** provider specific options */
  providerOptions?: any;

  /** inline checkout line items */
  lineItems: [LineItem, ...LineItem[]];

  /** enable automatic tax calculation (e.g., Stripe Tax, Polar automatic tax) */
  automaticTax?: boolean;
  /** allow promo codes input box on the hosted checkout */
  allowPromotionCodes?: boolean;
  /** automatically apply a specific provider promotion code ID */
  promotionCodeId?: string;

  /** setup future usage for the payment method */
  setupFutureUsage?: boolean;
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
