/**
 * @file validator.ts
 * @description Runtime validation for Revstack billing configurations.
 *
 * Validates the business logic invariants of a `RevstackConfig` object
 * before it is synced to the backend. Catches misconfigurations early
 * that TypeScript's type system cannot enforce (e.g., referencing
 * undefined features, negative prices, duplicate IDs).
 *
 * @example
 * ```typescript
 * import { validateConfig, defineConfig } from "@revstackhq/core";
 *
 * const config = defineConfig({ features: {}, plans: [] });
 * validateConfig(config); // throws RevstackValidationError if invalid
 * ```
 */

import type { RevstackConfig, FeatureValue } from "@/types";

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
  productId: string,
  features: Record<string, FeatureValue>,
  knownFeatureIds: Set<string>,
  errors: string[]
): void {
  for (const featureId of Object.keys(features)) {
    if (!knownFeatureIds.has(featureId)) {
      errors.push(
        `${productType} "${productId}" references undefined feature "${featureId}".`
      );
    }
  }
}

/**
 * Validates that all prices and limits within a product's features
 * are non-negative, and that the product's base price is non-negative.
 */
function validateProductPricing(
  productType: string,
  productId: string,
  basePrice: number,
  features: Record<string, FeatureValue>,
  errors: string[]
): void {
  // Base price must be non-negative
  if (basePrice < 0) {
    errors.push(
      `${productType} "${productId}" has a negative base price (${basePrice}).`
    );
  }

  // Validate each feature's numeric fields
  for (const [featureId, value] of Object.entries(features)) {
    if (typeof value === "object" && value !== null) {
      if (value.limit !== undefined && value.limit < 0) {
        errors.push(
          `${productType} "${productId}" → feature "${featureId}" has a negative limit (${value.limit}).`
        );
      }
      if (value.unitPrice !== undefined && value.unitPrice < 0) {
        errors.push(
          `${productType} "${productId}" → feature "${featureId}" has a negative unitPrice (${value.unitPrice}).`
        );
      }
    }
  }
}

// ─── Duplicate ID Detection ─────────────────────────────────

/**
 * Detects duplicate IDs within an array of items.
 * Returns a set of IDs that appear more than once.
 */
function findDuplicateIds(
  items: Array<{ id: string }>,
  label: string,
  errors: string[]
): void {
  const seen = new Set<string>();

  for (const item of items) {
    if (seen.has(item.id)) {
      errors.push(`Duplicate ${label} ID: "${item.id}".`);
    }
    seen.add(item.id);
  }
}

// ─── Discount Validation ─────────────────────────────────────

/**
 * Validates discount-specific business rules:
 * - Percentage discounts must have value in [0, 100].
 * - Amount discounts must be non-negative.
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
 * 1. **Feature references** — Plans/addons only reference features defined in `config.features`.
 * 2. **Non-negative pricing** — All `price`, `unitPrice` values are ≥ 0.
 * 3. **Non-negative limits** — All `limit` values are ≥ 0.
 * 4. **Unique IDs** — No duplicate plan IDs or addon IDs.
 * 5. **Discount bounds** — Percentage discounts have values in [0, 100].
 *
 * @param config - The billing configuration to validate.
 * @throws {RevstackValidationError} If any violations are found.
 */
export function validateConfig(config: RevstackConfig): void {
  const errors: string[] = [];
  const knownFeatureIds = new Set(Object.keys(config.features));

  // ── Plans ──────────────────────────────────────────────────
  findDuplicateIds(config.plans, "Plan", errors);

  for (const plan of config.plans) {
    validateFeatureReferences(
      "Plan",
      plan.id,
      plan.features,
      knownFeatureIds,
      errors
    );
    validateProductPricing("Plan", plan.id, plan.price, plan.features, errors);
  }

  // ── Add-ons ────────────────────────────────────────────────
  if (config.addons) {
    findDuplicateIds(config.addons, "Addon", errors);

    for (const addon of config.addons) {
      validateFeatureReferences(
        "Addon",
        addon.id,
        addon.features,
        knownFeatureIds,
        errors
      );
      validateProductPricing(
        "Addon",
        addon.id,
        addon.price,
        addon.features,
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
