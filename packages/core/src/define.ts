import type {
  FeatureDefInput,
  PlanDefInput,
  PlanFeatureValue,
  AddonFeatureValue,
  AddonDefInput,
  PriceDef,
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
  config: Omit<PlanDefInput, "features" | "prices"> & {
    features: F extends Record<string, FeatureDefInput>
      ? Partial<Record<keyof F, PlanFeatureValue>>
      : Record<string, PlanFeatureValue>;
    prices?: Array<
      Omit<PriceDef, "overage_configuration"> & {
        overage_configuration?: F extends Record<string, FeatureDefInput>
          ? Partial<
              Record<keyof F, { overage_amount: number; overage_unit: number }>
            >
          : Record<string, { overage_amount: number; overage_unit: number }>;
      }
    >;
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
