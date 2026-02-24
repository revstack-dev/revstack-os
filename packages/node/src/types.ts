/**
 * @module @revstackhq/node/types
 * @description Core type definitions for the Revstack SDK. Split into Data Plane
 * types (used by merchant backend code) and Admin types (used by the CLI and
 * advanced integrations).
 */

// ─── SDK Config ──────────────────────────────────────────────

/**
 * Configuration options for initializing the Revstack SDK client.
 *
 * @example
 * ```typescript
 * const revstack = new Revstack({
 *   secretKey: "sk_live_...",
 *   baseUrl: "https://app.revstack.dev/api/v1",
 *   timeout: 10000,
 * });
 * ```
 */
export interface RevstackOptions {
  /** Secret API key. Obtain yours at {@link https://app.revstack.dev}. */
  secretKey: string;
  /** Base URL for the Revstack API. Defaults to `https://app.revstack.dev/api/v1`. */
  baseUrl?: string;
  /** Request timeout in milliseconds. Defaults to `10000` (10s). */
  timeout?: number;
}

// ─── Pagination ──────────────────────────────────────────────

/** Common pagination parameters for list endpoints. */
export interface ListParams {
  /** Maximum number of records to return. */
  limit?: number;
  /** Number of records to skip (for offset-based pagination). */
  offset?: number;
}

/**
 * Paginated response wrapper returned by all list endpoints.
 * @typeParam T - The type of each item in the `data` array.
 */
export interface PaginatedResponse<T> {
  /** Array of results for the current page. */
  data: T[];
  /** Total number of records matching the query (if available). */
  total?: number;
  /** Whether more records exist beyond this page. */
  hasMore?: boolean;
}

// ═══════════════════════════════════════════════════════════════
// Data Plane Types
// ═══════════════════════════════════════════════════════════════

// ─── Customers ───────────────────────────────────

/** Represents an end-user (app user) within a merchant's environment. */
export interface Customer {
  /** Unique identifier with `usr_` prefix. */
  id: string;
  /** Environment this customer belongs to. */
  environmentId: string;
  /** UID from an external auth provider (e.g. Firebase, Auth0). */
  providerUid?: string;
  /** Customer's email address. */
  email?: string;
  /** Hashed device fingerprint for anonymous identification. */
  deviceHash?: string;
  /** Whether this customer was created anonymously. */
  isAnonymous?: boolean;
  /** External payment gateway customer ID (e.g. Stripe `cus_...`). */
  gatewayCustomerId?: string;
  /** Arbitrary key-value metadata attached to this customer. */
  metadata?: Record<string, unknown>;
  /** ISO 8601 timestamp of when this customer was created. */
  createdAt?: string;
}

/**
 * Parameters for identifying (upserting) a customer.
 * If the `customerId` already exists, it updates the record.
 */
export interface IdentifyCustomerParams {
  /** Unique customer identifier within the merchant's system. */
  customerId: string;
  /** Customer email. */
  email?: string;
  /** Customer display name. */
  name?: string;
  /** Arbitrary metadata to attach to the customer. */
  metadata?: Record<string, unknown>;
}

/** Parameters for updating an existing customer record. */
export interface UpdateCustomerParams {
  /** New email address. */
  email?: string;
  /** Metadata fields to merge with existing metadata. */
  metadata?: Record<string, unknown>;
}

// ─── Subscriptions ───────────────────────────────────────────

/** Represents an active or historical subscription linking a customer to a plan. */
export interface Subscription {
  /** Unique identifier with `sub_` prefix. */
  id: string;
  /** Environment this subscription belongs to. */
  environmentId: string;
  /** The customer who owns this subscription. */
  appUserId?: string;
  /** The plan this subscription is for. */
  planId: string;
  /** The specific price (billing interval) selected. */
  priceId?: string;
  /** Current status: `active`, `canceled`, `past_due`, `trialing`, etc. */
  status: string;
  /** Start of the current billing period (ISO 8601). */
  currentPeriodStart: string;
  /** End of the current billing period (ISO 8601). */
  currentPeriodEnd: string;
  /** Subscription ID in the external payment gateway (e.g. Stripe `sub_...`). */
  externalSubscriptionId?: string;
  /** Organization this subscription is billed to (for B2B). */
  organizationId?: string;
  /** Per-subscription entitlement overrides. */
  customEntitlements?: Record<string, unknown>;
  /** ISO 8601 timestamp of when this subscription was created. */
  createdAt?: string;
}

