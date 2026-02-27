import { TemplateConfig } from "./starter";

export const usageBased: TemplateConfig = {
  features: `import { defineFeature } from "@revstackhq/core";

export const features = {
  api_requests: defineFeature({ name: "API Requests", type: "metered", unit_type: "requests" }),
  storage_gb: defineFeature({ name: "Storage (GB)", type: "metered", unit_type: "custom" }),
};
`,
  addons: `import { defineAddon } from "@revstackhq/core";
import { features } from "./features";

export const addons = {
  premium_support: defineAddon<typeof features>({
    name: "Premium Support",
    description: "24/7 dedicated support.",
    type: "recurring",
    prices: [
      { amount: 20000, currency: "USD", billing_interval: "monthly" }
    ],
    features: {}
  })
};
`,
  plans: `import { definePlan } from "@revstackhq/core";
import { features } from "./features";

export const plans = {
  default: definePlan<typeof features>({
    name: "Default",
    description: "Automatically created default plan for guests.",
    is_default: true,
    is_public: false,
    type: "free",
    features: {},
  }),
  pay_as_you_go: definePlan<typeof features>({
    name: "Pay As You Go",
    description: "Flexible usage-based pricing.",
    is_default: false,
    is_public: true,
    type: "paid",
    available_addons: ["premium_support"],
    prices: [
      { amount: 0, currency: "USD", billing_interval: "monthly" } // Base platform fee
    ],
    features: {
      api_requests: { value_limit: 10000, is_hard_limit: false, reset_period: "monthly" }, // 10k free requests per month
      storage_gb: { value_limit: 5, is_hard_limit: false, reset_period: "never" }, // 5GB free storage lifetime
    },
  }),
};
`,
  index: `import { defineConfig } from "@revstackhq/core";
import { features } from "./features";
import { addons } from "./addons";
import { plans } from "./plans";

export default defineConfig({
  features,
  addons,
  plans,
});
`,
  root: `import config from "./revstack";

export default config;
`,
};
