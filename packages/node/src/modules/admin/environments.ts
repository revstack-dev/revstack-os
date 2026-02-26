import { BaseClient } from "@/modules/base";
import {
  Environment,
  CreateEnvironmentParams,
  UpdateEnvironmentParams,
  ListParams,
  PaginatedResponse,
} from "@/types";

/**
 * Admin client for managing deployment environments.
 * Each environment has its own API keys, auth configuration, and integrations.
 *
 * @example
 * ```typescript
 * // Create a staging environment
 * const env = await revstack.admin.environments.create({
 *   name: "staging",
 *   authProvider: "supabase",
 *   authJwksUri: "https://my-project.supabase.co/.well-known/jwks.json",
 * });
 *
 * // Rotate API keys after a security incident
 * const newKeys = await revstack.admin.environments.rotateKeys(env.id);
 * ```
 */
export class AdminEnvironmentsClient extends BaseClient {
  constructor(config: { secretKey: string; baseUrl: string; timeout: number }) {
    super(config);
  }

  /**
   * List all environments with optional pagination.
   *
   * @param params - Pagination parameters.
   * @returns A paginated list of environments.
   */
  async list(params?: ListParams): Promise<PaginatedResponse<Environment>> {
    return this.request<PaginatedResponse<Environment>>(
      `/admin/environments${this.buildQuery(params)}`,
      { method: "GET" },
    );
  }

  /**
   * Retrieve a single environment by ID.
   *
   * @param environmentId - The environment's unique identifier.
   * @returns The environment record including API keys and auth config.
   */
  async get(environmentId: string): Promise<Environment> {
    return this.request<Environment>(`/admin/environments/${environmentId}`, {
      method: "GET",
    });
  }

  /**
   * Create a new deployment environment.
   *
   * @param params - Environment creation parameters.
   * @returns The newly created environment with generated API keys.
   */
  async create(params: CreateEnvironmentParams): Promise<Environment> {
    return this.request<Environment>("/admin/environments", {
      method: "POST",
      body: JSON.stringify(params),
    });
  }

  /**
   * Update an existing environment's name or auth configuration.
   *
   * @param environmentId - The environment's unique identifier.
   * @param params - Fields to update.
   * @returns The updated environment.
   */
  async update(
    environmentId: string,
    params: UpdateEnvironmentParams,
  ): Promise<Environment> {
    return this.request<Environment>(`/admin/environments/${environmentId}`, {
      method: "PATCH",
      body: JSON.stringify(params),
    });
  }

  /**
   * Delete an environment. This invalidates its API keys immediately.
   *
   * @param environmentId - The environment's unique identifier.
   * @returns Confirmation of deletion.
   */
  async delete(environmentId: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(
      `/admin/environments/${environmentId}`,
      { method: "DELETE" },
    );
  }

  /**
   * Rotate both the public and secret API keys for an environment.
   * The old keys become invalid immediately. Use this after a security incident.
   *
   * @param environmentId - The environment whose keys to rotate.
   * @returns The new API key pair.
   */
  async rotateKeys(
    environmentId: string,
  ): Promise<{ apiKeyPublic: string; apiKeySecret: string }> {
    return this.request<{ apiKeyPublic: string; apiKeySecret: string }>(
      `/admin/environments/${environmentId}/rotate-keys`,
      { method: "POST" },
    );
  }
}