/** Parameters for creating a new subscription. */
export interface CreateSubscriptionParams {
  /** The customer to subscribe. */
  customerId: string;
  /** The plan to subscribe the customer to. */
  planId: string;
  /** Optional specific price ID (if the plan has multiple billing intervals). */
  priceId?: string;
}

/** Parameters for changing a subscription's plan (upgrade/downgrade). */
export interface ChangePlanParams {
  /** The new plan to switch to. */
  newPlanId: string;
  /** Optional specific price ID for the new plan. */
  newPriceId?: string;
}

/** Filter parameters for listing subscriptions. */
export interface ListSubscriptionsParams extends ListParams {
  /** Filter by customer ID. */
  customerId?: string;
  /** Filter by subscription status. */
  status?: string;
}

// ─── Entitlements ────────────────────────────────────────────

/**
 * Represents a feature or capability that can be gated behind a plan.
 *
 * @example
 * An entitlement named "API Calls" with type "metered" and unitType "count"
 * tracks how many API calls a customer has consumed.
 */
export interface Entitlement {
  /** Unique identifier with `ent_` prefix. */
  id: string;
  /** Human-readable entitlement name. */
  name: string;
  /** URL-safe unique slug (e.g. `api-calls`). */
  slug: string;
  /** Entitlement type: `boolean`, `metered`, `tiered`, etc. */
  type: string;
  /** Project this entitlement belongs to. */
  projectId: string;
  /** Unit of measurement: `count`, `bytes`, `seconds`, etc. */
  unitType: string;
  /** ISO 8601 timestamp of creation. */
  createdAt?: string;
}

/** Options for checking an entitlement against a customer's allocation. */
export interface EntitlementCheckOptions {
  /** The amount of the entitlement to consume. Defaults to `1`. */
  amount?: number;
}

/** Result of an entitlement check. */
export interface EntitlementCheckResult {
  /** Whether the customer is allowed to perform the action. */
  allowed: boolean;
  /** Human-readable reason if `allowed` is `false`. */
  reason?: string;
  /** Remaining balance after this check (for metered entitlements). */
  remainingBalance?: number;
  /** Currency of the remaining balance (for monetary entitlements). */
  currency?: string;
}

// ─── Usage ───────────────────────────────────────────────────

/** Tracks cumulative usage of a metered entitlement for a customer. */
export interface UsageMeter {
  /** Unique identifier with `meter_` prefix. */
  id: string;
  /** The customer this meter belongs to. */
  appUserId: string;
  /** The entitlement being metered. */
  entitlementId: string;
  /** Current usage count within the billing period. */
  currentUsage: number;
  /** ISO 8601 timestamp of the last recorded usage event. */
  lastEventAt?: string;
  /** ISO 8601 timestamp of when the meter will reset. */
  resetAt?: string;
}

/** Parameters for reporting usage of a metered feature. */
export interface ReportUsageParams {
  /** The customer who consumed the feature. */
  customerId: string;
  /** The entitlement slug or ID being consumed. */
  featureId: string;
  /** Amount of usage to report. */
  amount: number;
  /** Idempotency key to prevent duplicate reports. */
  idempotencyKey?: string;
}

/**
 * Parameters for reverting previously reported usage.
 * Useful when a downstream API call fails after usage was already recorded.
 *
 * @example
 * ```typescript
 * // Revert usage after an OpenAI call fails
 * await revstack.usage.revert({
 *   customerId: "usr_abc",
 *   featureId: "ai-tokens",
 *   amount: 500,
 *   reason: "downstream_failure",
 * });
 * ```
 */
export interface RevertUsageParams {
  /** The customer whose usage to revert. */
  customerId: string;
  /** The entitlement slug or ID to revert usage for. */
  featureId: string;
  /** Amount of usage to revert (positive number). */
  amount: number;
  /** Idempotency key to prevent double-reverts. */
  idempotencyKey?: string;
  /** Audit reason for the revert (e.g. `downstream_failure`, `user_error`). */
  reason?: string;
}

// ─── Wallets ─────────────────────────────────────────────────

/** Represents a customer's balance in a specific currency. */
export interface BalanceResponse {
  /** ISO 4217 currency code (e.g. `USD`, `EUR`). */
  currency: string;
  /** Current balance amount. */
  amount: number;
}

