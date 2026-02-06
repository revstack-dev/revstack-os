// ==========================================
// 1. SHARED TYPES
// ==========================================

/**
 * Defines how the checkout flow is presented to the user.
 */
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

// ==========================================
// 2. CAPABILITY INTERFACES
// ==========================================

export interface CheckoutCapabilities {
  /**
   * If true, this provider can be used in the Hosted Checkout flow.
   */
  supported: boolean;

  /**
   * The primary UX strategy used to collect payment details.
   * The frontend uses this to determine which adapter to load.
   */
  strategy: CheckoutStrategy;
}

export interface PaymentCapabilities {
  /**
   * If true, the provider supports processing standard One-Time Payments.
   * This is the fundamental capability of any payment provider.
   */
  supported: boolean;

  /**
   * Advanced transactional features supported by the provider.
   */
  features: {
    /**
     * Can the provider process full refunds via API?
     */
    refunds: boolean;

    /**
     * Can the provider process partial refunds (returning a specific amount)?
     */
    partialRefunds: boolean;

    /**
     * Supports "Authorization & Capture" flow.
     * Useful for e-commerce (shipping) or rentals, where funds are held first
     * and charged later.
     */
    capture: boolean;

    /**
     * Can the provider fetch or list disputes/chargebacks via API?
     */
    disputes: boolean;
  };
}

export interface SubscriptionCapabilities {
  /**
   * If true, the provider supports recurring billing flows.
   */
  supported: boolean;

  /**
   * The engine responsible for recurrence logic.
   * - 'native': We delegate logic to the provider.
   * - 'virtual': We emulate logic using one-time payments.
   */
  mode: SubscriptionMode;

  /**
   * Specific lifecycle actions supported by the provider.
   */
  features: {
    /**
     * Can a subscription be paused temporarily without canceling it?
     */
    pause: boolean;

    /**
     * Can a paused subscription be resumed?
     */
    resume: boolean;

    /**
     * Can a subscription be canceled via API?
     */
    cancellation: boolean;

    /**
     * Does the provider support native proration for upgrades/downgrades?
     * (Only relevant if mode is 'native').
     */
    proration?: boolean;
  };
}

export interface WebhookCapabilities {
  /**
   * Does the provider send asynchronous events (webhooks)?
   */
  supported: boolean;

  /**
   * How the webhook payload is verified for security.
   * - 'signature': HMAC/RSA signature header (Best).
   * - 'secret': Simple shared secret in header/body.
   * - 'none': No verification (Insecure).
   */
  verification: "signature" | "secret" | "none";
}

// ==========================================
// 3. MASTER CAPABILITIES INTERFACE
// ==========================================

export interface ProviderCapabilities {
  checkout: CheckoutCapabilities;
  payments: PaymentCapabilities;
  subscriptions: SubscriptionCapabilities;
  webhooks: WebhookCapabilities;
}
