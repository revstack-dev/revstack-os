import { AdminPlansClient } from "@/modules/admin/plans";
import { AdminEntitlementsClient } from "@/modules/admin/entitlements";
import { AdminIntegrationsClient } from "@/modules/admin/integrations";
import { AdminEnvironmentsClient } from "@/modules/admin/environments";

export class AdminClient {
  public readonly plans: AdminPlansClient;
  public readonly entitlements: AdminEntitlementsClient;
  public readonly integrations: AdminIntegrationsClient;
  public readonly environments: AdminEnvironmentsClient;

  constructor(config: { secretKey: string; baseUrl: string; timeout: number }) {
    this.plans = new AdminPlansClient(config);
    this.entitlements = new AdminEntitlementsClient(config);
    this.integrations = new AdminIntegrationsClient(config);
    this.environments = new AdminEnvironmentsClient(config);
  }
}
