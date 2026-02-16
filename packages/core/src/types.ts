/**
 * @file types.ts
 * @description Core type definitions for Revstack's Billing Engine.
 * This file acts as the contract for "Billing as Code".
 */

// ==========================================
// 1. Fundamentals & Currency
// ==========================================

/**
 * The base currency for the entire system is USD.
 * All internal calculations, limits, and price definitions in the OS repo
 * are assumed to be in USD cents unless specified otherwise.
 * External layers (FX) handle conversion before reaching this core.
 */
export type BaseCurrency = "USD";

/**
 * Supported billing intervals for subscriptions.
 * Extended to support weekly, quarterly, and one-time purchases.
 */
export type BillingInterval =
  | "day" // Daily billing (rare, but possible for high-velocity)
  | "week" // Weekly billing
  | "month" // Standard monthly billing
  | "quarter" // Quarterly (every 3 months)
  | "year" // Annual billing
  | "one_time"; // Lifetime deals (LTDs) or single purchases

/**
 * How usage is aggregated over a billing period.
 * - 'sum': Adds up all usage (e.g., API calls).
 * - 'max': Takes the maximum usage seen (e.g., max concurrent connections).
 * - 'last': Takes the last recorded value (e.g., storage used at end of month).
 */
export type UsageAggregation = "sum" | "max" | "last";

/**
 * Defines what happens when a billing period ends for a specific entitlement.
 * - 'reset': Usage counter goes back to 0 (Standard SaaS limits).
 * - 'rollover': Unused usage carries over (e.g., rollover minutes).
 * - 'infinite': Usage never resets (Lifetime limits).
 */
export type ResetBehavior = "reset" | "rollover" | "infinite";

export type FeatureType =
  | "boolean" // On/Off feature (e.g., SSO Access)
  | "static" // Fixed number included (e.g., 5 Users)
  | "metered"; // Pay-as-you-go or usage-based (e.g., AI Tokens)

// ==========================================
// 2. Feature Definitions
// ==========================================

/**
 * Definition of a Feature available in the system.
 * This maps to the 'entitlements' table in the DB.
 */
export interface FeatureDef {
  /** Unique slug/ID for the feature (e.g., 'audit_logs', 'seats') */
  id: string;
  /** Human readable description */
  description?: string;
  /** The data type of the feature */
  type: FeatureType;
  /** * For metered features, how do we count them?
   * @default 'sum'
   */
  aggregation?: UsageAggregation;
}

// ==========================================
// 3. Entitlement Logic (The "Building Block")
// ==========================================

/**
 * Configures how a feature behaves inside a specific Plan.
 * This handles the logic for limits, overages, and pricing per unit.
 */
export interface FeatureEntitlement {
  /** * Whether the feature is accessible at all.
   * @default true
   */
  included: boolean;

  /** * The limit included in the base price.
   * - For 'static': Hard limit (e.g., 5 seats).
   * - For 'metered': Included units before overage starts (e.g., 10k free tokens).
   * - If null/undefined for metered, it means 0 included (pay from start).
   * NOTE: In Add-ons, this value ADDS to the base plan limit.
   */
  limit?: number;

  /**
   * Price per unit in USD Cents.
   * Used for:
   * 1. 'static': Price for extra seats (e.g., $10 per extra user).
   * 2. 'metered': Price per API call after limit is reached.
   */
  unitPrice?: number;

  /**
   * If true, the system will block usage when the limit is reached.
   * If false, it allows overage (billable or silent).
   * @default true
   */
  isHardLimit?: boolean;

  /**
   * How often this limit resets.
   * @default 'month' (if the plan is monthly)
   */
  resetPeriod?: BillingInterval;
}

/**
 * A shorthand type for developers defining plans.
 * They can pass:
 * - true: Access enabled, default limits.
 * - number: A simple static limit (e.g., `seats: 5`).
 * - FeatureEntitlement: Full configuration object.
 */
export type FeatureValue = boolean | number | FeatureEntitlement;

// ==========================================
// 4. Plans & Add-ons (The "Products")
// ==========================================

