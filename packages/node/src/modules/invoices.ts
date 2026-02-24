import { BaseClient } from "@/modules/base";
import { Invoice, ListInvoicesParams, PaginatedResponse } from "@/types";

/**
 * Read-only client for querying billing invoices.
 * Used to display billing history to end users. Invoice creation is handled
 * automatically by the payment pipeline and is not accessible from the SDK.
 *
 * @example
 * ```typescript
 * // List invoices for a customer's billing history page
 * const { data: invoices } = await revstack.invoices.list({
 *   customerId: "usr_abc",
 *   status: "paid",
 * });
 * ```
 */
export class InvoicesClient extends BaseClient {
  /**
   * List invoices with optional filters.
   *
   * @param params - Filter and pagination parameters.
   * @returns A paginated list of invoices.
   */
  async list(params?: ListInvoicesParams): Promise<PaginatedResponse<Invoice>> {
    return this.request<PaginatedResponse<Invoice>>(
      `/invoices${this.buildQuery(params)}`,
      { method: "GET" }
    );
  }

  /**
   * Retrieve a single invoice by ID.
   *
   * @param invoiceId - The invoice's unique identifier.
   * @returns The invoice record.
   */
  async get(invoiceId: string): Promise<Invoice> {
    return this.request<Invoice>(`/invoices/${invoiceId}`, {
      method: "GET",
    });
  }
}
