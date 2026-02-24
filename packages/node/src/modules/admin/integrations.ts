import { BaseClient } from "@/modules/base";
import {
  Integration,
  CreateIntegrationParams,
  UpdateIntegrationParams,
  ListIntegrationsParams,
  ProviderEvent,
  ListProviderEventsParams,
  IntegrationMetric,
  ListMetricsParams,
  PaginatedResponse,
} from "@/types";

/**
 * Admin client for managing payment provider integrations.
 * Supports CRUD operations on integrations (e.g. Stripe, Paddle) and
 * read access to their webhook events and hourly metrics.
 *
 * @example
 * ```typescript
 * // Create a Stripe integration
 * await revstack.admin.integrations.create({
 *   provider: "stripe",
 *   credentials: { apiKey: "sk_live_..." },
 *   webhookSecret: "whsec_...",
 * });
 *
 * // View recent webhook events
 * const { data: events } = await revstack.admin.integrations.listEvents("int_abc");
 * ```
 */
export class AdminIntegrationsClient extends BaseClient {
  /**
   * List all integrations with optional filters.
   *
   * @param params - Filter and pagination parameters.
   * @returns A paginated list of integrations.
   */
  async list(
    params?: ListIntegrationsParams
  ): Promise<PaginatedResponse<Integration>> {
    return this.request<PaginatedResponse<Integration>>(
      `/admin/integrations${this.buildQuery(params)}`,
      { method: "GET" }
    );
  }

  /**
   * Retrieve a single integration by ID.
   *
   * @param integrationId - The integration's unique identifier.
   * @returns The integration record.
   */
  async get(integrationId: string): Promise<Integration> {
    return this.request<Integration>(`/admin/integrations/${integrationId}`, {
      method: "GET",
    });
  }

  /**
   * Create a new payment provider integration.
   *
   * @param params - Integration creation parameters.
   * @returns The newly created integration.
   */
  async create(params: CreateIntegrationParams): Promise<Integration> {
    return this.request<Integration>("/admin/integrations", {
      method: "POST",
      body: JSON.stringify(params),
    });
  }

  /**
   * Update an existing integration's credentials, webhook secret, or active status.
   *
   * @param integrationId - The integration's unique identifier.
   * @param params - Fields to update.
   * @returns The updated integration.
   */
  async update(
    integrationId: string,
    params: UpdateIntegrationParams
  ): Promise<Integration> {
    return this.request<Integration>(`/admin/integrations/${integrationId}`, {
      method: "PATCH",
      body: JSON.stringify(params),
    });
  }

  /**
   * Delete an integration. This stops webhook processing for the provider.
   *
   * @param integrationId - The integration's unique identifier.
   * @returns Confirmation of deletion.
   */
  async delete(integrationId: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(
      `/admin/integrations/${integrationId}`,
      { method: "DELETE" }
    );
  }

  /**
   * List webhook events received by an integration.
   * Useful for debugging webhook delivery and processing issues.
   *
   * @param integrationId - The integration to query events for.
   * @param params - Filter and pagination parameters.
   * @returns A paginated list of provider events.
   */
  async listEvents(
    integrationId: string,
    params?: ListProviderEventsParams
  ): Promise<PaginatedResponse<ProviderEvent>> {
    return this.request<PaginatedResponse<ProviderEvent>>(
      `/admin/integrations/${integrationId}/events${this.buildQuery(params)}`,
      { method: "GET" }
    );
  }

  /**
   * List hourly aggregated metrics for an integration.
   * Shows volume processed and event counts per hour.
   *
   * @param integrationId - The integration to query metrics for.
   * @param params - Time range and pagination parameters.
   * @returns A paginated list of hourly metrics.
   */
  async listMetrics(
    integrationId: string,
    params?: ListMetricsParams
  ): Promise<PaginatedResponse<IntegrationMetric>> {
    return this.request<PaginatedResponse<IntegrationMetric>>(
      `/admin/integrations/${integrationId}/metrics${this.buildQuery(params)}`,
      { method: "GET" }
    );
  }
}
