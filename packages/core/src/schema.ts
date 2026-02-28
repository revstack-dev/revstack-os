import { z } from "zod";

// ==========================================
// 1. Enums & Primitives
// ==========================================

export const FeatureTypeSchema = z.enum(["boolean", "static", "metered"]);
export const UnitTypeSchema = z.enum([
  "count",
  "bytes",
  "seconds",
  "tokens",
  "requests",
  "custom",
]);
export const ResetPeriodSchema = z.enum([
  "daily",
  "weekly",
  "monthly",
  "yearly",
  "never",
]);
export const BillingIntervalSchema = z.enum([
  "monthly",
  "quarterly",
  "yearly",
  "one_time",
]);
export const PlanTypeSchema = z.enum(["paid", "free", "custom"]);
export const PlanStatusSchema = z.enum(["draft", "active", "archived"]);
export const SubscriptionStatusSchema = z.enum([
  "active",
  "trialing",
  "past_due",
  "canceled",
  "paused",
]);

// ==========================================
// 2. Feature Definitions (Entitlements)
// ==========================================

export const FeatureDefInputSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  type: FeatureTypeSchema,
  unit_type: UnitTypeSchema,
});

// ==========================================
// 3. Plan Feature Values (Plan Entitlements)
// ==========================================

export const PlanFeatureValueSchema = z.object({
  value_limit: z.number().min(0).optional(),
  value_bool: z.boolean().optional(),
  value_text: z.string().optional(),
  is_hard_limit: z.boolean().optional(),
  reset_period: ResetPeriodSchema.optional(),
});

export const AddonFeatureValueSchema = z.object({
  value_limit: z.number().min(0).optional(),
  type: z.enum(["increment", "set"]).optional(),
  has_access: z.boolean().optional(),
  is_hard_limit: z.boolean().optional(),
});

// ==========================================
// 4. Pricing
// ==========================================

export const OverageConfigurationSchema = z.record(
  z.string(),
  z.object({
    overage_amount: z.number().min(0),
    overage_unit: z.number().min(1),
  }),
);

export const PriceDefSchema = z.object({
  amount: z.number().min(0),
  currency: z.string(),
  billing_interval: BillingIntervalSchema,
  trial_period_days: z.number().min(0).optional(),
  is_active: z.boolean().optional(),
  overage_configuration: OverageConfigurationSchema.optional(),
  available_addons: z.array(z.string()).optional(),
});

// ==========================================
// 5. Plans
// ==========================================

export const PlanDefInputSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  is_default: z.boolean(),
  is_public: z.boolean(),
  type: PlanTypeSchema,
  status: PlanStatusSchema.optional().default("active"),
  prices: z.array(PriceDefSchema).optional(),
  features: z.record(z.string(), PlanFeatureValueSchema),
});

// ==========================================
// 6. Add-ons
// ==========================================

const BaseAddonDefInput = z.object({
  name: z.string(),
  description: z.string().optional(),
  amount: z.number().min(0),
  currency: z.string(),
  features: z.record(z.string(), AddonFeatureValueSchema),
});

const RecurringAddonSchema = BaseAddonDefInput.extend({
  type: z.literal("recurring"),
  billing_interval: z.enum(["monthly", "quarterly", "yearly"]),
});

const OneTimeAddonSchema = BaseAddonDefInput.extend({
  type: z.literal("one_time"),
  // omitted/ignored for one_time
  billing_interval: z.any().optional(),
});

export const AddonDefInputSchema = z.discriminatedUnion("type", [
  RecurringAddonSchema,
  OneTimeAddonSchema,
]);

// ==========================================
// 7. Discounts & Coupons
// ==========================================

export const DiscountTypeSchema = z.enum(["percent", "amount"]);
export const DiscountDurationSchema = z.enum(["once", "forever", "repeating"]);

const BaseDiscountDef = z.object({
  code: z.string(),
  name: z.string().optional(),
  applies_to_plans: z.array(z.string()).optional(),
  max_redemptions: z.number().min(1).optional(),
  expires_at: z.string().datetime().optional(),
});

const DiscountValueSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("percent"), value: z.number().min(0).max(100) }),
  z.object({ type: z.literal("amount"), value: z.number().min(0) }),
]);

const DiscountDurationLogic = z.discriminatedUnion("duration", [
  z.object({
    duration: z.literal("once"),
    duration_in_months: z.undefined().optional(),
  }),
  z.object({
    duration: z.literal("forever"),
    duration_in_months: z.undefined().optional(),
  }),
  z.object({
    duration: z.literal("repeating"),
    duration_in_months: z.number().min(1),
  }),
]);

export const DiscountDefSchema = BaseDiscountDef.and(DiscountValueSchema).and(
  DiscountDurationLogic,
);

// ==========================================
// 8. Config Root
// ==========================================

export const RevstackConfigSchema = z.object({
  features: z.record(z.string(), FeatureDefInputSchema),
  plans: z.record(z.string(), PlanDefInputSchema),
  addons: z.record(z.string(), AddonDefInputSchema).optional(),
  coupons: z.array(DiscountDefSchema).optional(),
});