/** Parameters for granting credit to a customer's wallet. */
export interface GrantBalanceParams {
  /** The customer to grant balance to. */
  customerId: string;
  /** ISO 4217 currency code. */
  currency: string;
  /** Amount to grant (positive number). */
  amount: number;
  /** Optional description for the transaction (e.g. `"Welcome bonus"`). */
  description?: string;
}

/**
 * Parameters for revoking (deducting) balance from a customer's wallet.
 * Used for manual deductions, penalties, or credit refunds.
 */
export interface RevokeBalanceParams {
  /** The customer to deduct balance from. */
  customerId: string;
  /** ISO 4217 currency code. */
  currency: string;
  /** Amount to deduct (positive number). */
  amount: number;
  /** Audit reason for the deduction (e.g. `refund`, `penalty`, `adjustment`). */
  reason?: string;
}

// ─── Plans (read-only) ──────────────────────────────────────

/**
 * Represents a billing plan with its associated prices and entitlements.
 * Read-only from the Data Plane — mutations happen via `revstack.admin.plans`.
 */
export interface Plan {
  /** Unique identifier with `plan_` prefix. */
  id: string;
  /** Human-readable plan name (e.g. `"Pro"`, `"Enterprise"`). */
  name: string;
  /** URL-safe unique slug (e.g. `pro`, `enterprise`). */
  slug: string;
  /** Optional plan description for display in pricing pages. */
  description?: string;
  /** Project this plan belongs to. */
  projectId: string;
  /** Plan status: `draft`, `active`, `archived`. */
  status: string;
  /** Plan type: `free`, `paid`, `custom`. */
  type: string;
  /** Arbitrary key-value metadata. */
  metadata?: Record<string, unknown>;
  /** Whether this is the default plan assigned to new customers. */
  isDefault: boolean;
  /** Whether this plan is publicly visible in pricing pages. */
  isPublic: boolean;
  /** Associated prices (billing intervals). Populated on `get()` calls. */
  prices?: Price[];
  /** Associated entitlement allocations. Populated on `get()` calls. */
  entitlements?: PlanEntitlement[];
  /** ISO 8601 timestamp of creation. */
  createdAt?: string;
}

/** A specific price point for a plan (e.g. monthly, yearly). */
export interface Price {
  /** Unique identifier with `price_` prefix. */
  id: string;
  /** The plan this price belongs to. */
  planId: string;
  /** Price amount in the smallest currency unit (e.g. cents). */
  amount: number;
  /** ISO 4217 currency code. Defaults to `USD`. */
  currency: string;
  /** Billing interval: `month`, `year`, `week`, `day`. */
  billingInterval: string;
  /** Overage pricing configuration for metered features. */
  overageConfig?: Record<string, unknown>;
  /** Whether this price is currently available for new subscriptions. */
  isActive: boolean;
  /** Number of trial days before billing begins. */
  trialPeriodDays: number;
  /** ISO 8601 timestamp of creation. */
  createdAt?: string;
}

/** Maps an entitlement to a plan with specific limits and configuration. */
export interface PlanEntitlement {
  /** Unique identifier with `plan_ent_` prefix. */
  id: string;
  /** The plan this allocation belongs to. */
  planId: string;
  /** The entitlement being allocated. */
  entitlementId: string;
  /** Numeric usage limit (for metered entitlements). `null` = unlimited. */
  valueLimit?: number;
  /** Boolean value (for boolean entitlements). */
  valueBool?: boolean;
  /** Text value (for text entitlements). */
  valueText?: string;
  /** JSON configuration value (for complex entitlements). */
  valueConfig?: Record<string, unknown>;
  /** Whether exceeding the limit blocks access (`true`) or only triggers alerts. */
  isHardLimit: boolean;
  /** Reset interval: `monthly`, `daily`, `yearly`, `never`. */
  resetPeriod: string;
  /** ISO 8601 timestamp of creation. */
  createdAt?: string;
}

/** Filter parameters for listing plans. */
export interface ListPlansParams extends ListParams {
  /** Filter by plan status. */
  status?: string;
  /** Filter by plan type. */
  type?: string;
}

// ─── Invoices (read-only) ────────────────────────────────────

/**
 * Represents a billing invoice generated for a subscription.
 * Read-only from the Data Plane — invoices are created by the payment pipeline.
 */
