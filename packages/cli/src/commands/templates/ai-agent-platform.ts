import { TemplateConfig } from "./starter";

export const aiAgentPlatform: TemplateConfig = {
  features: `import { defineFeature } from "@revstackhq/core";

export const features = {
  llm_tokens: defineFeature({ name: "LLM Tokens (Input+Output)", type: "metered", unit_type: "count" }),
  active_agents: defineFeature({ name: "Concurrent Agents", type: "static", unit_type: "count" }),
  vector_storage_gb: defineFeature({ name: "Vector Database (GB)", type: "metered", unit_type: "custom" }),
  custom_fine_tuning: defineFeature({ name: "Model Fine-Tuning", type: "boolean", unit_type: "custom" })
};
`,
  addons: `import { defineAddon } from "@revstackhq/core";
import { features } from "./features";

export const addons = {
  extra_vector_storage: defineAddon<typeof features>({
    name: "10GB Vector Storage Block",
    description: "Retain long-term memory for your AI agents.",
    type: "recurring",
    amount: 1000,
    currency: "USD",
    billing_interval: "monthly",
    features: {
      vector_storage_gb: { value_limit: 10, type: "increment", is_hard_limit: false }
    }
  }),
  fine_tuning_job: defineAddon<typeof features>({
    name: "Fine-Tuning Job Runner",
    description: "Pay once to run a distributed model fine-tuning job on your dataset.",
    type: "one_time",
    amount: 25000,
    currency: "USD",
    features: {
      custom_fine_tuning: { has_access: true }
    }
  })
};
`,
  plans: `import { definePlan } from "@revstackhq/core";
import { features } from "./features";

export const plans = {
  default: definePlan<typeof features>({
    name: "Free Preview",
    description: "Trial sandbox using shared models.",
    is_default: true,
    is_public: true,
    type: "free",
    features: {
      llm_tokens: { value_limit: 100000, is_hard_limit: true, reset_period: "monthly" },
      active_agents: { value_limit: 1, is_hard_limit: true },
      vector_storage_gb: { value_limit: 0, is_hard_limit: true, reset_period: "never" },
      custom_fine_tuning: { value_bool: false }
    },
  }),
  builder: definePlan<typeof features>({
    name: "AI Builder",
    description: "High concurrency and dedicated model endpoints.",
    is_default: false,
    is_public: true,
    type: "paid",
    prices: [
      {
        amount: 4900,
        currency: "USD",
        billing_interval: "monthly",
        available_addons: ["extra_vector_storage", "fine_tuning_job"],
        overage_configuration: {
            llm_tokens: { overage_amount: 15, overage_unit: 1000000 } // $0.15 per 1M tokens
        }
      }
    ],
    features: {
      llm_tokens: { value_limit: 10000000, is_hard_limit: false, reset_period: "monthly" }, // 10M free tokens included
      active_agents: { value_limit: 10, is_hard_limit: true },
      vector_storage_gb: { value_limit: 5, is_hard_limit: true, reset_period: "never" }, // Hard limit until they buy the addon
      custom_fine_tuning: { value_bool: false } // Only unlocked via the one-off addon
    },
  }),
};
`,
  coupons: `import type { DiscountDef } from "@revstackhq/core";

export const coupons: DiscountDef[] = [
  {
    code: "BETA_TESTER",
    name: "Early Beta Access Discount",
    type: "percent",
    value: 50,
    duration: "repeating",
    duration_in_months: 12,
    max_redemptions: 100
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
