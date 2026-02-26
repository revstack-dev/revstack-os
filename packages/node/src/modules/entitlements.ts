import { BaseClient } from "@/modules/base";
import {
  Entitlement,
  EntitlementCheckOptions,
  EntitlementCheckResult,
} from "@/types";

/**
 * Client for checking and querying feature entitlements.
 * The `check()` method is the core primitive of the SDK — it determines whether
 * a customer is allowed to use a specific feature based on their plan.
 *
 * @example
 * ```typescript
 * const { allowed, reason } = await revstack.entitlements.check(
 *   "usr_abc",
 *   "api-calls",
 *   { amount: 10 }
 * );
 *
 * if (!allowed) {
 *   throw new Error(`Access denied: ${reason}`);
 * }
 * ```
 */
export class EntitlementsClient extends BaseClient {
  constructor(config: { secretKey: string; baseUrl: string; timeout: number }) {
    super(config);
  }

  /**
   * Check whether a customer has access to a specific feature.
   * This is the most critical method in the SDK — it evaluates the customer's
   * plan, metered usage, and custom entitlement overrides.
   *
   * @param customerId - The customer to check.
   * @param featureId - The entitlement slug or ID.
   * @param options - Optional check parameters (e.g. requested amount).
   * @returns The check result with `allowed`, `reason`, and `remainingBalance`.
   */
  async check(
    customerId: string,
    featureId: string,
    options?: EntitlementCheckOptions,
  ): Promise<EntitlementCheckResult> {
    return this.request<EntitlementCheckResult>("/entitlements/check", {
      method: "POST",
      body: JSON.stringify({
        customerId,
        featureId,
        requestedAmount: options?.amount || 1,
      }),
    });
  }

  /**
   * List all active entitlements for a customer, including limits from
   * their plan and any custom overrides.
   *
   * @param customerId - The customer whose entitlements to list.
   * @returns Array of entitlement definitions the customer has access to.
   */
  async list(customerId: string): Promise<Entitlement[]> {
    return this.request<Entitlement[]>(`/entitlements/customer/${customerId}`, {
      method: "GET",
    });
  }

  /**
   * Retrieve a single entitlement definition by ID.
   *
   * @param entitlementId - The entitlement's unique identifier.
   * @returns The entitlement definition.
   */
  async get(entitlementId: string): Promise<Entitlement> {
    return this.request<Entitlement>(`/entitlements/${entitlementId}`, {
      method: "GET",
    });
  }
}
