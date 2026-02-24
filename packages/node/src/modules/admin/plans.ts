import { BaseClient } from "@/modules/base";
import {
  Plan,
  CreatePlanParams,
  UpdatePlanParams,
  UpsertPlanParams,
  ListPlansParams,
  PaginatedResponse,
} from "@/types";

/**
 * Admin client for managing billing plans (CRUD + upsert).
 * Used by the CLI (`npx revstack push`) and advanced integrations.
 *
 * The `upsert()` method is the primary primitive for Billing as Code —
 * it creates or updates a plan by its `slug`, making deployments idempotent.
 *
 * @example
 * ```typescript
 * await revstack.admin.plans.upsert({
 *   slug: "pro",
 *   name: "Pro",
 *   status: "active",
 *   prices: [{ amount: 4900, currency: "USD", billingInterval: "month" }],
 *   entitlements: [{ entitlementSlug: "api-calls", valueLimit: 10000 }],
 * });
 * ```
 */
export class AdminPlansClient extends BaseClient {
  /**
   * List all plans with optional filters.
   *
   * @param params - Filter and pagination parameters.
   * @returns A paginated list of plans.
   */
  async list(params?: ListPlansParams): Promise<PaginatedResponse<Plan>> {
    return this.request<PaginatedResponse<Plan>>(
      `/admin/plans${this.buildQuery(params)}`,
      { method: "GET" }
    );
  }

  /**
   * Retrieve a plan by ID, including nested prices and entitlements.
   *
   * @param planId - The plan's unique identifier.
   * @returns The plan with populated `prices[]` and `entitlements[]`.
   */
  async get(planId: string): Promise<Plan> {
    return this.request<Plan>(`/admin/plans/${planId}`, {
      method: "GET",
    });
  }

  /**
   * Create a new billing plan with optional prices and entitlements.
   *
   * @param params - Plan creation parameters.
   * @returns The newly created plan.
   */
  async create(params: CreatePlanParams): Promise<Plan> {
    return this.request<Plan>("/admin/plans", {
      method: "POST",
      body: JSON.stringify(params),
    });
  }

  /**
   * Partially update an existing plan's attributes.
   * Does not modify prices or entitlements — use `upsert()` for that.
   *
   * @param planId - The plan's unique identifier.
   * @param params - Fields to update.
   * @returns The updated plan.
   */
  async update(planId: string, params: UpdatePlanParams): Promise<Plan> {
    return this.request<Plan>(`/admin/plans/${planId}`, {
      method: "PATCH",
      body: JSON.stringify(params),
    });
  }

  /**
   * Delete a plan. Fails if the plan has active subscriptions.
   *
   * @param planId - The plan's unique identifier.
   * @returns Confirmation of deletion.
   */
  async delete(planId: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/admin/plans/${planId}`, {
      method: "DELETE",
    });
  }

  /**
   * Idempotently create or update a plan by its `slug`.
   * This is the primary method used by the CLI for Billing as Code deployments.
   * If a plan with the given slug exists, it is updated; otherwise, it is created.
   * Nested prices and entitlements are replaced atomically.
   *
   * @param params - Full plan state including prices and entitlements.
   * @returns The created or updated plan.
   */
  async upsert(params: UpsertPlanParams): Promise<Plan> {
    return this.request<Plan>("/admin/plans", {
      method: "PUT",
      body: JSON.stringify(params),
    });
  }
}