export interface Invoice {
  /** Unique identifier with `inv_` prefix. */
  id: string;
  /** The subscription this invoice belongs to. */
  subscriptionId: string;
  /** Invoice amount in the smallest currency unit. */
  amount: number;
  /** ISO 4217 currency code (max 3 characters). */
  currency: string;
  /** Invoice status: `draft`, `open`, `paid`, `void`, `uncollectible`. */
  status: string;
  /** Reason the invoice was created (e.g. `subscription_create`, `subscription_cycle`). */
  billingReason?: string;
  /** ISO 8601 timestamp of when the invoice was paid. */
  paidAt?: string;
  /** ISO 8601 timestamp of creation. */
  createdAt?: string;
}

/** Filter parameters for listing invoices. */
export interface ListInvoicesParams extends ListParams {
  /** Filter by customer ID. */
  customerId?: string;
  /** Filter by subscription ID. */
  subscriptionId?: string;
  /** Filter by invoice status. */
  status?: string;
}

// ─── Webhooks ────────────────────────────────────────────────

/**
 * A verified webhook event received from Revstack Cloud.
 * Returned by {@link WebhooksClient.constructEvent} after signature verification.
 */
export interface WebhookEvent {
  /** Unique event identifier. */
  id: string;
  /** Event type (e.g. `subscription.created`, `invoice.paid`). */
  type: string;
  /** Event payload containing the relevant resource data. */
  data: Record<string, unknown>;
  /** ISO 8601 timestamp of when the event occurred. */
  createdAt: string;
}

// ═══════════════════════════════════════════════════════════════
// Admin Namespace Types (Control Plane)
// ═══════════════════════════════════════════════════════════════

// ─── Admin Plans ─────────────────────────────────────────────

/** Parameters for creating a new plan via the Admin API. */
export interface CreatePlanParams {
  /** Human-readable plan name. */
  name: string;
  /** URL-safe unique slug. Used as the idempotency key for upserts. */
  slug: string;
  /** Optional description for display in pricing pages. */
  description?: string;
  /** Plan status. Defaults to `draft`. */
  status?: string;
  /** Plan type. Defaults to `paid`. */
  type?: string;
  /** Arbitrary metadata. */
  metadata?: Record<string, unknown>;
  /** Whether this is the default plan. */
  isDefault?: boolean;
  /** Whether this plan is publicly visible. */
  isPublic?: boolean;
  /** Prices to create alongside the plan. */
  prices?: UpsertPriceInput[];
  /** Entitlement allocations to create alongside the plan. */
  entitlements?: UpsertPlanEntitlementInput[];
}

/** Parameters for partially updating an existing plan. */
export interface UpdatePlanParams {
  /** New plan name. */
  name?: string;
  /** New description. */
  description?: string;
  /** New status. */
  status?: string;
  /** New type. */
  type?: string;
  /** Metadata to merge. */
  metadata?: Record<string, unknown>;
  /** Whether this is the default plan. */
  isDefault?: boolean;
  /** Whether this plan is publicly visible. */
  isPublic?: boolean;
}

/**
 * Parameters for upserting a plan (create or update by `slug`).
 * Idempotent — the `slug` is used as the natural key.
 * This is the primary method used by the CLI for Billing as Code.
 */
export interface UpsertPlanParams {
  /** URL-safe unique slug. Acts as the natural/idempotency key. */
  slug: string;
  /** Human-readable plan name. */
  name: string;
  /** Optional plan description. */
  description?: string;
  /** Plan status. */
  status?: string;
  /** Plan type. */
  type?: string;
  /** Arbitrary metadata. */
  metadata?: Record<string, unknown>;
  /** Whether this is the default plan. */
  isDefault?: boolean;
  /** Whether this plan is publicly visible. */
  isPublic?: boolean;
  /** Prices to sync. Replaces existing prices. */
  prices?: UpsertPriceInput[];
  /** Entitlement allocations to sync. Replaces existing allocations. */
  entitlements?: UpsertPlanEntitlementInput[];
}

/** Input for declaring a price within a plan upsert. */
export interface UpsertPriceInput {
  /** Price amount. */
  amount: number;
  /** ISO 4217 currency code. Defaults to `USD`. */
  currency?: string;
  /** Billing interval: `month`, `year`, `week`, `day`. */
  billingInterval: string;
  /** Number of trial days. Defaults to `0`. */
  trialPeriodDays?: number;
  /** Overage pricing configuration. */
  overageConfig?: Record<string, unknown>;
}

