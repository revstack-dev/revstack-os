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
  AddonDef,
  SubscriptionStatus,
} from "@/types.js";

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
 * - If ANY source sets `is_hard_limit: false`, the entire feature becomes soft-limited.
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
    private subscriptionStatus: SubscriptionStatus = "active",
  ) {}

  /**
   * Verify if the customer has access to a specific feature.
   *
   * Aggregates limits from the base plan AND any active add-ons,
   * then evaluates the customer's current usage against those limits.
   *
   * @param featureId - The feature slug to check (e.g., `"seats"`).
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
      .map((addon) => ({ slug: addon.slug, value: addon.features[featureId] }))
      .filter((item) => item.value !== undefined);

    // If neither plan nor add-ons have this feature
    if (planEntitlement === undefined && addonEntitlements.length === 0) {
      return { allowed: false, reason: "feature_missing" };
    }

    // ── 2. Aggregate values across all sources ───────────────
    let totalLimit = 0;
    let isInfinite = false;
    let hasAccess = false;
    let hardLimit = true;
    let grantedBy: string[] = [];

    // Process base plan first
    if (planEntitlement) {
      if (planEntitlement.value_bool === true) {
        hasAccess = true;
        isInfinite = true;
        grantedBy = [this.plan.slug];
      }
      if (planEntitlement.value_limit !== undefined) {
        hasAccess = true;
        totalLimit += planEntitlement.value_limit;
        grantedBy = [this.plan.slug];
      }
      if (planEntitlement.is_hard_limit === false) {
        hardLimit = false;
      }
    }

    // Sort add-ons deterministically: process "set" overrides before "increment" additions
    const sortedAddons = [...addonEntitlements].sort((a, b) => {
      const typeA = a.value?.type === "set" ? 0 : 1;
      const typeB = b.value?.type === "set" ? 0 : 1;
      return typeA - typeB;
    });

    // Process add-ons sequentially
    for (const item of sortedAddons) {
      const val = item.value;
      if (val === undefined) continue;

      if (val.has_access === true) {
        hasAccess = true;
        isInfinite = true;
        // If it's a new access grant not yet tracked, or if it overwrites the boolean, we can just track the addon slug.
        // For boolean features, usually the first true wins, but we track all sources.
        if (!grantedBy.includes(item.slug)) {
          grantedBy.push(item.slug);
        }
      }

      if (val.value_limit !== undefined) {
        hasAccess = true;
        if (val.type === "set") {
          // 'set' completely overrides the previous limit and replaces the granting sources
          totalLimit = val.value_limit;
          grantedBy = [item.slug];
        } else {
          // 'increment' adds to the limit and appends to the sources
          totalLimit += val.value_limit;
          if (!grantedBy.includes(item.slug)) {
            grantedBy.push(item.slug);
          }
        }
      }

      // Check if this add-on relaxes the limit to a soft limit
      if (val.is_hard_limit === false) {
        hardLimit = false;
      }
    }

    // ── 3. Evaluate access ───────────────────────────────────
    if (!hasAccess) {
      return { allowed: false, reason: "feature_missing" };
    }

    if (isInfinite) {
      return { allowed: true, remaining: Infinity, granted_by: grantedBy };
    }

    // ── 4. Evaluate limits ───────────────────────────────────
    if (currentUsage < totalLimit) {
      return {
        allowed: true,
        reason: "included",
        remaining: totalLimit - currentUsage,
        granted_by: grantedBy,
      };
    }

    // Limit reached — check if overage is allowed
    // Note: The Engine only determines "if" overage is permitted.
    // The "how much it costs" is configured in `PriceDef.overage_configuration`
    // and handled by the Cloud API / billing providers.
    if (!hardLimit) {
      return {
        allowed: true,
        reason: "overage_allowed",
        remaining: 0,
        granted_by: grantedBy,
      };
    }

    return {
      allowed: false,
      reason: "limit_reached",
      remaining: 0,
      granted_by: grantedBy,
    };
  }

  /**
   * Evaluate multiple features in a single pass.
   *
   * @param usages - Map of `featureSlug → currentUsage` to evaluate.
   * @returns Map of `featureSlug → CheckResult`.
   */
  public checkBatch(
    usages: Record<string, number>,
  ): Record<string, CheckResult> {
    const results: Record<string, CheckResult> = {};

    for (const [featureId, usage] of Object.entries(usages)) {
      results[featureId] = this.check(featureId, usage);
    }

    return results;
  }
}
