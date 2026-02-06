export type EventType =
  | "PAYMENT_SUCCEEDED"
  | "PAYMENT_FAILED"
  | "REFUND_PROCESSED"
  | "SUBSCRIPTION_CREATED"
  | "SUBSCRIPTION_UPDATED"
  | "SUBSCRIPTION_CANCELED"
  | "DISPUTE_CREATED"
  | "DISPUTE_RESOLVED";

/**
 * A normalized event ready to be consumed by the Revstack Core.
 */
export interface RevstackEvent {
  /** The standardized event type */
  type: EventType;
  /** The provider's original event ID */
  providerEventId: string;
  /** ISO timestamp of when the event happened */
  createdAt: Date;
  /** The raw original payload (for debugging) */
  originalPayload: any;
  /** * The primary resource affected (Payment ID, Subscription ID).
   * Used to link the event to internal records.
   */
  resourceId: string;
  /** Additional context */
  metadata?: Record<string, any>;
}

export interface WebhookResponse {
  /** HTTP Status code to return to the provider (e.g., 200) */
  statusCode: number;
  /** Body to return (e.g., { received: true }) */
  body: any;
}
