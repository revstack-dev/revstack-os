import { BaseClient } from "@/modules/base";
import { Plan, ListPlansParams, PaginatedResponse } from "@/types";

/**
 * Read-only client for querying billing plans.
 * Used by the merchant's frontend to render pricing pages and plan selectors.
 * Plan mutations are handled via `revstack.admin.plans`.
 *
 * @example
 * ```typescript
 * // Fetch all public plans for the pricing page
 * const { data: plans } = await revstack.plans.list({ status: "active" });
 *
 * // Get a specific plan with prices and entitlements
 * const proPlan = await revstack.plans.get("plan_pro");
 * console.log(proPlan.prices);       // billing intervals
 * console.log(proPlan.entitlements);  // feature allocations
 * ```
 */
export class PlansClient extends BaseClient {
  constructor(config: { secretKey: string; baseUrl: string; timeout: number }) {
    super(config);
  }

  /**
   * List plans with optional filters.
   *
   * @param params - Filter and pagination parameters.
   * @returns A paginated list of plans.
   */
  async list(params?: ListPlansParams): Promise<PaginatedResponse<Plan>> {
    return this.request<PaginatedResponse<Plan>>(
      `/plans${this.buildQuery(params)}`,
      { method: "GET" },
    );
  }

  /**
   * Retrieve a single plan by ID, including its nested prices and entitlements.
   *
   * @param planId - The plan's unique identifier.
   * @returns The plan with populated `prices[]` and `entitlements[]`.
   */
  async get(planId: string): Promise<Plan> {
    return this.request<Plan>(`/plans/${planId}`, {
      method: "GET",
    });
  }
}
