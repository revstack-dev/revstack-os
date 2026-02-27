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
// SUBSCRIPTION INPUTS
// =============================================================================

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

export type UpdateSubscriptionInput = {
  /** new external price id for upgrade/downgrade */
  priceId?: string;
  /** new quantity */
  quantity?: number;
  /** proration behavior */
  proration?: "create_prorations" | "none" | "always_invoice";
  /** trial end override (ISO or "now" to end trial) */
  trialEnd?: string;
  /** custom metadata */
  metadata?: Record<string, any>;
};
