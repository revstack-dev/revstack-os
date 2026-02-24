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
 * import { defineConfig, defineFeature, definePlan, defineAddon, defineDiscount } from "@revstackhq/core";
 *
 * const features = {
 *   seats: defineFeature({ id: "seats", type: "static" }),
 *   sso:   defineFeature({ id: "sso",   type: "boolean" }),
 * };
 *
 * export default defineConfig({
 *   features,
 *   plans: [
 *     definePlan<typeof features>({
 *       id: "pro",
 *       name: "Pro",
 *       price: 2900,
 *       currency: "USD",
 *       interval: "month",
 *       features: {
 *         seats: 5,    // ✅ Autocomplete + type-safe
 *         sso: true,   // ✅
 *         // typo: 1,  // ❌ TypeScript error
 *       },
 *     }),
 *   ],
 * });
 * ```
 */

import type {
  FeatureDef,
  FeatureValue,
  PlanDef,
  AddonDef,
  DiscountDef,
  RevstackConfig,
} from "@/types";

// ─── Feature ─────────────────────────────────────────────────

/**
 * Define a feature with full type inference.
 * Identity function — returns the input as-is.
 */
export function defineFeature<T extends FeatureDef>(config: T): T {
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
 * definePlan<typeof features>({ features: { seats: 5 } });
 *
 * // Loose mode — any string key accepted (backwards compatible):
 * definePlan({ features: { anything: true } });
 * ```
 */
export function definePlan<
  F extends Record<string, FeatureDef> = Record<string, FeatureDef>,
>(
  config: Omit<PlanDef, "features"> & {
    features: F extends Record<string, FeatureDef>
      ? Partial<Record<keyof F, FeatureValue>>
      : Record<string, FeatureValue>;
  }
): PlanDef {
  return config as PlanDef;
}

// ─── Add-on (Typed against feature dictionary) ───────────────

/**
 * Define an Add-on with optional compile-time feature key restriction.
 * Same generic pattern as `definePlan`.
 *
 * @typeParam F - Feature dictionary type for key restriction.
 */
export function defineAddon<
  F extends Record<string, FeatureDef> = Record<string, FeatureDef>,
>(
  config: Omit<AddonDef, "features"> & {
    features: F extends Record<string, FeatureDef>
      ? Partial<Record<keyof F, FeatureValue>>
      : Record<string, FeatureValue>;
  }
): AddonDef {
  return config as AddonDef;
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
 *
 * @example
 * ```typescript
 * export default defineConfig({
 *   features: { ... },
 *   plans: [ ... ],
 *   addons: [ ... ],
 *   coupons: [ ... ],
 * });
 * ```
 */
export function defineConfig<T extends RevstackConfig>(config: T): T {
  return config;
}
