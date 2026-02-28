import { TemplateConfig } from "./starter";

export const ecommercePlatform: TemplateConfig = {
  features: `import { defineFeature } from "@revstackhq/core";

export const features = {
  orders: defineFeature({ name: "Monthly Orders", type: "metered", unit_type: "count" }),
  storefronts: defineFeature({ name: "Storefronts", type: "static", unit_type: "count" }),
  advanced_analytics: defineFeature({ name: "Advanced Analytics", type: "boolean", unit_type: "custom" }),
};
`,
  addons: `import { defineAddon } from "@revstackhq/core";
import { features } from "./features";

export const addons = {
  extra_storefront: defineAddon<typeof features>({
    name: "Additional Storefront",
    description: "Launch a new brand under the same account.",
    type: "recurring",
    amount: 5000,
    currency: "USD",
    billing_interval: "monthly",
    features: {
      storefronts: { value_limit: 1, type: "increment", is_hard_limit: true },
    }
  }),
  custom_domain_ssl: defineAddon<typeof features>({
    name: "Custom Domain & SSL",
    description: "Secure your storefront with a custom domain.",
    type: "recurring",
    amount: 1500,
    currency: "USD",
    billing_interval: "monthly",
    features: {}
  })
};
`,
  plans: `import { definePlan } from "@revstackhq/core";
import { features } from "./features";

export const plans = {
  default: definePlan<typeof features>({
    name: "Default Sandbox",
    description: "Test your store safely before going live.",
    is_default: true,
    is_public: false,
    type: "free",
    features: {},
  }),
  basic: definePlan<typeof features>({
    name: "Basic Commerce",
    description: "Everything you need to sell online.",
    is_default: false,
    is_public: true,
    type: "paid",
    prices: [
      {
        amount: 2900,
        currency: "USD",
        billing_interval: "monthly",
        available_addons: ["custom_domain_ssl"],
        overage_configuration: {
            orders: { overage_amount: 50, overage_unit: 100 } // $0.50 per 100 extra orders
        }
      }
    ],
    features: {
      orders: { value_limit: 500, is_hard_limit: false, reset_period: "monthly" },
      storefronts: { value_limit: 1, is_hard_limit: true },
      advanced_analytics: { value_bool: false },
    },
  }),
  pro: definePlan<typeof features>({
    name: "Pro Seller",
    description: "For scaling businesses.",
    is_default: false,
    is_public: true,
    type: "paid",
    prices: [
      {
        amount: 19900,
        currency: "USD",
        billing_interval: "monthly",
        available_addons: ["extra_storefront", "custom_domain_ssl"],
        overage_configuration: {
            orders: { overage_amount: 30, overage_unit: 100 } // $0.30 per 100 extra orders
        }
      }
    ],
    features: {
      orders: { value_limit: 5000, is_hard_limit: false, reset_period: "monthly" },
      storefronts: { value_limit: 2, is_hard_limit: true },
      advanced_analytics: { value_bool: true },
    },
  }),
};
`,
  coupons: `import type { DiscountDef } from "@revstackhq/core";

export const coupons: DiscountDef[] = [
  {
    code: "BFCM_PROMO",
    name: "Black Friday Cyber Monday 20%",
    type: "percent",
    value: 20,
    duration: "repeating",
    duration_in_months: 6,
    expires_at: "2024-11-29T00:00:00Z", // Ephemeral timestamp
    max_redemptions: 5000
  },
  {
    code: "FIRST_MONTH_FREE",
    name: "New Store Launch",
    type: "percent",
    value: 100,
    duration: "repeating",
    duration_in_months: 1,
    applies_to_plans: ["basic"]
  }
];
`,
  index: `import { defineConfig } from "@revstackhq/core";
import { features } from "./features";
import { addons } from "./addons";
import { plans } from "./plans";
import { coupons } from "./coupons";

export default defineConfig({
  features,
  addons,
  plans,
  coupons,
});
`,
  root: `import config from "./revstack";

export default config;
`,
};
