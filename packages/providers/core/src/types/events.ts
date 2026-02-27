export type EventType =
  // --- PAYMENTS (Transaction Lifecycle) ---
  | "PAYMENT_CREATED"
  | "PAYMENT_SUCCEEDED"
  | "PAYMENT_FAILED"
  | "PAYMENT_PROCESSING"
  | "PAYMENT_CANCELED"
  | "PAYMENT_AUTHORIZED" // Funds held (Auth)
  | "PAYMENT_CAPTURED" // Funds captured

  // --- REFUNDS & DISPUTES ---
  | "REFUND_CREATED"
  | "REFUND_PROCESSED"
  | "REFUND_FAILED"
  | "DISPUTE_CREATED"
  | "DISPUTE_RESOLVED"
  | "DISPUTE_EXPIRED" // Merchant failed to provide evidence in time

  // --- CHECKOUT ---
  | "CHECKOUT_COMPLETED"
  | "CHECKOUT_EXPIRED"

  // --- SUBSCRIPTIONS (Lifecycle) ---
  | "SUBSCRIPTION_CREATED"
  | "SUBSCRIPTION_UPDATED"
  | "SUBSCRIPTION_CANCELED"
  | "SUBSCRIPTION_PAUSED"
  | "SUBSCRIPTION_RESUMED"
  | "SUBSCRIPTION_TRIAL_WILL_END"
  | "SUBSCRIPTION_EXPIRING"
  | "SUBSCRIPTION_PAYMENT_FAILED" // Recurring invoice payment specifically failed

  // --- INVOICES (Recurring Billing Specific) ---
  | "INVOICE_PAYMENT_SUCCEEDED"
  | "INVOICE_PAYMENT_FAILED"

  // --- CUSTOMERS ---
  | "CUSTOMER_CREATED"
  | "CUSTOMER_UPDATED"
  | "CUSTOMER_DELETED"

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
