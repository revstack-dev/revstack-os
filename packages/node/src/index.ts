/**
 * @module @revstackhq/node
 * @description Official Node.js SDK for Revstack — billing infrastructure for SaaS.
 *
 * The SDK provides two namespaces:
 * - **Data Plane** (`revstack.*`) — Daily backend operations: entitlement checks, usage reporting, subscriptions.
 * - **Control Plane** (`revstack.admin.*`) — Infrastructure management: plan CRUD, Billing as Code sync.
 *
 * @example
 * ```typescript
 * import { Revstack, RateLimitError } from "@revstackhq/node";
 *
 * const revstack = new Revstack({ secretKey: "sk_live_..." });
 *
 * // Data Plane: check if a customer can use a feature
 * const { allowed } = await revstack.entitlements.check("usr_abc", "api-calls");
 *
 * // Control Plane: sync billing config from code
 * await revstack.admin.system.sync({ plans: [...], entitlements: [...] });
 * ```
 *
 * @packageDocumentation
 */

import { RevstackOptions } from "@/types";
import { EntitlementsClient } from "@/modules/entitlements";
import { WalletsClient } from "@/modules/wallets";
import { CustomersClient } from "@/modules/customers";
import { UsageClient } from "@/modules/usage";
import { SubscriptionsClient } from "@/modules/subscriptions";
import { PlansClient } from "@/modules/plans";
import { InvoicesClient } from "@/modules/invoices";
import { WebhooksClient } from "@/modules/webhooks";
import { AdminClient } from "@/modules/admin";

/**
 * Main SDK client. Initialize with your secret key to access all modules.
 *
 * @example
 * ```typescript
 * const revstack = new Revstack({
 *   secretKey: process.env.REVSTACK_SECRET_KEY!,
 * });
 * ```
 */
export class Revstack {
  // ─── Data Plane (S2S) ──────────────────────────

  /** Manage end-user (customer) records. */
  public readonly customers: CustomersClient;
  /** Create, cancel, and manage subscriptions. */
  public readonly subscriptions: SubscriptionsClient;
  /** Check feature access and query entitlements. */
  public readonly entitlements: EntitlementsClient;
  /** Report and query metered feature usage. */
  public readonly usage: UsageClient;
  /** Manage customer wallet balances. */
  public readonly wallets: WalletsClient;
  /** Verify inbound webhook signatures. */
  public readonly webhooks: WebhooksClient;
  /** Query billing plans (read-only). */
  public readonly plans: PlansClient;
  /** Query billing invoices (read-only). */
  public readonly invoices: InvoicesClient;

  // ─── Control Plane (CLI / Admin) ───────────────

  /** Administrative operations for plans, entitlements, integrations, and environments. */
  public readonly admin: AdminClient;

  private readonly config: {
    secretKey: string;
    baseUrl: string;
    timeout: number;
  };

  /**
   * Create a new Revstack SDK instance.
   *
   * @param options - Configuration options including the secret API key.
   * @throws {Error} If `secretKey` is missing.
   */
  constructor(options: RevstackOptions) {
    if (!options.secretKey) {
      throw new Error(
        "Revstack: Secret Key is required. Get yours at https://app.revstack.dev"
      );
    }

    this.config = {
      secretKey: options.secretKey,
      baseUrl: options.baseUrl || "https://app.revstack.dev/api/v1",
      timeout: options.timeout || 10000,
    };

    // Data Plane
    this.customers = new CustomersClient(this.config);
    this.subscriptions = new SubscriptionsClient(this.config);
    this.entitlements = new EntitlementsClient(this.config);
    this.usage = new UsageClient(this.config);
    this.wallets = new WalletsClient(this.config);
    this.webhooks = new WebhooksClient();
    this.plans = new PlansClient(this.config);
    this.invoices = new InvoicesClient(this.config);

    // Control Plane
    this.admin = new AdminClient(this.config);
  }
}

// ─── Errors ──────────────────────────────────────
export {
  RevstackError,
  RevstackAPIError,
  RateLimitError,
  SignatureVerificationError,
  SyncConflictError,
} from "@/errors";

export type { SyncConflict } from "@/errors";

// ─── Data Plane Types ────────────────────────────
export type {
  RevstackOptions,
  Customer,
  IdentifyCustomerParams,
  UpdateCustomerParams,
  Subscription,
  CreateSubscriptionParams,
  ChangePlanParams,
  ListSubscriptionsParams,
  Entitlement,
  EntitlementCheckOptions,
  EntitlementCheckResult,
  UsageMeter,
  ReportUsageParams,
  RevertUsageParams,
  BalanceResponse,
  GrantBalanceParams,
  RevokeBalanceParams,
  Plan,
  Price,
  PlanEntitlement,
  ListPlansParams,
  Invoice,
  ListInvoicesParams,
  WebhookEvent,
  ListParams,
  PaginatedResponse,

  // ─── Admin Types ─────────────────────────────────
  CreatePlanParams,
  UpdatePlanParams,
  UpsertPlanParams,
  UpsertPriceInput,
  UpsertPlanEntitlementInput,
  CreateEntitlementParams,
  UpdateEntitlementParams,
  UpsertEntitlementParams,
  Integration,
  CreateIntegrationParams,
  UpdateIntegrationParams,
  ProviderEvent,
  IntegrationMetric,
  ListIntegrationsParams,
  ListProviderEventsParams,
  ListMetricsParams,
  Environment,
  CreateEnvironmentParams,
  UpdateEnvironmentParams,
  SyncConfig,
  SyncPreview,
  SyncChange,
  SyncResult,
} from "@/types";
