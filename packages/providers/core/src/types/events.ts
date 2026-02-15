export type EventType =
  // --- PAYMENTS (Transaction Lifecycle) ---
  | "PAYMENT_SUCCEEDED"
  | "PAYMENT_FAILED"
  | "PAYMENT_PROCESSING" // 👈 CRITICAL MISSING: For async methods (Wire, Boleto, OXXO) that take hours/days.
  | "PAYMENT_CANCELED" // 👈 MISSING: When the user closes the OXXO/Pix popup without paying or admin cancels it.
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
  | "SUBSCRIPTION_PAUSED" // 👈 MISSING: You implemented pauseSubscription, you need the event.
  | "SUBSCRIPTION_RESUMED" // 👈 MISSING: You implemented resumeSubscription.
  | "SUBSCRIPTION_TRIAL_WILL_END" // 👈 MISSING: Vital for sending the "Your trial ends in 3 days" email.
  | "SUBSCRIPTION_EXPIRING" // For cards that are about to expire (Churn prevention).

  // --- INVOICES (Recurring Billing Specific) ---
  // Sometimes PAYMENT_FAILED is too generic. Knowing a recurring invoice failed is vital.
  | "INVOICE_PAYMENT_SUCCEEDED"
  | "INVOICE_PAYMENT_FAILED"

  // --- PAYMENT METHODS ---
  | "PAYMENT_METHOD_ATTACHED" // 👈 MISSING: When a user adds a card in "My Profile".
  | "PAYMENT_METHOD_DETACHED" // When they delete it.
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
