/**
 * @file engine.ts
 * @description The Entitlement Engine — the logic core of Revstack.
 *
 * Determines if a user can access a feature based on their active Plan,
 * purchased Add-ons, and subscription payment status. All decisions are
 * pure, stateless computations with no side effects.
 *
 * @example
 * ```typescript
 * import { EntitlementEngine } from "@revstackhq/core";
 *
 * const engine = new EntitlementEngine(plan, addons, "active");
 *
 * // Single check
 * const result = engine.check("seats", 4);
 *
 * // Batch check
 * const results = engine.checkBatch({ seats: 4, ai_tokens: 12000 });
 * ```
 */

import type {
  CheckResult,
  PlanDef,
  FeatureValue,
  FeatureEntitlement,
  AddonDef,
  SubscriptionStatus,
} from "./types";

// ─── Constants ───────────────────────────────────────────────

/**
 * Subscription statuses that block all feature access.
 * Customers in these states must resolve their billing before
 * the engine grants any entitlements.
 */
const BLOCKED_STATUSES: ReadonlySet<SubscriptionStatus> = new Set([
  "past_due",
  "canceled",
]);

/** Immutable result returned for all checks when the subscription is blocked. */
const BLOCKED_RESULT: Readonly<CheckResult> = Object.freeze({
  allowed: false,
  reason: "past_due" as const,
  remaining: 0,
});

// ─── Engine ──────────────────────────────────────────────────

/**
 * The Entitlement Engine — evaluates feature access for a single customer.
 *
 * Instantiate with the customer's active plan, purchased add-ons, and
 * current subscription status. Then call `check()` or `checkBatch()`
 * to evaluate access.
 *
 * **Design decisions:**
 * - Stateless: no mutation, no side effects. Safe to call from any context.
 * - Add-on limits are *summed* with the base plan (e.g., plan gives 5 seats +
 *   addon gives 3 = 8 total).
 * - If ANY source sets `isHardLimit: false`, the entire feature becomes soft-limited.
 * - Overage cost uses the **highest** `unitPrice` found across plan + addons
 *   (conservative billing — always bills at the most expensive rate).
 */
export class EntitlementEngine {
  /**
   * @param plan - The customer's active base plan.
   * @param addons - Active add-ons the customer has purchased.
   * @param subscriptionStatus - Current payment/lifecycle state of the subscription.
   */
  constructor(
    private plan: PlanDef,
    private addons: AddonDef[] = [],
    private subscriptionStatus: SubscriptionStatus = "active"
  ) {}

  /**
   * Verify if the customer has access to a specific feature.
   *
   * Aggregates limits from the base plan AND any active add-ons,
   * then evaluates the customer's current usage against those limits.
   *
   * @param featureId - The feature to check (e.g., `"seats"`).
   * @param currentUsage - Current consumption count (default: 0).
   * @returns A `CheckResult` with the access decision and metadata.
   */
  public check(featureId: string, currentUsage: number = 0): CheckResult {
    // ── Gate: subscription status ────────────────────────────
    if (BLOCKED_STATUSES.has(this.subscriptionStatus)) {
      return BLOCKED_RESULT;
    }

    // ── 1. Gather entitlements from all sources ──────────────
    const planEntitlement = this.plan.features[featureId];
    const addonEntitlements = this.addons
      .map((addon) => ({ id: addon.id, value: addon.features[featureId] }))
      .filter((item) => item.value !== undefined);

    // If neither plan nor add-ons have this feature
    if (
      (planEntitlement === undefined || planEntitlement === false) &&
      addonEntitlements.length === 0
    ) {
      return { allowed: false, reason: "feature_missing" };
    }

    // ── 2. Aggregate values across all sources ───────────────
    let totalLimit = 0;
    let isInfinite = false;
    let hasAccess = false;
    let hardLimit = true;
    let grantedBy = this.plan.id;
    let highestUnitPrice = 0; // Track highest unitPrice across all sources

    const processValue = (val: FeatureValue, sourceId: string): void => {
      if (val === true) {
        // Boolean `true` → unlimited access
        hasAccess = true;
        isInfinite = true;
        grantedBy = sourceId;
      } else if (typeof val === "number") {
        // Numeric shorthand → static limit
        hasAccess = true;
        totalLimit += val;
        grantedBy = sourceId;
      } else if (typeof val === "object") {
        // Full FeatureEntitlement object
        if (val.included) hasAccess = true;
        if (val.limit !== undefined) totalLimit += val.limit;

        // If ANY source allows soft limits, the whole feature becomes soft
        if (val.isHardLimit === false) hardLimit = false;

        // Track the highest unit price for overage cost estimation
        if (val.unitPrice !== undefined && val.unitPrice > highestUnitPrice) {
          highestUnitPrice = val.unitPrice;
        }

        grantedBy = sourceId;
      }
    };

    // Process base plan first
    if (planEntitlement) processValue(planEntitlement, this.plan.id);

    // Process add-ons (summation logic — limits stack)
    for (const item of addonEntitlements) {
      if (item.value === undefined) continue;
      processValue(item.value, item.id);
    }

    // ── 3. Evaluate access ───────────────────────────────────
    if (!hasAccess) {
      return { allowed: false, reason: "feature_missing" };
    }

    if (isInfinite) {
      return { allowed: true, remaining: Infinity, grantedBy };
    }

    // ── 4. Evaluate limits ───────────────────────────────────
    if (currentUsage < totalLimit) {
      return {
        allowed: true,
        reason: "included",
        remaining: totalLimit - currentUsage,
        grantedBy,
      };
    }

    // Limit reached — check if overage is allowed
    if (!hardLimit) {
      const overageUnits = currentUsage - totalLimit + 1;
      const estimatedCost =
        highestUnitPrice > 0 ? overageUnits * highestUnitPrice : 0;

      return {
        allowed: true,
        reason: "overage_allowed",
        remaining: 0,
        costEstimate: estimatedCost,
      };
    }

    return { allowed: false, reason: "limit_reached", remaining: 0 };
  }

  /**
   * Evaluate multiple features in a single pass.
   *
   * Useful for dashboards, pre-flight checks, and "can the user do all of
   * these things?" gates. Iterates through the provided usage map and
   * returns a corresponding map of `CheckResult` objects.
   *
   * @param usages - Map of `featureId → currentUsage` to evaluate.
   * @returns Map of `featureId → CheckResult`.
   *
   * @example
   * ```typescript
   * const results = engine.checkBatch({
   *   seats: 4,
   *   ai_tokens: 12000,
   *   sso: 0,
   * });
   *
   * if (!results.seats.allowed) {
   *   console.log("Seat limit reached");
   * }
   * ```
   */
  public checkBatch(
    usages: Record<string, number>
  ): Record<string, CheckResult> {
    const results: Record<string, CheckResult> = {};

    for (const [featureId, usage] of Object.entries(usages)) {
      results[featureId] = this.check(featureId, usage);
    }

    return results;
  }
}
