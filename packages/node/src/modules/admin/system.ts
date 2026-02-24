import { BaseClient } from "@/modules/base";
import { SyncConfig, SyncResult, SyncPreview } from "@/types";

/**
 * Admin client for the Billing as Code orchestrator.
 * Provides atomic sync operations used by the CLI (`npx revstack push`) to
 * apply the full desired state from `revstack.config.ts` in a single ACID
 * Postgres transaction.
 *
 * @example
 * ```typescript
 * const config: SyncConfig = {
 *   plans: [
 *     { slug: "free", name: "Free", type: "free", status: "active" },
 *     { slug: "pro", name: "Pro", prices: [{ amount: 4900, billingInterval: "month" }] },
 *   ],
 *   entitlements: [
 *     { slug: "api-calls", name: "API Calls", type: "metered", unitType: "count" },
 *   ],
 * };
 *
 * // Preview changes before applying
 * const preview = await revstack.admin.system.preview(config);
 * console.log(`${preview.changes.length} changes, breaking: ${preview.hasBreakingChanges}`);
 *
 * // Apply atomically
 * const result = await revstack.admin.system.sync(config);
 * console.log(`Applied ${result.applied.length} changes at ${result.timestamp}`);
 * ```
 */
export class AdminSystemClient extends BaseClient {
  /**
   * Apply the full desired billing state in a single ACID transaction.
   * The Revstack Cloud backend computes the diff between the current state
   * and the desired config, then applies all changes atomically.
   *
   * @param config - The complete desired state (plans + entitlements).
   * @returns The list of changes that were applied and the execution timestamp.
   *
   * @throws {SyncConflictError} If the remote state has drifted unexpectedly (HTTP 409).
   */
  async sync(config: SyncConfig): Promise<SyncResult> {
    return this.request<SyncResult>("/admin/system/sync", {
      method: "POST",
      body: JSON.stringify(config),
    });
  }

  /**
   * Preview the changes that would be applied by a `sync()` call.
   * Returns the computed diff without applying any mutations.
   * The CLI should **always** call this before `sync()` to show the operator
   * what will change.
   *
   * @param config - The complete desired state (plans + entitlements).
   * @returns A preview with the list of changes and whether any are breaking.
   */
  async preview(config: SyncConfig): Promise<SyncPreview> {
    return this.request<SyncPreview>("/admin/system/preview", {
      method: "POST",
      body: JSON.stringify(config),
    });
  }
}
