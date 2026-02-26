import { BaseClient } from "@/modules/base";
import {
  Customer,
  IdentifyCustomerParams,
  UpdateCustomerParams,
  ListParams,
  PaginatedResponse,
} from "@/types";

/**
 * Client for managing end-user (customer) records.
 * Provides full CRUD operations on the `app_users` table.
 *
 * @example
 * ```typescript
 * const customer = await revstack.customers.identify({
 *   customerId: "user-123",
 *   email: "john@acme.com",
 * });
 * ```
 */
export class CustomersClient extends BaseClient {
  constructor(config: { secretKey: string; baseUrl: string; timeout: number }) {
    super(config);
  }

  /**
   * Identify (upsert) a customer. Creates the customer if not found,
   * or updates it if a record with the same `customerId` already exists.
   *
   * @param params - Customer identification parameters.
   * @returns The created or updated customer record.
   */
  async identify(params: IdentifyCustomerParams): Promise<Customer> {
    return this.request<Customer>("/customers", {
      method: "POST",
      body: JSON.stringify(params),
    });
  }

  /**
   * Retrieve a customer by ID.
   *
   * @param customerId - The customer's unique identifier.
   * @returns The customer record.
   */
  async get(customerId: string): Promise<Customer> {
    return this.request<Customer>(`/customers/${customerId}`, {
      method: "GET",
    });
  }

  /**
   * List customers with optional pagination.
   *
   * @param params - Pagination parameters (limit, offset).
   * @returns A paginated list of customer records.
   */
  async list(params?: ListParams): Promise<PaginatedResponse<Customer>> {
    return this.request<PaginatedResponse<Customer>>(
      `/customers${this.buildQuery(params)}`,
      { method: "GET" },
    );
  }

  /**
   * Update an existing customer's profile.
   *
   * @param customerId - The customer's unique identifier.
   * @param params - Fields to update (email, metadata).
   * @returns The updated customer record.
   */
  async update(
    customerId: string,
    params: UpdateCustomerParams,
  ): Promise<Customer> {
    return this.request<Customer>(`/customers/${customerId}`, {
      method: "PATCH",
      body: JSON.stringify(params),
    });
  }

  /**
   * Delete a customer and all associated data.
   *
   * @param customerId - The customer's unique identifier.
   * @returns Confirmation of deletion.
   */
  async delete(customerId: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/customers/${customerId}`, {
      method: "DELETE",
    });
  }
}
