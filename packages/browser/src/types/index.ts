export interface RevstackConfig {
  /** project public key */
  publicKey: string;
  /** api base url */
  apiUrl?: string;
  /** returns the current user's JWT, or null if unauthenticated */
  getToken: () => Promise<string | null>;
  /** custom guest id resolver — overrides fingerprinting */
  getGuestId?: () => Promise<string>;
  /** set true to skip fingerprinting entirely */
  disableFingerprint?: boolean;
}

export interface Entitlement {
  /** feature key */
  key: string;
  /** whether the user has access */
  hasAccess: boolean;
  /** optional value (limits, tier names, etc.) */
  value?: string | number | boolean;
}

export interface CheckoutParams {
  /** plan to subscribe to */
  planId: string;
  /** redirect after successful payment */
  successUrl: string;
  /** redirect on cancellation */
  cancelUrl: string;
}

export interface IdentifyResponse {
  entitlements: Entitlement[];
}

export interface CheckoutSessionResponse {
  sessionToken: string;
}

export interface BillingPortalParams {
  /** url to redirect back to after the user leaves the portal */
  returnUrl: string;
}

export interface BillingPortalResponse {
  /** the full url to the billing portal session */
  url: string;
}
