import { BaseClient } from "@/modules/base";
import { ReportUsageParams, RevertUsageParams, UsageMeter } from "@/types";

/**
 * Client for reporting and querying metered feature usage.
 * Works in conjunction with {@link EntitlementsClient} — report usage after
 * a successful entitlement check, and revert it if downstream operations fail.
 *
 * @example
 * ```typescript
 * // Optimistic usage pattern for AI applications
 * const { allowed } = await revstack.entitlements.check(userId, "ai-tokens", { amount: 500 });
 * if (!allowed) throw new Error("Limit exceeded");
 *
 * await revstack.usage.report({ customerId: userId, featureId: "ai-tokens", amount: 500 });
 * try {
 *   await openai.chat.completions.create({ ... });
 * } catch {
 *   await revstack.usage.revert({ customerId: userId, featureId: "ai-tokens", amount: 500 });
 * }
 * ```
 */
export class UsageClient extends BaseClient {
  constructor(config: { secretKey: string; baseUrl: string; timeout: number }) {
    super(config);
  }

  /**
   * Report usage of a metered feature. Increments the customer's usage meter.
   *
   * @param params - Usage report parameters.
   * @returns Confirmation of the reported usage.
   */
  async report(params: ReportUsageParams): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>("/usage/report", {
      method: "POST",
      idempotencyKey: params.idempotencyKey,
      body: JSON.stringify({
        customerId: params.customerId,
        featureId: params.featureId,
        amount: params.amount,
      }),
    });
  }

  /**
   * Retrieve all usage meters for a customer (one per metered entitlement).
   *
   * @param customerId - The customer whose meters to retrieve.
   * @returns Array of usage meters with current counts and reset times.
   */
  async getMeters(customerId: string): Promise<UsageMeter[]> {
    return this.request<UsageMeter[]>(`/usage/meters/${customerId}`, {
      method: "GET",
    });
  }

  /**
   * Retrieve a single usage meter for a specific customer and feature.
   *
   * @param customerId - The customer whose meter to retrieve.
   * @param featureId - The entitlement slug or ID.
   * @returns The usage meter with current count and reset time.
   */
  async getMeter(customerId: string, featureId: string): Promise<UsageMeter> {
    return this.request<UsageMeter>(
      `/usage/meters/${customerId}/${featureId}`,
      { method: "GET" },
    );
  }

  /**
   * Revert (roll back) previously reported usage. Decrements the customer's
   * usage meter. Essential for maintaining accurate billing when downstream
   * operations fail after usage was already recorded.
   *
   * @param params - Revert parameters including reason for audit trail.
   * @returns Confirmation of the reverted usage.
   */
  async revert(params: RevertUsageParams): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>("/usage/revert", {
      method: "POST",
      idempotencyKey: params.idempotencyKey,
      body: JSON.stringify({
        customerId: params.customerId,
        featureId: params.featureId,
        amount: params.amount,
        reason: params.reason,
      }),
    });
  }
}
