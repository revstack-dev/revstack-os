/**
 * @file define.ts
 * @description Identity helpers for "Billing as Code" config authoring.
 *
 * These functions return their input unchanged — their sole purpose is to
 * provide autocompletion, type narrowing, and compile-time validation
 * when developers write their `revstack.config.ts`.
 *
 * @example
 * ```typescript
 * import { defineConfig, defineFeature, definePlan } from "@revstackhq/core";
 *
 * const features = {
 *   seats: defineFeature({ name: "Seats", type: "static", unit_type: "count" }),
 *   sso:   defineFeature({ name: "SSO",   type: "boolean", unit_type: "count" }),
 * };
 *
 * export default defineConfig({
 *   features,
 *   plans: {
 *     default: definePlan<typeof features>({
 *       name: "Default",
 *       is_default: true,
 *       is_public: false,
 *       type: "free",
 *       features: {},
 *     }),
 *     pro: definePlan<typeof features>({
 *       name: "Pro",
 *       is_default: false,
 *       is_public: true,
 *       type: "paid",
 *       prices: [{ amount: 2900, currency: "USD", billing_interval: "monthly" }],
 *       features: {
 *         seats: { value_limit: 5, is_hard_limit: true },
 *         sso:   { value_bool: true },
 *       },
 *     }),
 *   },
 * });
 * ```
 */

import type {
  FeatureDefInput,
  PlanDefInput,
  PlanFeatureValue,
  AddonFeatureValue,
  AddonDefInput,
  DiscountDef,
  RevstackConfig,
} from "@/types.js";

// ─── Feature ─────────────────────────────────────────────────

/**
 * Define a feature with full type inference.
 * Identity function — returns the input as-is.
 */
export function defineFeature<T extends FeatureDefInput>(config: T): T {
  return config;
}

// ─── Plan (Typed against feature dictionary) ─────────────────

/**
 * Define a Plan with optional compile-time feature key restriction.
 *
 * When called with a generic `F` (your feature dictionary type),
 * the `features` object only accepts keys that exist in `F`.
 *
 * @typeParam F - Feature dictionary type. Pass `typeof yourFeatures` for strict keys.
 *
 * @example
 * ```typescript
 * // Strict mode — typos cause compile errors:
 * definePlan<typeof features>({ ..., features: { seats: { value_limit: 5 } } });
 *
 * // Loose mode — any string key accepted (backwards compatible):
 * definePlan({ ..., features: { anything: { value_bool: true } } });
 * ```
 */
export function definePlan<
  F extends Record<string, FeatureDefInput> = Record<string, FeatureDefInput>,
>(
  config: Omit<PlanDefInput, "features"> & {
    features: F extends Record<string, FeatureDefInput>
      ? Partial<Record<keyof F, PlanFeatureValue>>
      : Record<string, PlanFeatureValue>;
  },
): PlanDefInput {
  return config as PlanDefInput;
}

// ─── Add-on (Typed against feature dictionary) ───────────────

/**
 * Define an Add-on with optional compile-time feature key restriction.
 * Same generic pattern as `definePlan`.
 *
 * @typeParam F - Feature dictionary type for key restriction.
 */
export function defineAddon<
  F extends Record<string, FeatureDefInput> = Record<string, FeatureDefInput>,
>(
  config: Omit<AddonDefInput, "features"> & {
    features: F extends Record<string, FeatureDefInput>
      ? Partial<Record<keyof F, AddonFeatureValue>>
      : Record<string, AddonFeatureValue>;
  },
): AddonDefInput {
  return config as AddonDefInput;
}

// ─── Discount ────────────────────────────────────────────────

/**
 * Define a discount/coupon with full type inference.
 * Identity function — returns the input as-is.
 */
export function defineDiscount<T extends DiscountDef>(config: T): T {
  return config;
}

// ─── Config Root ─────────────────────────────────────────────

/**
 * Define the root billing configuration.
 * Wraps the entire `revstack.config.ts` export for type inference.
 */
export function defineConfig<T extends RevstackConfig>(config: T): T {
  return config;
}
