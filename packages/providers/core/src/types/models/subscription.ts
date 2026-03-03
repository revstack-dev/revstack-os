import { RevstackCurrency } from "@/types/models/currency";
import { LineItem } from "@/types/models/shared";

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
  currency: RevstackCurrency;
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
// SUBSCRIPTION INPUTS
// =============================================================================

export type CreateSubscriptionInput = {
  /** external reference id for webhooks (e.g. internal user or order id) */
  clientReferenceId?: string;
  /** revstack customer id. */
  customerId: string;
  /** fallback customer email */
  customerEmail?: string;
  /** return url */
  returnUrl?: string;
  /** cancel url */
  cancelUrl?: string;
  /** trial days */
  trialDays?: number;
  /** revstack discount id */
  discountId?: string;
  /** external promo code ID to apply automatically */
  promotionCodeId?: string;
  /** allow promo codes input box on the hosted checkout */
  allowPromotionCodes?: boolean;
  /** enable automatic tax calculation */
  automaticTax?: boolean;
  /** custom metadata */
  metadata?: Record<string, any>;
  /** * The items to subscribe to.
   * JIT creation is handled natively here if a LineItem provides amount/interval instead of a priceId.
   */
  lineItems: [LineItem, ...LineItem[]];
};

export type UpdateSubscriptionItem = {
  /** The ID of the existing subscription item you want to modify or remove. */
  id?: string;
  /** The ID of the new price to apply to this item */
  priceId?: string;
  /** The new quantity for this item */
  quantity?: number;
  /** Whether to delete this item from the subscription */
  deleted?: boolean;
  /** Metadata to apply to this item */
  metadata?: Record<string, any>;
};

export type UpdateSubscriptionInput = {
  /** The items to update, add, or remove */
  lineItems?: UpdateSubscriptionItem[];

  proration?: "create_prorations" | "none" | "always_invoice";
  trialEnd?: string;
  metadata?: Record<string, any>;
};
