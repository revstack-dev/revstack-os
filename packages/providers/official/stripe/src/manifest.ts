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
  description: "Global payment processing platform.",
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
      description: "Stripe Secret API Key",
      pattern: "^sk_(test|live)_[a-zA-Z0-9]+$",
      errorMessage: "Must start with sk_test_ or sk_live_",
    },
  },
  dataSchema: {
    webhookEndpointId: {
      secure: false,
      description: "Endpoint ID for webhooks",
    },
    webhookSecret: {
      secure: true,
      description: "Webhook signing secret",
    },
    apiKey: {
      secure: true,
      description: "Stripe Secret API Key",
    },
  },
};
