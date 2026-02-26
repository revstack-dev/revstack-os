/**
 * @file validator.ts
 * @description Runtime validation for Revstack billing configurations.
 *
 * Validates the business logic invariants of a `RevstackConfig` object
 * before it is synced to the backend. Catches misconfigurations early
 * that TypeScript's type system cannot enforce (e.g., referencing
 * undefined features, negative prices, duplicate slugs).
 *
 * @example
 * ```typescript
 * import { validateConfig, defineConfig } from "@revstackhq/core";
 *
 * const config = defineConfig({ features: {}, plans: {} });
 * validateConfig(config); // throws RevstackValidationError if invalid
 * ```
 */

import type { RevstackConfig, PlanFeatureValue } from "@/types";

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
  errors: string[]
): void {
  for (const featureSlug of Object.keys(features)) {
    if (!knownFeatureSlugs.has(featureSlug)) {
      errors.push(
        `${productType} "${productSlug}" references undefined feature "${featureSlug}".`
      );
    }
  }
}

// ─── Pricing Validation ──────────────────────────────────────

/**
 * Validates that prices within a plan are non-negative.
 */
function validatePlanPricing(
  planSlug: string,
  prices: Array<{ amount: number }> | undefined,
  features: Record<string, PlanFeatureValue>,
  errors: string[]
): void {
  if (prices) {
    for (const price of prices) {
      if (price.amount < 0) {
        errors.push(
          `Plan "${planSlug}" has a negative price amount (${price.amount}).`
        );
      }
    }
  }

  for (const [featureSlug, value] of Object.entries(features)) {
    if (value.value_limit !== undefined && value.value_limit < 0) {
      errors.push(
        `Plan "${planSlug}" → feature "${featureSlug}" has a negative value_limit (${value.value_limit}).`
      );
    }
  }
}

// ─── Default Plan Validation ─────────────────────────────────

/**
 * Ensures exactly one plan has `is_default: true`.
 */
function validateDefaultPlan(config: RevstackConfig, errors: string[]): void {
  const defaultPlans = Object.entries(config.plans).filter(
    ([, plan]) => plan.is_default
  );

  if (defaultPlans.length === 0) {
    errors.push(
      "No default plan found. Every project must have exactly one plan with is_default: true."
    );
  } else if (defaultPlans.length > 1) {
    const slugs = defaultPlans.map(([slug]) => slug).join(", ");
    errors.push(
      `Multiple default plans found (${slugs}). Only one plan can have is_default: true.`
    );
  }
}

// ─── Discount Validation ─────────────────────────────────────

/**
 * Validates discount-specific business rules.
 */
function validateDiscounts(config: RevstackConfig, errors: string[]): void {
  if (!config.coupons) return;

  for (const coupon of config.coupons) {
    if (coupon.type === "percent" && (coupon.value < 0 || coupon.value > 100)) {
      errors.push(
        `Discount "${coupon.code}" has an invalid percentage value (${coupon.value}). Must be 0–100.`
      );
    }

    if (coupon.type === "amount" && coupon.value < 0) {
      errors.push(
        `Discount "${coupon.code}" has a negative amount value (${coupon.value}).`
      );
    }
  }
}

// ─── Main Validator ──────────────────────────────────────────

/**
 * Validates a complete Revstack billing configuration.
 *
 * Checks the following invariants:
 * 1. **Default plan** — Exactly one plan has `is_default: true`.
 * 2. **Feature references** — Plans/addons only reference features defined in `config.features`.
 * 3. **Non-negative pricing** — All price amounts and limits are ≥ 0.
 * 4. **Discount bounds** — Percentage discounts have values in [0, 100].
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
      errors
    );
    validatePlanPricing(slug, plan.prices, plan.features, errors);
  }

  // ── Add-ons ────────────────────────────────────────────────
  if (config.addons) {
    for (const [slug, addon] of Object.entries(config.addons)) {
      validateFeatureReferences(
        "Addon",
        slug,
        addon.features,
        knownFeatureSlugs,
        errors
      );
    }
  }

  // ── Discounts ──────────────────────────────────────────────
  validateDiscounts(config, errors);

  // ── Throw if any violations were collected ─────────────────
  if (errors.length > 0) {
    throw new RevstackValidationError(errors);
  }
}
