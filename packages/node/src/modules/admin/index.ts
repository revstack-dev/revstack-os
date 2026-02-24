import { AdminPlansClient } from "@/modules/admin/plans";
import { AdminEntitlementsClient } from "@/modules/admin/entitlements";
import { AdminIntegrationsClient } from "@/modules/admin/integrations";
import { AdminEnvironmentsClient } from "@/modules/admin/environments";
import { AdminSystemClient } from "@/modules/admin/system";

/**
 * Aggregated admin client that bundles all Control Plane modules.
 * Exposed as `revstack.admin` on the main {@link Revstack} class.
 *
 * Used by the CLI (`npx revstack push`) for Billing as Code deployments
 * and by advanced integrations that need full infrastructure control.
 */
export class AdminClient {
  /** Manage billing plans (CRUD + idempotent upsert). */
  public readonly plans: AdminPlansClient;
  /** Manage entitlement definitions (CRUD + idempotent upsert). */
  public readonly entitlements: AdminEntitlementsClient;
  /** Manage payment provider integrations and their events/metrics. */
  public readonly integrations: AdminIntegrationsClient;
  /** Manage deployment environments and API keys. */
  public readonly environments: AdminEnvironmentsClient;
  /** Billing as Code orchestrator for atomic state synchronization. */
  public readonly system: AdminSystemClient;

  constructor(config: { secretKey: string; baseUrl: string; timeout: number }) {
    this.plans = new AdminPlansClient(config);
    this.entitlements = new AdminEntitlementsClient(config);
    this.integrations = new AdminIntegrationsClient(config);
    this.environments = new AdminEnvironmentsClient(config);
    this.system = new AdminSystemClient(config);
  }
}
