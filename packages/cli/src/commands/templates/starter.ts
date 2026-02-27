export interface TemplateConfig {
  features: string;
  addons: string;
  plans: string;
  index: string;
  root: string;
}

export const starter: TemplateConfig = {
  features: `import { defineFeature } from "@revstackhq/core";

export const features = {
  seats: defineFeature({ name: "Seats", type: "static", unit_type: "count" }),
  priority_support: defineFeature({ name: "Priority Support", type: "boolean", unit_type: "custom" }),
};
`,
  addons: `import { defineAddon } from "@revstackhq/core";
import { features } from "./features";

export const addons = {
  extra_seats: defineAddon<typeof features>({
    name: "5 Extra Seats",
    description: "Add 5 more team members to your workspace.",
    type: "recurring",
    prices: [
      { amount: 1500, currency: "USD", billing_interval: "monthly" }
    ],
    features: {
      seats: { value_limit: 5, type: "increment", is_hard_limit: false },
    }
  }),
  vip_support: defineAddon<typeof features>({
    name: "Priority Support",
    description: "24/7 Slack channel support.",
    type: "recurring",
    prices: [
      { amount: 9900, currency: "USD", billing_interval: "monthly" }
    ],
    features: {
      priority_support: { has_access: true },
    }
  })
};
`,
  plans: `import { definePlan } from "@revstackhq/core";
import { features } from "./features";

export const plans = {
  // DO NOT DELETE: Automatically created default plan for guests.
  default: definePlan<typeof features>({
    name: "Default",
    description: "Automatically created default plan for guests.",
    is_default: true,
    is_public: false,
    type: "free",
    features: {},
  }),
  pro: definePlan<typeof features>({
    name: "Pro",
    description: "For professional teams.",
    is_default: false,
    is_public: true,
    type: "paid",
    available_addons: ["extra_seats", "vip_support"],
    prices: [
      { amount: 2900, currency: "USD", billing_interval: "monthly", trial_period_days: 14 }
    ],
    features: {
      seats: { value_limit: 5, is_hard_limit: true },
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
