// =============================================================================
// CHECKOUT MODELS
// =============================================================================

export type CheckoutSessionInput = {
  /** revstack customer id */
  customerId?: string;
  /** fallback customer email */
  customerEmail?: string;

  /** client reference id */
  clientReferenceId?: string;

  /** save payment method */
  setupFutureUsage?: boolean;
  /** checkout line items */
  lineItems: {
    /** external price id (when using an existing price, name/amount/currency are not required) */
    priceId?: string;
    /** item name */
    name?: string;
    /** item description */
    description?: string;
    /** unit amount in cents */
    amount?: number;
    /** quantity */
    quantity: number;
    /** iso currency (e.g. USD) */
    currency?: string;
    /** item image urls */
    images?: string[];
    /** external tax rates */
    taxRates?: string[];
    /** recurring interval for subscription line items */
    interval?: "day" | "week" | "month" | "year";
  }[];
  /** success url */
  successUrl: string;
  /** cancel url */
  cancelUrl: string;
  /** billing address collection mode */
  billingAddressCollection?: "auto" | "required";
  /** checkout mode */
  mode: "payment" | "subscription" | "setup";

  /** allow promo codes */
  allowPromotionCodes?: boolean;

  /** custom metadata */
  metadata?: Record<string, any>;
};

export type CheckoutSessionResult = {
  /** external checkout session id */
  id: string;
  /** expires at iso */
  expiresAt?: string;
};

// =============================================================================
// BILLING PORTAL
// =============================================================================

export type BillingPortalInput = {
  /** external customer id */
  customerId: string;
  /** return URL after the customer leaves the portal */
  returnUrl: string;
};

export type BillingPortalResult = {
  /** portal session URL to redirect the customer to */
  url: string;
};
