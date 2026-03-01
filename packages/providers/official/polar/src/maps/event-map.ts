import { EventType } from "@revstackhq/providers-core";
import { WebhookEventType } from "@polar-sh/sdk/models/components/webhookeventtype.js";

export const EVENT_MAP: Record<WebhookEventType, EventType | null> = {
  // Checkout
  "checkout.created": "CHECKOUT_COMPLETED",
  "checkout.updated": "CHECKOUT_COMPLETED",
  "checkout.expired": "CHECKOUT_EXPIRED",

  // Subscriptions
  "subscription.created": "SUBSCRIPTION_CREATED",
  "subscription.updated": "SUBSCRIPTION_UPDATED",
  "subscription.canceled": "SUBSCRIPTION_CANCELED",
  "subscription.active": "SUBSCRIPTION_RESUMED",
  "subscription.uncanceled": "SUBSCRIPTION_RESUMED",
  "subscription.revoked": "SUBSCRIPTION_CANCELED",
  "subscription.past_due": "SUBSCRIPTION_PAYMENT_FAILED",

  // Orders
  "order.created": "PAYMENT_CREATED",
  "order.updated": "PAYMENT_PROCESSING",
  "order.paid": "PAYMENT_SUCCEEDED",
  "order.refunded": "REFUND_PROCESSED",

  // Customers
  "customer.created": "CUSTOMER_CREATED",
  "customer.updated": "CUSTOMER_UPDATED",
  "customer.deleted": "CUSTOMER_DELETED",
  "customer.state_changed": "CUSTOMER_UPDATED",

  // Refunds
  "refund.created": "REFUND_CREATED",
  "refund.updated": "REFUND_PROCESSED",

  "product.created": null,
  "product.updated": null,
  "benefit.created": null,
  "benefit.updated": null,
  "benefit_grant.created": null,
  "benefit_grant.cycled": null,
  "benefit_grant.updated": null,
  "benefit_grant.revoked": null,
  "organization.updated": null,
  "customer_seat.assigned": null,
  "customer_seat.claimed": null,
  "customer_seat.revoked": null,
  "member.created": null,
  "member.updated": null,
  "member.deleted": null,
};
