import { BaseClient } from "@/modules/base";
import {
  Entitlement,
  CreateEntitlementParams,
  UpdateEntitlementParams,
  UpsertEntitlementParams,
  ListParams,
  PaginatedResponse,
} from "@/types";

/**
 * Admin client for managing entitlement definitions (CRUD + upsert).
 * Entitlements define the features and capabilities that can be gated behind plans.
 *
 * The `upsert()` method is idempotent by `slug`, making it safe for repeated
 * CLI deployments without creating duplicates.
 *
 * @example
 * ```typescript
 * await revstack.admin.entitlements.upsert({
 *   slug: "api-calls",
 *   name: "API Calls",
 *   type: "metered",
 *   unitType: "count",
 * });
 * ```
 */
export class AdminEntitlementsClient extends BaseClient {
  constructor(config: { secretKey: string; baseUrl: string; timeout: number }) {
    super(config);
  }

  /**
   * List all entitlement definitions with optional pagination.
   *
   * @param params - Pagination parameters.
   * @returns A paginated list of entitlements.
   */
  async list(params?: ListParams): Promise<PaginatedResponse<Entitlement>> {
    return this.request<PaginatedResponse<Entitlement>>(
      `/admin/entitlements${this.buildQuery(params)}`,
      { method: "GET" },
    );
  }

  /**
   * Retrieve a single entitlement definition by ID.
   *
   * @param entitlementId - The entitlement's unique identifier.
   * @returns The entitlement definition.
   */
  async get(entitlementId: string): Promise<Entitlement> {
    return this.request<Entitlement>(`/admin/entitlements/${entitlementId}`, {
      method: "GET",
    });
  }

  /**
   * Create a new entitlement definition.
   *
   * @param params - Entitlement creation parameters.
   * @returns The newly created entitlement.
   */
  async create(params: CreateEntitlementParams): Promise<Entitlement> {
    return this.request<Entitlement>("/admin/entitlements", {
      method: "POST",
      body: JSON.stringify(params),
    });
  }

  /**
   * Partially update an existing entitlement definition.
   *
   * @param entitlementId - The entitlement's unique identifier.
   * @param params - Fields to update.
   * @returns The updated entitlement.
   */
  async update(
    entitlementId: string,
    params: UpdateEntitlementParams,
  ): Promise<Entitlement> {
    return this.request<Entitlement>(`/admin/entitlements/${entitlementId}`, {
      method: "PATCH",
      body: JSON.stringify(params),
    });
  }

  /**
   * Delete an entitlement definition. Fails if any active plans reference it.
   *
   * @param entitlementId - The entitlement's unique identifier.
   * @returns Confirmation of deletion.
   */
  async delete(entitlementId: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(
      `/admin/entitlements/${entitlementId}`,
      { method: "DELETE" },
    );
  }

  /**
   * Idempotently create or update an entitlement by its `slug`.
   * If an entitlement with the given slug exists, it is updated; otherwise, it is created.
   *
   * @param params - Full entitlement state.
   * @returns The created or updated entitlement.
   */
  async upsert(params: UpsertEntitlementParams): Promise<Entitlement> {
    return this.request<Entitlement>("/admin/entitlements", {
      method: "PUT",
      body: JSON.stringify(params),
    });
  }
}
