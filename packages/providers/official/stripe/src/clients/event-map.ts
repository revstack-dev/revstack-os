import { EventType } from "@revstackhq/providers-core";

export const EVENT_MAP: Record<string, EventType> = {
  "checkout.session.completed": "PAYMENT_SUCCEEDED",

  "payment_intent.succeeded": "PAYMENT_SUCCEEDED",
  "payment_intent.payment_failed": "PAYMENT_FAILED",
  "payment_intent.amount_capturable_updated": "PAYMENT_AUTHORIZED",

  "charge.captured": "PAYMENT_CAPTURED",

  "charge.refunded": "REFUND_PROCESSED",

  "customer.subscription.created": "SUBSCRIPTION_CREATED",
  "customer.subscription.updated": "SUBSCRIPTION_UPDATED",
  "customer.subscription.deleted": "SUBSCRIPTION_CANCELED",

  "charge.dispute.created": "DISPUTE_CREATED",
  "charge.dispute.closed": "DISPUTE_RESOLVED",
};
