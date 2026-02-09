export type CheckoutStrategy =
  | "redirect" // User is redirected to a hosted page (e.g., Stripe Checkout, PayPal Standard).
  | "native_sdk" // Uses a provider-specific React component (e.g., Stripe Elements, PayPal Buttons).
  | "sdui"; // Uses Server-Driven UI via JSON primitives (e.g., Crypto, Bank Transfers).

/**
 * Defines who orchestrates the recurring billing logic.
 */
export type SubscriptionMode =
  | "native" // The Provider handles the schedule, retries, and invoices (e.g., Stripe Billing).
  | "virtual"; // Revstack Core handles the schedule (CRON) and triggers one-time payments.

export interface ProviderCapabilities {
  checkout: {
    supported: boolean;
    strategy: "redirect" | "native_sdk" | "sdui";
  };
  payments: {
    supported: boolean;
    features: {
      refunds: boolean;
      partialRefunds: boolean;
      capture: boolean;
      disputes: boolean;
    };
  };
  subscriptions: {
    supported: boolean;
    mode: "native" | "virtual";
    features: {
      pause: boolean;
      resume: boolean;
      cancellation: boolean;
      proration?: boolean;
    };
  };
  customers: {
    supported: boolean;
    features: {
      create: boolean;
      update: boolean;
      delete: boolean;
    };
  };
  webhooks: {
    supported: boolean;
    verification: "signature" | "secret" | "none";
  };
}
