/**
 * Defines the user interface strategy for collecting payment details.
 * This dictates how the Frontend SDK renders the payment flow.
 */
export type CheckoutStrategy =
  /**
   * The user is redirected to a page hosted by the Provider (e.g., Stripe Checkout, PayPal Standard).
   * - **Pros:** Easiest integration, full PCI compliance offloaded to provider.
   * - **Cons:** User leaves your domain, less branding control.
   */
  | "redirect"
  /**
   * The payment form is embedded in your app using the Provider's React/JS SDK (e.g., Stripe Elements).
   * - **Pros:** User stays on your domain, seamless UX.
   * - **Cons:** Requires handling client-side tokens and partial PCI SAQ A compliance.
   */
  | "native_sdk"
  /**
   * Server-Driven UI. The provider returns raw JSON primitives (QR codes, Bank Instructions)
   * and Revstack renders the UI natively without external scripts.
   * - **Use Case:** Crypto payments, Bank Transfers (Pix, Boleto), or custom flows.
   */
  | "sdui";

/**
 * Defines who orchestrates the recurring billing scheduler and invoice generation.
 */
export type SubscriptionMode =
  /**
   * The Provider acts as the Billing Engine (e.g., Stripe Billing, Paddle).
   * - **Logic:** The provider handles retries, proration, and email receipts.
   * - **Role:** Revstack mostly mirrors the provider's state via webhooks.
   */
  | "native"
  /**
   * Revstack Core acts as the Billing Engine.
   * - **Logic:** Revstack runs the CRON scheduler and triggers "One-Time Payments" via the provider.
   * - **Use Case:** Providers that don't support subscriptions (e.g., Crypto, simple Gateways)
   * or when you need complex custom logic not supported natively.
   */
  | "virtual";

/**
 * A comprehensive feature-flag manifest for a Provider.
 *
 * This object allows the Core to dynamically adapt the UI and API behavior
 * based on what the connected provider actually supports.
 *
 * @example
 * // If capabilities.payments.features.refunds is false,
 * // the "Refund" button will be hidden in the Dashboard.
 */
export interface ProviderCapabilities {
  /**
   * Configuration for the Checkout / Payment Form experience.
   */
  checkout: {
    /** Whether this provider offers a pre-built checkout flow. */
    supported: boolean;
    /** The integration strategy required for the frontend. */
    strategy: CheckoutStrategy;
  };

  /**
   * Configuration for One-Time Transaction processing.
   */
  payments: {
    supported: boolean;
    features: {
      /** Can transactions be refunded fully? */
      refunds: boolean;
      /** Can transactions be refunded for a specific amount? */
      partialRefunds: boolean;
      /**
       * Does the provider support separate Auth and Capture steps?
       * Vital for e-commerce (shipping goods) or marketplaces.
       */
      capture: boolean;
      /**
       * Does the provider expose dispute/chargeback lifecycle events?
       */
      disputes: boolean;
    };
  };

  /**
   * Configuration for Recurring Billing.
   */
  subscriptions: {
    supported: boolean;
    /** Who runs the scheduler? */
    mode: SubscriptionMode;
    features: {
      /** Can a subscription be temporarily halted without canceling? */
      pause: boolean;
      /** Can a paused subscription be reactivated? */
      resume: boolean;
      /** Can a subscription be canceled (immediately or at period end)? */
      cancellation: boolean;
      /** Does the provider automatically calculate pro-rata usage on upgrades? */
      proration?: boolean;
    };
  };

  /**
   * Configuration for Customer Profile Management.
   */
  customers: {
    supported: boolean;
    features: {
      create: boolean;
      update: boolean;
      delete: boolean;
    };
  };

  /**
   * Configuration for Event / Webhook processing.
   */
  webhooks: {
    supported: boolean;
    /**
     * The security mechanism used to validate payloads.
     * - `signature`: HMAC SHA256 signature header (Gold Standard).
     * - `secret`: A simple shared secret token in headers.
     * - `none`: No verification (Insecure).
     */
    verification: "signature" | "secret" | "none";
  };

  /**
   * Configuration for Product / Price Catalog Management.
   *
   * This tells the orchestrator how to handle line items during checkout.
   */
  catalog?: {
    supported: boolean;
    /**
     * - `"inline"`: The provider supports creating prices on-the-fly during checkout
     *   (e.g., Stripe `price_data`). No pre-creation needed.
     * - `"pre_created"`: The provider requires Products and Prices to exist before
     *   they can be referenced in checkout (e.g., Polar, PayPal Catalog).
     *   The orchestrator must call `createProduct` + `createPrice` before checkout.
     */
    strategy: "inline" | "pre_created";
  };
}
