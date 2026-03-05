import { LineItem } from "@/types/catalog";
import {
  CheckoutSessionBillingAddressCollection,
  CheckoutSessionMode,
} from "@/types/checkout/model";
import { Interval } from "@/types/shared";

export type CheckoutSessionInput = {
  /** revstack customer id */
  customerId?: string;
  /** fallback customer email */
  customerEmail?: string;

  /** client reference id */
  clientReferenceId?: string;

  /** enable automatic tax */
  automaticTax?: boolean;

  /** statement descriptor */
  statementDescriptor?: string;

  /** trial interval for subscription line items */
  trialInterval?: Interval;
  /** trial interval count for subscription line items */
  trialIntervalCount?: number;

  /** Save payment method for future use */
  savePaymentMethod?: boolean;

  /** currency */
  currency?: string;

  /** checkout line items */
  lineItems: LineItem[];
  /** success url */
  successUrl?: string;
  /** cancel url */
  cancelUrl?: string;
  /** return url */
  returnUrl?: string;
  /** billing address collection mode */
  billingAddressCollection?: CheckoutSessionBillingAddressCollection;
  /** checkout mode */
  mode: CheckoutSessionMode;

  /** automatically apply a specific provider promotion code ID */
  promotionCodeId?: string;
  /** allow promo codes input box on the hosted checkout */
  allowPromotionCodes?: boolean;

  /** custom metadata */
  metadata?: Record<string, any>;
};
