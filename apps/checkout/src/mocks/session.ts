import type { CheckoutSession } from "@/types";

export const MOCK_SESSION: CheckoutSession = {
  id: "cs_test_abc123",
  status: "open",
  expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),

  merchant: {
    name: "Revstack",
    logo: "https://app.revstack.dev/logo-single.png",
    primaryColor: "oklch(0.7 0.22 35)",
    accentColor: "#ffffff",
    theme: "dark",
    showPoweredBy: false,
  },

  availableAddons: [
    {
      id: "addon_priority_support",
      slug: "priority_support",
      name: "Priority Support",
      description: "24/7 dedicated support",
      unitAmount: 900,
      currency: "USD",
      billingType: "one_time",
    },
    {
      id: "addon_extra_seats",
      slug: "extra_seats",
      name: "5 Extra Seats",
      description: "Add 5 more team members to your workspace",
      unitAmount: 1500,
      currency: "USD",
      billingType: "one_time",
    },
  ],

  items: [
    {
      id: "plan_pro",
      slug: "pro",
      name: "Pro",
      description: "Perfect for professionals who need advanced features.",
      quantity: 1,
      unitAmount: 2900,
      currency: "USD",
      type: "product",
      billingType: "recurring",
      billing_interval: "monthly",
    },
  ],

  totals: {
    subtotal: 3800,
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
