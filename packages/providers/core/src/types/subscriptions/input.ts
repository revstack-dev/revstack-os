import { LineItem } from "@/types/catalog";
import { PaginationOptions, Interval } from "@/types/shared";

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
  /** success url */
  successUrl?: string;
  /** external promo code ID to apply automatically */
  promotionCodeId?: string;
  /** allow promo codes input box on the hosted checkout */
  allowPromotionCodes?: boolean;
  /** enable automatic tax calculation */
  automaticTax?: boolean;
  /** custom metadata */
  metadata?: Record<string, any>;
  /** trial interval for subscription line items */
  trialInterval?: Interval;
  /** trial interval count for subscription line items */
  trialIntervalCount?: number;
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
  /** The ID of the subscription */
  id: string;

  /** The items to update, add, or remove */
  lineItems?: UpdateSubscriptionItem[];

  proration?: "create_prorations" | "none" | "always_invoice";
  trialEnd?: string;
  metadata?: Record<string, any>;
};

export type CancelSubscriptionInput = {
  id: string;
  reason?: string;
  immediate?: boolean;
};

export type PauseSubscriptionInput = { id: string };

export type ResumeSubscriptionInput = { id: string };

export type GetSubscriptionInput = { id: string };

export interface ListSubscriptionsOptions extends PaginationOptions {
  filters?: Record<string, any>;
}
