export type EventType =
  // --- PAYMENTS (Transaction Lifecycle) ---
  | "PAYMENT_SUCCEEDED"
  | "PAYMENT_FAILED"
  | "PAYMENT_PROCESSING"
  | "PAYMENT_CANCELED"
  | "PAYMENT_AUTHORIZED" // Funds held (Auth)
  | "PAYMENT_CAPTURED" // Funds captured

  // --- REFUNDS & DISPUTES ---
  | "REFUND_PROCESSED"
  | "REFUND_FAILED"
  | "DISPUTE_CREATED"
  | "DISPUTE_RESOLVED" // Or "DISPUTE_WON" / "DISPUTE_LOST" if you want more granularity
  | "DISPUTE_EXPIRED" // When the merchant fails to provide evidence in time

  // --- SUBSCRIPTIONS (Lifecycle) ---
  | "SUBSCRIPTION_CREATED"
  | "SUBSCRIPTION_UPDATED"
  | "SUBSCRIPTION_CANCELED" // Definitive cancellation
  | "SUBSCRIPTION_PAUSED"
  | "SUBSCRIPTION_RESUMED"
  | "SUBSCRIPTION_TRIAL_WILL_END"
  | "SUBSCRIPTION_EXPIRING" // For cards that are about to expire (Churn prevention).

  // --- INVOICES (Recurring Billing Specific) ---
  // Sometimes PAYMENT_FAILED is too generic. Knowing a recurring invoice failed is vital.
  | "INVOICE_PAYMENT_SUCCEEDED"
  | "INVOICE_PAYMENT_FAILED"

  // --- PAYMENT METHODS ---
  | "PAYMENT_METHOD_ATTACHED"
  | "PAYMENT_METHOD_DETACHED"
  | "MANDATE_CREATED";

export interface RevstackEvent {
  type: EventType;
  providerEventId: string;
  createdAt: Date;
  resourceId: string;
  originalPayload: any;
  /**
   * Normalized metadata to facilitate routing.
   * e.g.: { customerId: "cus_123", subscriptionId: "sub_456" }
   */
  metadata?: Record<string, any>;
}

export interface WebhookResponse {
  statusCode: number;
  body: any;
}
