import { validateAndCastConfig } from "@/lib/config-validator";
import { ProviderManifest } from "@/manifest";
import { ProviderCategory } from "@/types/categories";
import { describe, it, expect } from "vitest";

describe("configValidator", () => {
  const mockManifest: ProviderManifest = {
    name: "Polar",
    slug: "polar",
    version: "1.0.0",
    categories: [ProviderCategory.MerchantOfRecord, ProviderCategory.Card],
    engine: {
      revstack: "^1.0.0",
      node: ">=18.0.0",
    },
    media: {
      icon: "https://cdn.jsdelivr.net/npm/@revstackhq/provider-polar/assets/logo-v2.svg",
      logo: "https://cdn.jsdelivr.net/npm/@revstackhq/provider-polar/assets/logo-v2.svg",
    },
    status: "beta",
    links: {
      dashboard: "https://polar.sh/dashboard",
      support: "https://polar.sh/docs/support",
      pricing: "https://polar.sh/resources/pricing",
      documentation: "https://docs.revstack.dev/providers/polar",
      setupGuide: "https://docs.revstack.dev/providers/polar/setup",
    },
    compliance: {
      actsAsMoR: true,
      calculatesTaxes: true,
    },
    hidden: false,
    pricing: {
      model: "transactional",
      fees: "4% + 40¢ per transaction",
      url: "https://polar.sh/resources/pricing",
    },
    localization: {
      customerCountries: ["*"],
      merchantCountries: ["US"],
      processingCurrencies: ["USD"],
      settlementCurrencies: ["USD"],
    },
    supportedPaymentMethods: ["card"],
    systemTraits: {
      hasNativeIdempotency: false,
      sandboxStrategy: "separate_credentials",
      rateLimits: {
        requestsPerSecond: 10,
      },
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
    description:
      "Merchant of record specifically tailored for software and SaaS developers.",
    sandboxAvailable: true,
    setup: {
      request: {
        accessToken: {
          label: "Access Token",
          type: "password",
          secure: true,
          required: true,
          description: "Polar Access Token",
          pattern: "^polar_(test_)?[a-zA-Z0-9_]+$",
          errorMessage: "Must start with polar_ or polar_test_",
        },
        organizationId: {
          label: "Organization ID",
          type: "text",
          secure: false,
          required: true,
          description: "Polar Organization ID to process checkouts for.",
        },
      },
      response: {
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
    },
    paginationType: "page",
  };

  it("validates correct configuration against the schema", () => {
    const validConfig = {
      accessToken: "polar_test_123",
      organizationId: "org_123",
    };
    expect(() =>
      validateAndCastConfig(validConfig, mockManifest.setup.request),
    ).not.toThrow();
  });

  it("throws RevstackError on missing required fields", () => {
    const invalidConfig = { organizationId: "org_123" }; // missing accessToken

    expect(() =>
      validateAndCastConfig(invalidConfig, mockManifest.setup.request),
    ).toThrow("Field 'Access Token' (accessToken) is required.");
  });
});
