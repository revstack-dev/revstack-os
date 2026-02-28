import { TemplateConfig } from "./starter";

export const developerTools: TemplateConfig = {
  features: `import { defineFeature } from "@revstackhq/core";

export const features = {
  bandwidth_gb: defineFeature({ name: "Bandwidth (GB)", type: "metered", unit_type: "custom" }),
  compute_hours: defineFeature({ name: "Compute (GB-Hours)", type: "metered", unit_type: "custom" }),
  serverless_invokes: defineFeature({ name: "Serverless Invocations", type: "metered", unit_type: "count" }),
  sso_auth: defineFeature({ name: "Enterprise SSO", type: "boolean", unit_type: "custom" })
};
`,
  addons: `import { defineAddon } from "@revstackhq/core";
import { features } from "./features";

export const addons = {
  dedicated_ipv4: defineAddon<typeof features>({
    name: "Dedicated IPv4 Address",
    description: "Assign a static IP to your deployments.",
    type: "recurring",
    amount: 500,
    currency: "USD",
    billing_interval: "monthly",
    features: {}
  }),
  premium_sla: defineAddon<typeof features>({
    name: "Premium Escalation SLA",
    description: "Direct engineering support with 30-min response time.",
    type: "recurring",
    amount: 150000,
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
    name: "Hobby",
    description: "For personal or non-commercial projects.",
    is_default: true,
    is_public: true,
    type: "free",
    features: {
      bandwidth_gb: { value_limit: 100, is_hard_limit: true, reset_period: "monthly" },
      compute_hours: { value_limit: 100, is_hard_limit: true, reset_period: "monthly" },
      serverless_invokes: { value_limit: 100000, is_hard_limit: true, reset_period: "monthly" },
      sso_auth: { value_bool: false }
    },
  }),
  pro: definePlan<typeof features>({
    name: "Pro",
    description: "For production apps and growing teams.",
    is_default: false,
    is_public: true,
    type: "paid",
    prices: [
      {
        amount: 2000,
        currency: "USD",
        billing_interval: "monthly",
        available_addons: ["dedicated_ipv4"],
        overage_configuration: {
            bandwidth_gb: { overage_amount: 40, overage_unit: 100 }, // $0.40 per 100GB extra
            compute_hours: { overage_amount: 2, overage_unit: 1 }, // $0.02 per extra GB hr
            serverless_invokes: { overage_amount: 50, overage_unit: 1000000 } // $0.50 per 1M invokes
        }
      }
    ],
    features: {
      bandwidth_gb: { value_limit: 1000, is_hard_limit: false, reset_period: "monthly" },
      compute_hours: { value_limit: 1000, is_hard_limit: false, reset_period: "monthly" },
      serverless_invokes: { value_limit: 5000000, is_hard_limit: false, reset_period: "monthly" },
      sso_auth: { value_bool: false }
    },
  }),
  enterprise: definePlan<typeof features>({
    name: "Enterprise",
    description: "Custom infrastructure and legal compliance.",
    is_default: false,
    is_public: true,
    type: "custom",
    prices: [],
    features: {
      bandwidth_gb: { value_limit: 50000, is_hard_limit: false, reset_period: "monthly" },
      compute_hours: { value_limit: 10000, is_hard_limit: false, reset_period: "monthly" },
      serverless_invokes: { value_limit: 100000000, is_hard_limit: false, reset_period: "monthly" },
      sso_auth: { value_bool: true }
    },
  }),
};
`,
  coupons: `import type { DiscountDef } from "@revstackhq/core";

export const coupons: DiscountDef[] = [
  {
    code: "YCOMBINATOR",
    name: "YC Startup Accelerator Credit",
    type: "amount",
    value: 1000000, // $10,000 credit
    duration: "forever",
    applies_to_plans: ["pro", "enterprise"]
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
