import type { RevstackConfig, PlanFeatureValue, PriceDef } from "@/types";

// ─── Error Class ─────────────────────────────────────────────

/**
 * Thrown when `validateConfig()` detects one or more invalid business
 * logic rules in a billing configuration.
 *
 * The `errors` array contains all violations found — the validator
 * collects every issue before throwing, so developers can fix them
 * all at once instead of playing whack-a-mole.
 */
export class RevstackValidationError extends Error {
  /** All validation violations found in the config. */
  public readonly errors: string[];

  constructor(errors: string[]) {
    const summary =
      errors.length === 1
        ? `Revstack config validation failed: ${errors[0]}`
        : `Revstack config validation failed with ${errors.length} errors:\n  - ${errors.join("\n  - ")}`;

    super(summary);
    this.name = "RevstackValidationError";
    this.errors = errors;
  }
}

// ─── Feature Reference Validation ────────────────────────────

/**
 * Collects errors for feature keys in a product that don't exist
 * in the root feature dictionary.
 */
function validateFeatureReferences(
  productType: string,
  productSlug: string,
  features: Record<string, PlanFeatureValue>,
  knownFeatureSlugs: Set<string>,
  errors: string[],
): void {
  for (const featureSlug of Object.keys(features)) {
    if (!knownFeatureSlugs.has(featureSlug)) {
      errors.push(
        `${productType} "${productSlug}" references undefined feature "${featureSlug}".`,
      );
    }
  }
}

// ─── Pricing Validation ──────────────────────────────────────

/**
 * Ensures addons referenced by a price match the correct billing interval and actually exist.
 */
function validatePriceAddonIntervals(
  planSlug: string,
  priceIndex: number,
  price: PriceDef,
  configAddons: Record<string, import("@/types.js").AddonDefInput> | undefined,
  errors: string[],
): void {
  if (!price.available_addons) return;

  for (const addonSlug of price.available_addons) {
    const addon = configAddons?.[addonSlug];
    if (!addon) {
      errors.push(
        `Plan "${planSlug}" price references undefined addon "${addonSlug}".`,
      );
      continue;
    }

    if (
      addon.type === "recurring" &&
      addon.billing_interval !== price.billing_interval
    ) {
      errors.push(
        `Interval Mismatch: Plan '${planSlug}' price is '${price.billing_interval}', but Addon '${addonSlug}' is '${addon.billing_interval}'. Recurring addons must match the price's billing interval.`,
      );
    }
  }
}

/**
 * Validates overage logic and intervals for plan pricing.
 */
function validatePlanPricing(
  slug: string,
  prices: PriceDef[] | undefined,
  config: RevstackConfig,
  errors: string[],
): void {
  const configFeatures = config.features;
  if (prices) {
    prices.forEach((price, index) => {
      if (price.overage_configuration) {
        for (const featureSlug of Object.keys(price.overage_configuration)) {
          const feature = configFeatures[featureSlug];
          if (!feature) {
            errors.push(
              `Plan "${slug}" overage_configuration references undefined feature "${featureSlug}".`,
            );
          } else if (feature.type !== "metered") {
            errors.push(
              `Plan "${slug}" configures overage for feature "${featureSlug}", which is not of type 'metered'.`,
            );
          }
        }
      }

      validatePriceAddonIntervals(slug, index, price, config.addons, errors);
    });
  }
}

// ─── Default Plan Validation ─────────────────────────────────

// ─── Default Plan Validation ─────────────────────────────────

/**
 * Ensures exactly one plan has `is_default: true`.
 */
function validateDefaultPlan(config: RevstackConfig, errors: string[]): void {
  const defaultPlans = Object.entries(config.plans).filter(
    ([, plan]) => plan.is_default,
  );

  if (defaultPlans.length === 0) {
    errors.push(
      "No default plan found. Every project must have exactly one plan with is_default: true.",
    );
  } else if (defaultPlans.length > 1) {
    const slugs = defaultPlans.map(([slug]) => slug).join(", ");
    errors.push(
      `Multiple default plans found (${slugs}). Only one plan can have is_default: true.`,
    );
  }
}

// ─── Main Validator ──────────────────────────────────────────

/**
 * Validates a complete Revstack billing configuration.
 *
 * Checks the following invariants:
 * 1. **Default plan** — Exactly one plan has `is_default: true`.
 * 2. **Feature references** — Plans/addons only reference features defined in `config.features`.
 *
 * @param config - The billing configuration to validate.
 * @throws {RevstackValidationError} If any violations are found.
 */
export function validateConfig(config: RevstackConfig): void {
  const errors: string[] = [];
  const knownFeatureSlugs = new Set(Object.keys(config.features));

  // ── Default Plan ───────────────────────────────────────────
  validateDefaultPlan(config, errors);

  // ── Plans ──────────────────────────────────────────────────
  for (const [slug, plan] of Object.entries(config.plans)) {
    validateFeatureReferences(
      "Plan",
      slug,
      plan.features,
      knownFeatureSlugs,
      errors,
    );
    validatePlanPricing(slug, plan.prices, config, errors);
  }

  // ── Add-ons ────────────────────────────────────────────────
  if (config.addons) {
    for (const [slug, addon] of Object.entries(config.addons)) {
      validateFeatureReferences(
        "Addon",
        slug,
        addon.features as Record<string, PlanFeatureValue>,
        knownFeatureSlugs,
        errors,
      );
    }
  }

  // ── Throw if any violations were collected ─────────────────
  if (errors.length > 0) {
    throw new RevstackValidationError(errors);
  }
}
