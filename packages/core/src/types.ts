/**
 * @file types.ts
 * @description Core type definitions for Revstack's Billing Engine.
 * These types map directly to the PostgreSQL database schema and
 * serve as the contract for "Billing as Code".
 */

// ==========================================
// 1. Enums & Primitives
// ==========================================

/**
 * The type of a feature/entitlement.
 * - 'boolean': On/Off flag (e.g., SSO Access).
 * - 'static': Fixed numeric limit included in the plan (e.g., 5 Seats).
 * - 'metered': Usage-based, tracked over time (e.g., AI Tokens).
 */
export type FeatureType = "boolean" | "static" | "metered";

/**
 * The unit of measurement for a feature.
 * Used for display, analytics, and billing calculations.
 */
export type UnitType =
  | "count"
  | "bytes"
  | "seconds"
  | "tokens"
  | "requests"
  | "custom";

/**
 * How often a feature's usage counter resets.
 */
export type ResetPeriod = "monthly" | "yearly" | "never";

/**
 * Billing interval for a plan's price.
 */
export type BillingInterval = "monthly" | "quarterly" | "yearly" | "one_time";

/**
 * The commercial classification of a plan.
 * - 'free': No payment required (e.g., Default Guest Plan, Starter).
 * - 'paid': Requires active payment method.
 * - 'custom': Enterprise / negotiated pricing.
 */
export type PlanType = "paid" | "free" | "custom";

/**
 * The lifecycle status of a plan.
 * - 'draft': Not yet visible or purchasable.
 * - 'active': Live and available for subscription.
 * - 'archived': No longer available for new subscriptions, existing ones honored.
 */
export type PlanStatus = "draft" | "active" | "archived";

/**
 * The lifecycle state of a customer's subscription.
 * Used by the EntitlementEngine to gate access based on payment status.
 */
export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "paused";

// ==========================================
// 2. Feature Definitions (Entitlements)
// ==========================================

/**
 * Definition of a Feature available in the system.
 * Maps to the `entitlements` table in the database.
 *
 * The `slug` field is the primary identifier and matches the dictionary
 * key in `RevstackConfig.features`.
 */
export interface FeatureDef {
  /** Unique slug/identifier (matches dictionary key in config). */
  slug: string;
  /** Human-readable display name. */
  name: string;
  /** Optional description for documentation and dashboard. */
  description?: string;
  /** The data type of the feature. */
  type: FeatureType;
  /** The unit of measurement. */
  unit_type: UnitType;
}

/**
 * Input type for `defineFeature()`.
 * The `slug` is omitted because it is inferred from the dictionary key.
 */
export type FeatureDefInput = Omit<FeatureDef, "slug">;

// ==========================================
// 3. Plan Feature Values (Plan Entitlements)
// ==========================================

/**
 * Configures how a feature behaves inside a specific Plan.
 * Maps to the `plan_entitlements` table in the database.
 *
 * Each field is optional — only set the fields relevant to the feature type:
 * - Boolean features: use `value_bool`.
 * - Static features: use `value_limit` + `is_hard_limit`.
 * - Metered features: use `value_limit` + `reset_period`.
 */
export interface PlanFeatureValue {
  /** Numeric limit (e.g., 5 seats, 10000 API calls). */
  value_limit?: number;
  /** Boolean toggle (e.g., SSO enabled/disabled). */
  value_bool?: boolean;
  /** Text value for display or metadata. */
  value_text?: string;
  /** If true, usage is blocked when limit is reached. */
  is_hard_limit?: boolean;
  /** How often usage resets. */
  reset_period?: ResetPeriod;
}

/**
 * Configures how a feature behaves inside a specific Addon.
 * An addon can either incrementally increase a plan's limit, set an absolute new limit,
 * or grant boolean access.
 */
export interface AddonFeatureValue {
  /** Numeric limit to add or set. */
  value_limit?: number;
  /** How the limit is applied. 'increment' adds to the base plan, 'set' overrides it. */
  type?: "increment" | "set";
  /** Boolean toggle (e.g. granting access). */
  has_access?: boolean;
  /** If false, allows overage (relaxes the limit to a soft limit). */
  is_hard_limit?: boolean;
}

// ==========================================
// 4. Pricing
// ==========================================

/**
 * Defines the pricing for a plan.
 * Maps to the `prices` table in the database.
 */
export interface PriceDef {
  /** Price amount in the smallest currency unit (e.g., cents). */
  amount: number;
  /** ISO 4217 currency code (e.g., "USD", "EUR"). */
  currency: string;
  /** How often the customer is billed. */
  billing_interval: BillingInterval;
  /** Number of days for a free trial before billing starts. */
  trial_period_days?: number;
  /** Whether this price is currently active. */
  is_active?: boolean;
  /**
   * Overage configuration for metered features.
   * Maps feature slugs to their overage pricing terms.
   * Note: The Entitlement Engine handles the "if" (reason: overage_allowed)
   * when a plan allows overage (is_hard_limit: false). This overage_configuration
   * is what the Cloud API and payment providers use to calculate the "how much".
   */
  overage_configuration?: Record<
    string,
    {
      /** Cost in smallest currency unit (cents) for the overage. */
      overage_amount: number;
      /** The quantity of units the overage_amount applies to. */
      overage_unit: number;
    }
  >;
}

