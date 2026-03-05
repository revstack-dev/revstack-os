import { LineItem } from "@/types/catalog";
import { Address } from "@/types/shared";
import { PaginationOptions } from "@/types/shared";

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
  /** success url */
  successUrl?: string;
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
  /** automatically apply a specific provider promotion code ID */
  promotionCodeId?: string;
  /** allow promo codes input box on the hosted checkout */
  allowPromotionCodes?: boolean;

  /** Save payment method for future use */
  savePaymentMethod?: boolean;
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

export type GetPaymentInput = { id: string };

export type CapturePaymentInput = { id: string; amount?: number };

export interface ListPaymentsOptions extends PaginationOptions {
  filters?: Record<string, any>;
  customerId?: string;
}
