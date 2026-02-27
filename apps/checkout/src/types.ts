// =============================================================================
// CHECKOUT SESSION TYPES
// =============================================================================

export type CheckoutSessionStatus = "open" | "complete" | "expired";

export type PaymentCategory =
  | "card"
  | "wallet"
  | "bank_transfer"
  | "crypto"
  | "paypal";

export type PaymentOption = {
  id: string; // e.g., 'opt_card_stripe'
  category: PaymentCategory;
  label: string; // e.g., "Pay with Card", "Pay with PayPal"
  providerSlug: string; // e.g., "stripe", "polar"
  action: {
    type: "redirect";
    url: string; // The hosted checkout URL for this specific provider
  };
};

export type CheckoutLineItem = {
  /** item name */
  name: string;
  /** item description */
  description?: string;
  /** quantity */
  quantity: number;
  /** unit amount in smallest currency unit (e.g. cents) */
  unitAmount: number;
  /** ISO currency code */
  currency: string;
  /** image URL */
  image?: string;
  /** item categorization */
  type: "product" | "addon";
  /** billing type */
  billingType: "one-time" | "recurring";
  /** recurring interval */
  interval?: "day" | "week" | "month" | "year";
};

export type CheckoutTotals = {
  /** subtotal before tax/discount */
  subtotal: number;
  /** tax amount */
  tax?: number;
  /** discount amount */
  discount?: number;
  /** final total */
  total: number;
  /** ISO currency code */
  currency: string;
};

export type MerchantBranding = {
  /** merchant display name */
  name: string;
  /** merchant logo URL */
  logo?: string;
  /** primary brand color (hex) */
  primaryColor: string;
  /** accent color for text contrast (hex) */
  accentColor?: string;
  /** theme preference */
  theme?: "light" | "dark" | "system";
  /** show "Powered by Revstack" badge */
  showPoweredBy: boolean;
};

export type CheckoutSession = {
  /** session ID */
  id: string;
  /** session status */
  status: CheckoutSessionStatus;
  /** expiration ISO timestamp */
  expiresAt: string;

  /** merchant branding */
  merchant: MerchantBranding;

  /** items to display */
  lineItems: CheckoutLineItem[];
  /** computed totals */
  totals: CheckoutTotals;

  /** pre-filled customer email */
  customerEmail?: string;

  /** NEW: Multi-provider payment options array */
  paymentOptions: PaymentOption[];

  /** where to go after success */
  successUrl: string;
  /** where to go on cancel */
  cancelUrl: string;

  /** custom metadata */
  metadata?: Record<string, unknown>;
};
