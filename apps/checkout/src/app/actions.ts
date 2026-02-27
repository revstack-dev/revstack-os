"use server";

import type { CheckoutSession } from "@/types";

const REVSTACK_API_URL =
  process.env.REVSTACK_API_URL || "https://api.revstack.dev";

// =============================================================================
// MOCK DATA (for development until Revstack Cloud API is ready)
// =============================================================================

const MOCK_SESSION: CheckoutSession = {
  id: "cs_test_abc123",
  status: "open",
  expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),

  merchant: {
    name: "Revstack",
    logo: "https://app.revstack.dev/logo-single.png",
    primaryColor: "oklch(0.7 0.22 35)",
    accentColor: "#ffffff",
    theme: "dark",
    showPoweredBy: true,
  },

  lineItems: [
    {
      name: "Pro",
      description: "Perfect for professionals who need advanced features",
      quantity: 1,
      unitAmount: 2900,
      currency: "USD",
      type: "product",
      billingType: "recurring",
      interval: "month",
    },
    {
      name: "Priority Support",
      description: "24/7 dedicated support",
      quantity: 1,
      unitAmount: 999,
      currency: "USD",
      type: "addon",
      billingType: "recurring",
      interval: "month",
    },
    {
      name: "White-label Output",
      description: "Remove all Revstack branding",
      quantity: 1,
      unitAmount: 4900,
      currency: "USD",
      type: "addon",
      billingType: "recurring",
      interval: "year",
    },
  ],

  totals: {
    subtotal: 3899,
    tax: 390,
    total: 4289,
    currency: "USD",
  },

  customerEmail: "john@example.com",
  paymentOptions: [
    {
      id: "opt_card_stripe",
      category: "card",
      label: "Pay with Card",
      providerSlug: "stripe",
      action: {
        type: "redirect",
        url: "https://checkout.stripe.com/pay/cs_test_card",
      },
    },
    {
      id: "opt_paypal",
      category: "paypal",
      label: "Pay with PayPal",
      providerSlug: "paypal",
      action: {
        type: "redirect",
        url: "https://paypal.com/checkoutnow?token=EC-1234",
      },
    },
    {
      id: "opt_crypto_coinbase",
      category: "crypto",
      label: "Pay with Crypto",
      providerSlug: "coinbase",
      action: {
        type: "redirect",
        url: "https://commerce.coinbase.com/checkout/123",
      },
    },
  ],
  successUrl: "https://acme.com/success",
  cancelUrl: "https://acme.com/cancel",
};

// =============================================================================
// SERVER ACTION
// =============================================================================

export async function getCheckoutSession(
  token: string,
): Promise<{ data: CheckoutSession | null; error?: string }> {
  // --- DEV: return mock data ---
  if (process.env.NODE_ENV === "development" || token.startsWith("test_")) {
    return { data: MOCK_SESSION };
  }

  try {
    const res = await fetch(
      `${REVSTACK_API_URL}/v1/checkout/sessions/${token}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      },
    );

    if (!res.ok) {
      if (res.status === 404) {
        return { data: null, error: "Session not found" };
      }
      if (res.status === 410) {
        return { data: null, error: "Session has expired" };
      }
      return { data: null, error: "Failed to load checkout session" };
    }

    const session: CheckoutSession = await res.json();
    return { data: session };
  } catch {
    return { data: null, error: "Unable to connect to Revstack" };
  }
}
