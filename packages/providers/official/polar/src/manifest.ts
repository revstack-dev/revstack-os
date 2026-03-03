import { ProviderCategory, ProviderManifest } from "@revstackhq/providers-core";

export const manifest: ProviderManifest = {
  name: "Polar",
  slug: "polar",
  version: "1.0.0",
  categories: [ProviderCategory.Card, ProviderCategory.Wallet],
  engine: {
    revstack: "^1.0.0",
    node: ">=18.0.0",
  },
  media: {
    icon: "https://cdn.jsdelivr.net/npm/@revstackhq/provider-polar/assets/logo-v2.svg",
    logo: "https://cdn.jsdelivr.net/npm/@revstackhq/provider-polar/assets/logo-v2.svg",
  },
  status: "beta",
  dashboardUrl: "https://polar.sh/dashboard",
  hidden: false,
  pricing: {
    model: "transactional",
    fees: "4% + 40¢ per transaction",
    url: "https://polar.sh/resources/pricing",
  },
  capabilities: {
    customers: {
      supported: true,
      features: {
        create: true,
        update: true,
        delete: false,
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
        pause: false,
        resume: false,
        proration: true,
      },
    },
    webhooks: {
      supported: true,
      verification: "signature",
    },
    catalog: {
      supported: true,
      strategy: "pre_created",
    },
  },
  author: "Revstack",
  currencies: ["USD"],
  description:
    "Merchant of record specifically tailored for software and SaaS developers.",
  documentationUrl: "https://docs.revstack.dev/providers/polar",
  regions: ["*"],
  sandboxAvailable: true,
  supportUrl: "https://polar.sh/docs/support",
  configSchema: {
    accessToken: {
      label: "Access Token",
      type: "password",
      secure: true,
      required: true,
      description: "Polar Access Token",
      pattern: "^polar_.*$",
      errorMessage: "Must start with polar_",
    },
    organizationId: {
      label: "Organization ID",
      type: "text",
      secure: false,
      required: true,
      description: "Polar Organization ID to process checkouts for.",
    },
  },
  dataSchema: {
    webhookSecret: {
      secure: true,
      description: "Webhook signing secret",
    },
    webhookEndpointId: {
      secure: false,
      description: "Webhook endpoint ID",
    },
    accessToken: {
      secure: true,
      description: "Polar Access Token",
    },
    organizationId: {
      secure: false,
      description: "Polar Organization ID",
    },
  },

  paginationType: "page",
};