/** Input for declaring an entitlement allocation within a plan upsert. */
export interface UpsertPlanEntitlementInput {
  /** Slug of the entitlement to allocate. */
  entitlementSlug: string;
  /** Numeric usage limit. */
  valueLimit?: number;
  /** Boolean value (for boolean entitlements). */
  valueBool?: boolean;
  /** Text value (for text entitlements). */
  valueText?: string;
  /** JSON configuration value. */
  valueConfig?: Record<string, unknown>;
  /** Whether this is a hard limit. Defaults to `true`. */
  isHardLimit?: boolean;
  /** Reset period. Defaults to `monthly`. */
  resetPeriod?: string;
}

// ─── Admin Entitlements ──────────────────────────────────────

/** Parameters for creating a new entitlement definition. */
export interface CreateEntitlementParams {
  /** Human-readable name. */
  name: string;
  /** URL-safe unique slug (e.g. `api-calls`). */
  slug: string;
  /** Entitlement type: `boolean`, `metered`, `tiered`. */
  type: string;
  /** Unit of measurement. Defaults to `count`. */
  unitType?: string;
}

/** Parameters for partially updating an entitlement definition. */
export interface UpdateEntitlementParams {
  /** New name. */
  name?: string;
  /** New type. */
  type?: string;
  /** New unit type. */
  unitType?: string;
}

/**
 * Parameters for upserting an entitlement (create or update by `slug`).
 * Idempotent — used by the CLI for Billing as Code.
 */
export interface UpsertEntitlementParams {
  /** URL-safe unique slug. Acts as the natural/idempotency key. */
  slug: string;
  /** Human-readable name. */
  name: string;
  /** Entitlement type. */
  type: string;
  /** Unit of measurement. */
  unitType?: string;
}

// ─── Admin Integrations ─────────────────────────────────────

/** Represents a payment provider integration (e.g. Stripe, Paddle). */
export interface Integration {
  /** Unique identifier with `int_` prefix. */
  id: string;
  /** Environment this integration belongs to. */
  environmentId: string;
  /** Payment provider name (e.g. `stripe`, `paddle`). */
  provider: string;
  /** Encrypted provider credentials (API keys, tokens). */
  credentials: Record<string, unknown>;
  /** Secret used to verify incoming webhooks from the provider. */
  webhookSecret?: string;
  /** Whether this integration is currently active. */
  isActive: boolean;
  /** ISO 8601 timestamp of the last received webhook event. */
  lastEventAt?: string;
  /** Status of the last processed event (`ok`, `error`). */
  lastEventStatus?: string;
  /** Total monetary volume processed through this integration. */
  totalVolume?: number;
  /** Total number of events processed. */
  totalEvents?: number;
  /** ISO 8601 timestamp of creation. */
  createdAt?: string;
}

/** Parameters for creating a new payment integration. */
export interface CreateIntegrationParams {
  /** Payment provider name. */
  provider: string;
  /** Provider credentials (API keys, tokens). */
  credentials: Record<string, unknown>;
  /** Webhook signing secret. */
  webhookSecret?: string;
}

/** Parameters for updating an existing integration. */
export interface UpdateIntegrationParams {
  /** Updated credentials. */
  credentials?: Record<string, unknown>;
  /** Updated webhook secret. */
  webhookSecret?: string;
  /** Enable or disable the integration. */
  isActive?: boolean;
}

/** A webhook event received from an external payment provider. */
export interface ProviderEvent {
  /** Unique identifier with `evt_` prefix. */
  id: string;
  /** The integration that received this event. */
  integrationId: string;
  /** External event ID from the provider. */
  externalId?: string;
  /** Event type (e.g. `invoice.paid`, `customer.subscription.updated`). */
  type: string;
  /** Processing status: `ok`, `error`, `skipped`. */
  status: string;
  /** Raw event payload from the provider. */
  payload?: Record<string, unknown>;
  /** ISO 8601 timestamp of when the event was received. */
  createdAt?: string;
}

/** Aggregated hourly metrics for an integration. */
export interface IntegrationMetric {
  /** Auto-incrementing row ID. */
  id: number;
  /** The integration this metric belongs to. */
  integrationId: string;
  /** Start of the hour bucket (ISO 8601). */
  hourBucket: string;
  /** Total monetary volume processed in this hour. */
  volume: number;
  /** Total number of events processed in this hour. */
  eventCount: number;
}

