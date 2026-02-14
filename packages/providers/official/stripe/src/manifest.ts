import { ProviderCategory, ProviderManifest } from "@revstackhq/providers-core";

export const manifest: ProviderManifest = {
  name: "Stripe",
  slug: "stripe",
  version: "1.0.0",
  category: ProviderCategory.Card,
  engine: {
    revstack: "^1.0.0",
    node: ">=18.0.0",
  },
  media: {
    icon: "https://cdn.jsdelivr.net/npm/@revstackhq/provider-stripe/assets/logo.svg",
    logo: "https://cdn.jsdelivr.net/npm/@revstackhq/provider-stripe/assets/logo.svg",
  },
  status: "beta",
  dependencies: [],
  dashboardUrl: "https://dashboard.stripe.com",
  hidden: false,
  pricing: {
    model: "transactional",
    fees: "2.9% + $0.30 per transaction",
    url: "https://stripe.com/pricing",
  },
  capabilities: {
    customers: {
      supported: false,
      features: {
        create: true,
        update: true,
        delete: true,
      },
    },
    checkout: {
      supported: true,
      strategy: "redirect",
    },
    payments: {
      supported: true,
      features: {
        capture: false,
        disputes: true,
        partialRefunds: true,
        refunds: true,
      },
    },
    subscriptions: {
      supported: true,
      mode: "native",
      features: {
        cancellation: true,
        pause: true,
        resume: true,
        proration: true,
      },
    },
    webhooks: {
      supported: true,
      verification: "signature",
    },
  },
  author: "Revstack",
  currencies: ["USD"],
  description:
    "Stripe is a payment processing platform that enables businesses to accept payments online. It provides a secure and convenient way for customers to pay for goods or services using various payment methods, including credit cards, bank transfers, and digital wallets.",
  documentationUrl: "https://docs.revstack.dev/providers/stripe",
  regions: ["*"],
  sandboxAvailable: true,
  supportUrl: "https://docs.revstack.dev/providers/stripe#support",
  configSchema: {
    apiKey: {
      label: "Secret Key",
      type: "password",
      secure: true,
      required: true,
      description:
        "The secret key used to authenticate requests to the Stripe API. This is required to perform any operations on behalf of the connected account.",
      pattern: "^sk_(test|live)_[a-zA-Z0-9]+$",
      errorMessage:
        "Invalid Secret Key. It must start with 'sk_test_' or 'sk_live_' followed by the alphanumeric key.",
    },
  },
  dataSchema: {
    webhookEndpointId: {
      secure: false,
      description:
        "The ID of the webhook endpoint. This is used to verify the integrity of incoming webhook events.",
    },
    webhookSecret: {
      secure: true,
      description:
        "The secret used to verify the integrity of incoming webhook events. This is used to ensure that the webhook events are not tampered with.",
    },
    apiKey: {
      secure: true,
      description:
        "The API key used to authenticate requests to the Stripe API. This is required to perform any operations on behalf of the connected account.",
    },
  },
};
