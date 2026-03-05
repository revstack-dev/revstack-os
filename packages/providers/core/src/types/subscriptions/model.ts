import { Interval } from "@/types/shared";

/**
 * Standardized lifecycle states for a Revstack Subscription.
 * These states abstract away provider-specific quirks (like Stripe's pause_collection)
 * to give the merchant a unified, predictable billing state machine.
 */
export enum SubscriptionStatus {
  /** Created but awaiting first successful payment, confirmation, or SCA authentication. */
  Incomplete = "incomplete",
  /** The incomplete subscription expired (typically after 23 hours in Stripe) before being completed. */
  IncompleteExpired = "incomplete_expired",
  /** The subscription is active and currently in a free trial period. */
  Trialing = "trialing",
  /** The subscription is active and in good standing. */
  Active = "active",
  /** A payment has failed or is pending. The provider is likely retrying the charge (Dunning process). */
  PastDue = "past_due",
  /** The subscription has been permanently canceled and will no longer bill. */
  Canceled = "canceled",
  /** The final state after all automatic retries have failed. The subscription is effectively dead. */
  Unpaid = "unpaid",
  /** The subscription contract is active, but the billing collection has been temporarily halted. */
  Paused = "paused",
}

/**
 * The agnostic Revstack Subscription entity.
 * This represents the normalized data structure that will be persisted in your database.
 */
export type Subscription = {
  /** The slug of the provider managing this subscription (e.g., "stripe", "polar"). */
  providerId: string;
  /** The raw ID assigned by the payment provider (e.g., "sub_123xyz"). */
  id: string;
  /** The unified lifecycle state of the subscription. */
  status: SubscriptionStatus;
  /** The provider's internal ID for the plan/price (e.g., "price_123xyz"). */
  priceId?: string;
  /** * The total recurring amount in the smallest currency unit (e.g., cents).
   * This aggregates all line items if the subscription has multiple components (base + per-seat).
   */
  amount: number;
  /** The ISO 4217 currency code normalized to uppercase (e.g., "USD"). */
  currency: string;
  /** The frequency at which this subscription bills. */
  interval: Interval;
  /** The internal Revstack Customer ID (mapped from the provider's customer ID). */
  customerId: string;
  /** ISO 8601 timestamp indicating when the current billing cycle started. */
  currentPeriodStart: string;
  /** ISO 8601 timestamp indicating when the current billing cycle ends. */
  currentPeriodEnd: string;
  /** Flag indicating if the subscription is scheduled to cancel at the end of the current period. */
  cancelAtPeriodEnd: boolean;
  /** ISO 8601 timestamp indicating exactly when the subscription was canceled (if applicable). */
  canceledAt?: string;
  /** ISO 8601 timestamp indicating when the subscription was originally created/started. */
  startedAt: string;
  /** ISO 8601 timestamp indicating when the subscription permanently ended. */
  endedAt?: string;
  /** ISO 8601 timestamp indicating when the trial period started (if applicable). */
  trialStart?: string;
  /** ISO 8601 timestamp indicating when the trial period ends (if applicable). */
  trialEnd?: string;
  /** ISO 8601 timestamp indicating when a paused subscription will automatically resume billing. */
  pauseResumesAt?: string;
  /** Key-value store for custom data attached to the subscription. */
  metadata?: Record<string, any>;
  /** The unmodified webhook/API payload from the provider, useful for debugging or auditing. */
  raw: any;
};