/**
 * Common properties between Plans and Add-ons.
 */
interface ProductBase {
  /** Unique slug for the product variant */
  id: string;
  /** Display name */
  name: string;
  /** Human readable description */
  description?: string;
  /** Base price in USD Cents */
  price: number;
  /** The currency code (Strictly USD for Core) */
  currency: BaseCurrency;
  /** Billing frequency */
  interval: BillingInterval;
  /** * Number of intervals (e.g., interval='month', intervalCount=3 -> Quarterly).
   * @default 1
   */
  intervalCount?: number;
  /** Metadata for UI (badges, recommended flag, etc.) */
  metadata?: Record<string, unknown>;
  /** * The core map of features included in this product.
   * Keys must match FeatureDef.id
   */
  features: Record<string, FeatureValue>;
}

/**
 * Represents a Pricing Tier or Plan Variant.
 */
export interface PlanDef extends ProductBase {
  /** * Trial period in days.
   * @default 0
   */
  trialDays?: number;
}

/**
 * An Add-on is a product purchased ON TOP of a subscription.
 * e.g., "Extra 5 Seats" or "Premium Support Module".
 */
export interface AddonDef extends ProductBase {
  /**
   * - 'recurring': Billed every cycle along with the subscription.
   * - 'one_time': Billed once immediately (e.g. Setup Fee).
   * @default 'recurring'
   */
  type?: "recurring" | "one_time";
}

// ==========================================
// 5. Discounts & Coupons
// ==========================================

export type DiscountType = "percent" | "amount";

export type DiscountDuration =
  | "once" // Applies to the first invoice only
  | "forever" // Applies to all invoices indefinitely
  | "repeating"; // Applies for a specific number of months

export interface DiscountDef {
  /** The code user types in checkout (e.g., 'BLACKFRIDAY_24') */
  code: string;
  /** Friendly name for invoice */
  name?: string;
  /** 'percent' (0-100) or 'amount' (USD Cents) */
  type: DiscountType;
  /** The value (e.g., 50 for 50%, or 1000 for $10 off) */
  value: number;
  /** How long the discount lasts */
  duration: DiscountDuration;
  /** If duration is 'repeating', how many months? */
  durationInMonths?: number;
  /** Restrict coupon to specific plan IDs. Empty = all. */
  appliesToPlans?: string[];
  /** Max redemptions globally */
  maxRedemptions?: number;
  /** Expiration date (ISO string) */
  expiresAt?: string;
}

// ==========================================
// 6. Engine Inputs & Config
// ==========================================

/**
 * Represents the current consumption of a user.
 * Fed into the engine to determine access.
 */
export interface UserUsage {
  /** * Map of feature_id -> amount consumed.
   * e.g., { 'seats': 3, 'ai_tokens': 15000 }
   */
  [featureId: string]: number;
}

/**
 * The output of the Entitlement Engine.
 * Answers: "Can the user do this?"
 */
export interface CheckResult {
  /** Is the action allowed? */
  allowed: boolean;

  /** Why was it allowed or denied? */
  reason?:
    | "feature_missing" // Feature not in plan
    | "limit_reached" // Hard limit hit
    | "past_due" // Subscription unpaid
    | "included" // Within limits
    | "overage_allowed"; // Allowed via overage

  /** * How much is left before hitting the limit?
   * Returns Infinity if no limit.
   */
  remaining?: number;

  /**
   * If usage triggers a cost (overage), this is the estimated cost in USD Cents.
   * Useful for "Spend Management" agents.
   */
  costEstimate?: number;

  /** Which source granted access? (Plan or Addon ID) */
  grantedBy?: string;
}

/**
 * The structure of the `revstack.config.ts` file.
 */
export interface RevstackConfig {
  /** Dictionary of all available features */
  features: Record<string, FeatureDef>;
  /** Array of available plans */
  plans: PlanDef[];
  /** Array of available add-ons */
  addons?: AddonDef[];
  /** Array of available coupons */
  coupons?: DiscountDef[];
}