/** Filter parameters for listing integrations. */
export interface ListIntegrationsParams extends ListParams {
  /** Filter by provider name. */
  provider?: string;
  /** Filter by active status. */
  isActive?: boolean;
}

/** Filter parameters for listing provider events. */
export interface ListProviderEventsParams extends ListParams {
  /** Filter by event type. */
  type?: string;
  /** Filter by processing status. */
  status?: string;
}

/** Filter parameters for listing hourly metrics. */
export interface ListMetricsParams extends ListParams {
  /** ISO 8601 start date for the time range. */
  from?: string;
  /** ISO 8601 end date for the time range. */
  to?: string;
}

// ─── Admin Environments ─────────────────────────────────────

/** Represents a deployment environment (e.g. production, staging) with API keys and auth config. */
export interface Environment {
  /** Unique identifier with `env_` prefix. */
  id: string;
  /** Project this environment belongs to. */
  projectId: string;
  /** Environment name (e.g. `production`, `staging`). */
  name: string;
  /** Public API key (safe to expose in client-side code). */
  apiKeyPublic: string;
  /** Secret API key (server-side only — never expose to clients). */
  apiKeySecret: string;
  /** Auth provider: `supabase`, `firebase`, `auth0`, `custom`. */
  authProvider?: string;
  /** JWT signing algorithm (e.g. `RS256`, `HS256`). */
  authAlgorithm?: string;
  /** JWT issuer (`iss` claim). */
  authIssuer?: string;
  /** JWT audience (`aud` claim). */
  authAudience?: string;
  /** JWT signing secret (for HMAC algorithms). */
  authSecret?: string;
  /** JWKS endpoint URI (for RSA/ECDSA algorithms). */
  authJwksUri?: string;
  /** ISO 8601 timestamp of creation. */
  createdAt?: string;
}

/** Parameters for creating a new environment. */
export interface CreateEnvironmentParams {
  /** Environment name. */
  name: string;
  /** Auth provider identifier. */
  authProvider?: string;
  /** JWT signing algorithm. */
  authAlgorithm?: string;
  /** JWT issuer. */
  authIssuer?: string;
  /** JWT audience. */
  authAudience?: string;
  /** JWT secret (HMAC). */
  authSecret?: string;
  /** JWKS endpoint URI (RSA/ECDSA). */
  authJwksUri?: string;
}

/** Parameters for updating an existing environment. */
export interface UpdateEnvironmentParams {
  /** New environment name. */
  name?: string;
  /** Updated auth provider. */
  authProvider?: string;
  /** Updated JWT algorithm. */
  authAlgorithm?: string;
  /** Updated JWT issuer. */
  authIssuer?: string;
  /** Updated JWT audience. */
  authAudience?: string;
  /** Updated JWT secret. */
  authSecret?: string;
  /** Updated JWKS URI. */
  authJwksUri?: string;
}

// ─── Admin System (Billing as Code) ─────────────────────────

/**
 * The desired state object sent by the CLI's `npx revstack push` command.
 * Contains the full billing configuration defined in `revstack.config.ts`.
 */
export interface SyncConfig {
  /** Plans to synchronize (upserted by slug). */
  plans: UpsertPlanParams[];
  /** Entitlements to synchronize (upserted by slug). */
  entitlements: UpsertEntitlementParams[];
}

/**
 * Preview of what changes would be applied by a `sync()` call.
 * Returned by `admin.system.preview()` without applying any mutations.
 */
export interface SyncPreview {
  /** List of changes that would be applied. */
  changes: SyncChange[];
  /** Whether any of the changes are breaking (e.g. removing active entitlements). */
  hasBreakingChanges: boolean;
}

/** Describes a single change within a sync operation. */
export interface SyncChange {
  /** The type of resource being changed. */
  resource:
    | "plan"
    | "entitlement"
    | "price"
    | "plan_entitlement"
    | "integration";
  /** The action to be performed. */
  action: "create" | "update" | "delete" | "noop";
  /** The slug (natural key) of the resource. */
  slug: string;
  /** Field-level diff showing what changed (`from` → `to`). */
  diff?: Record<string, { from: unknown; to: unknown }>;
}

/**
 * Result of a successful `sync()` call.
 * Contains the list of changes that were applied in a single ACID transaction.
 */
export interface SyncResult {
  /** Changes that were applied. */
  applied: SyncChange[];
  /** ISO 8601 timestamp of when the sync was executed. */
  timestamp: string;
}
