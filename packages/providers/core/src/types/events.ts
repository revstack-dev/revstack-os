export type EventType =
  | "PAYMENT_SUCCEEDED"
  | "PAYMENT_FAILED"
  | "PAYMENT_AUTHORIZED" // Funds held
  | "PAYMENT_CAPTURED" // Funds captured
  | "REFUND_PROCESSED"
  | "REFUND_FAILED"
  | "SUBSCRIPTION_CREATED"
  | "SUBSCRIPTION_UPDATED"
  | "SUBSCRIPTION_CANCELED"
  | "DISPUTE_CREATED"
  | "DISPUTE_RESOLVED"
  | "MANDATE_CREATED"; // For Direct Debit

export interface RevstackEvent {
  type: EventType;
  providerEventId: string;
  createdAt: Date;
  resourceId: string;
  originalPayload: any;
  metadata?: Record<string, any>;
}

export interface WebhookResponse {
  statusCode: number;
  body: any;
}
