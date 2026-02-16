import { CheckResult, PlanDef, FeatureValue, AddonDef } from "./types";

/**
 * The logic core of Revstack.
 * Determines if a user can access a feature based on their Plan and active Add-ons.
 */
export class EntitlementEngine {
  /**
   * @param plan The user's active Base Plan.
   * @param addons (Optional) List of active add-ons the user has purchased.
   */
  constructor(
    private plan: PlanDef,
    private addons: AddonDef[] = [],
  ) {}

  /**
   * Verifies if the user has access to a specific feature.
   * It aggregates limits from the Base Plan AND any active Add-ons.
   * * @param featureId The ID of the feature to check (e.g., 'seats').
   * @param currentUsage Current usage count (for static/metered features).
   */
  public check(featureId: string, currentUsage: number = 0): CheckResult {
    // 1. Gather all entitlements for this feature (Plan + Add-ons)
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

    // 2. Initialize aggregated values
    let totalLimit = 0;
    let isInfinite = false;
    let hasAccess = false;
    let hardLimit = true; // Default to true unless specified otherwise
    let grantedBy = this.plan.id;

    // Helper to process a feature value
    const processValue = (val: FeatureValue, sourceId: string) => {
      if (val === true) {
        hasAccess = true;
        isInfinite = true; // Boolean true implies unlimited access
        grantedBy = sourceId;
      } else if (typeof val === "number") {
        hasAccess = true;
        totalLimit += val;
        grantedBy = sourceId; // Last source wins for attribution (simplified)
      } else if (typeof val === "object") {
        if (val.included) hasAccess = true;
        if (val.limit !== undefined) totalLimit += val.limit;

        // If ANY source allows soft limits (overage), the whole feature becomes soft.
        if (val.isHardLimit === false) hardLimit = false;

        grantedBy = sourceId;
      }
    };

    // Process Base Plan
    if (planEntitlement) processValue(planEntitlement, this.plan.id);

    // Process Add-ons (Summation Logic)
    for (const item of addonEntitlements) {
      if (item.value === undefined) continue;
      processValue(item.value, item.id);
    }

    // 3. Evaluate Access
    if (!hasAccess) {
      return { allowed: false, reason: "feature_missing" };
    }

    if (isInfinite) {
      return { allowed: true, remaining: Infinity, grantedBy };
    }

    // 4. Evaluate Limits
    if (currentUsage < totalLimit) {
      return {
        allowed: true,
        reason: "included",
        remaining: totalLimit - currentUsage,
        grantedBy,
      };
    } else {
      // Limit reached. Check if we allow overage.
      if (!hardLimit) {
        // Calculate estimated cost if unitPrice is defined in the base plan
        // (Simplified: Overage usually follows base plan pricing rules)
        let estimatedCost = 0;
        if (
          typeof planEntitlement === "object" &&
          "unitPrice" in planEntitlement &&
          planEntitlement.unitPrice
        ) {
          estimatedCost =
            (currentUsage - totalLimit + 1) * planEntitlement.unitPrice;
        }

        return {
          allowed: true,
          reason: "overage_allowed",
          remaining: 0,
          costEstimate: estimatedCost,
        };
      }

      return { allowed: false, reason: "limit_reached", remaining: 0 };
    }
  }
}