// ==========================================
// 5. Plans
// ==========================================

/**
 * Full plan definition. Maps to the `plans` table in the database.
 *
 * The `slug` is the primary identifier and matches the dictionary
 * key in `RevstackConfig.plans`.
 */
export interface PlanDef {
  /** Unique slug/identifier (matches dictionary key in config). */
  slug: string;
  /** Human-readable display name. */
  name: string;
  /** Optional description. */
  description?: string;
  /** Whether this is the default guest plan. */
  is_default: boolean;
  /** Whether this plan is visible on the pricing page. */
  is_public: boolean;
  /** Commercial classification. */
  type: PlanType;
  /** Lifecycle status. */
  status: PlanStatus;
  /** Optional pricing tiers (1:N). Free/default plans have no prices. */
  prices?: PriceDef[];
  /** Feature entitlements included in this plan. */
  features: Record<string, PlanFeatureValue>;
  /** Slugs of addons that can be attached to this plan. */
  available_addons?: string[];
}

/**
 * Input type for `definePlan()`.
 * - `slug` is omitted (inferred from dictionary key).
 * - `status` is optional (defaults to `'active'`).
 */
export type PlanDefInput = Omit<PlanDef, "slug" | "status" | "features"> & {
  status?: PlanStatus;
  features: Record<string, PlanFeatureValue>;
  available_addons?: string[];
};

// ==========================================
// 6. Add-ons
// ==========================================

/**
 * An add-on is a product purchased on top of a subscription.
 * Maps to the `addons` table in the database.
 */
export interface AddonDef {
  /** Unique slug/identifier. */
  slug: string;
  /** Human-readable display name. */
  name: string;
  /** Optional description. */
  description?: string;
  /** Billing type. */
  type: "recurring" | "one_time";
  /** Add-on pricing configurations (1:N). */
  prices?: PriceDef[];
  /** Feature entitlements this add-on modifies or grants. */
  features: Record<string, AddonFeatureValue>;
}

/**
 * Input type for `defineAddon()`.
 * The `slug` is omitted (inferred from dictionary key).
 */
export type AddonDefInput = Omit<AddonDef, "slug">;

// ==========================================
// 7. Discounts & Coupons
// ==========================================

export type DiscountType = "percent" | "amount";
export type DiscountDuration = "once" | "forever" | "repeating";

export interface DiscountDef {
  /** The code the user enters at checkout (e.g., 'BLACKFRIDAY_24'). */
  code: string;
  /** Friendly name for invoices. */
  name?: string;
  /** 'percent' (0–100) or 'amount' (smallest currency unit). */
  type: DiscountType;
  /** The discount value. */
  value: number;
  /** How long the discount lasts. */
  duration: DiscountDuration;
  /** If duration is 'repeating', how many months. */
  duration_in_months?: number;
  /** Restrict to specific plan slugs. Empty = all. */
  applies_to_plans?: string[];
  /** Maximum number of redemptions globally. */
  max_redemptions?: number;
  /** Expiration date (ISO 8601). */
  expires_at?: string;
}

// ==========================================
// 8. Engine Output
// ==========================================

/**
 * The output of the Entitlement Engine.
 * Answers: "Can the user do this?"
 */
export interface CheckResult {
  /** Is the action allowed? */
  allowed: boolean;
  /** Why was it allowed or denied? */
  reason?:
    | "feature_missing"
    | "limit_reached"
    | "past_due"
    | "included"
    | "overage_allowed";
  /** How many units remain before hitting the limit. Infinity if unlimited. */
  remaining?: number;
  /** Estimated overage cost in the smallest currency unit. */
  cost_estimate?: number;
  /** Which sources granted access (plan and/or addon slugs). */
  granted_by?: string[];
}

// ==========================================
// 9. Config Root
// ==========================================

/**
 * The structure of the `revstack.config.ts` file.
 *
 * Features and plans are dictionaries keyed by slug.
 * The define helpers (`defineFeature`, `definePlan`) return input types
 * without `slug` — it is inferred from the dictionary key.
 */
export interface RevstackConfig {
  /** Dictionary of all available features, keyed by slug. */
  features: Record<string, FeatureDefInput>;
  /** Dictionary of all plans, keyed by slug. */
  plans: Record<string, PlanDefInput>;
  /** Dictionary of available add-ons, keyed by slug. */
  addons?: Record<string, AddonDefInput>;
  /** Array of available coupons/discounts. */
  coupons?: DiscountDef[];
}
