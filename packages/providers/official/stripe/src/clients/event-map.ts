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

  "payment_intent.processing": "PAYMENT_PROCESSING",
  "payment_intent.canceled": "PAYMENT_CANCELED",

  "customer.subscription.paused": "SUBSCRIPTION_PAUSED",
  "customer.subscription.resumed": "SUBSCRIPTION_RESUMED",
  "customer.subscription.trial_will_end": "SUBSCRIPTION_TRIAL_WILL_END",

  "invoice.payment_succeeded": "INVOICE_PAYMENT_SUCCEEDED",
  "invoice.payment_failed": "INVOICE_PAYMENT_FAILED",

  "payment_method.attached": "PAYMENT_METHOD_ATTACHED",
  "payment_method.detached": "PAYMENT_METHOD_DETACHED",

  "mandate.updated": "MANDATE_CREATED",
};
