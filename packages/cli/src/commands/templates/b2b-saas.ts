import { TemplateConfig } from "./starter";

export const b2bSaas: TemplateConfig = {
  features: `import { defineFeature } from "@revstackhq/core";

export const features = {
  active_users: defineFeature({ name: "Active Users", type: "static", unit_type: "count" }),
  api_access: defineFeature({ name: "API Access", type: "boolean", unit_type: "custom" }),
  custom_domain: defineFeature({ name: "Custom Domain", type: "boolean", unit_type: "custom" }),
};
`,
  addons: `import { defineAddon } from "@revstackhq/core";
import { features } from "./features";

export const addons = {
  extra_users: defineAddon<typeof features>({
    name: "10 Extra Users",
    description: "Add 10 more active users to your workspace.",
    type: "recurring",
    prices: [
      { amount: 5000, currency: "USD", billing_interval: "monthly" }
    ],
    features: {
      active_users: { value_limit: 10, type: "increment", is_hard_limit: true },
    }
  }),
  dedicated_support: defineAddon<typeof features>({
    name: "Dedicated Support",
    description: "Enterprise SLA with 1-hour response time.",
    type: "recurring",
    prices: [
      { amount: 49900, currency: "USD", billing_interval: "monthly" }
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
  startup: definePlan<typeof features>({
    name: "Startup",
    description: "For small teams getting started.",
    is_default: false,
    is_public: true,
    type: "paid",
    available_addons: ["extra_users"],
    prices: [
      { amount: 9900, currency: "USD", billing_interval: "monthly" }
    ],
    features: {
      active_users: { value_limit: 10, is_hard_limit: true },
      api_access: { value_bool: false },
      custom_domain: { value_bool: false },
    },
  }),
  enterprise: definePlan<typeof features>({
    name: "Enterprise",
    description: "Advanced features for scale.",
    is_default: false,
    is_public: true,
    type: "paid",
    available_addons: ["extra_users", "dedicated_support"],
    prices: [
      { amount: 49900, currency: "USD", billing_interval: "monthly" }
    ],
    features: {
      active_users: { value_limit: 100, is_hard_limit: false },
      api_access: { value_bool: true },
      custom_domain: { value_bool: true },
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
