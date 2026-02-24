import { ProviderCapabilities } from "@/types/capabilities";
import { ProviderCategory } from "@/types/categories";

export interface ProviderEngine {
  /**
   * required core semver range (e.g. "^1.0.0")
   */
  revstack: string;

  /**
   * optional node version limit
   */
  node?: string;
}

export interface ProviderPricing {
  /**
   * underlying provider pricing model
   */
  model: "subscription" | "transactional" | "freemium" | "free";

  /**
   * human-readable fee text
   */
  fees?: string;

  /**
   * link to provider pricing page
   */
  url?: string;
}

export interface ProviderMedia {
  /**
   * square icon (SVG/PNG)
   */
  icon: string;

  /**
   * horizontal logo (SVG/PNG)
   */
  logo: string;

  /**
   * plugin detail hero image
   */
  banner?: string;

  /**
   * array of screenshot URLs
   */
  screenshots?: string[];
}

export type ProviderStatus = "stable" | "beta" | "deprecated" | "experimental";

/**
 * input UI field types
 */
export type ConfigFieldType =
  | "text"
  | "password"
  | "switch"
  | "select"
  | "number"
  | "json";

/**
 * config field definition for UI rendering and encryption parsing
 */
export interface ConfigFieldDefinition {
  /** Label to display in the UI */
  label: string;
  /** Input type */
  type: ConfigFieldType;
  /** If true, this field must be encrypted in the DB */
  secure: boolean;
  /** Is this field required? */
  required: boolean;
  /** Description or tooltip for the user */
  description?: string;
  /** Options for 'select' type */
  options?: { label: string; value: string }[];

  /**
   * Regex pattern string for validation.
   * Example: "^sk_(test|live)_[a-zA-Z0-9]+$"
   */
  pattern?: string;

  /** Custom error message if regex validation fails. */
  errorMessage?: string;
}

export interface DataFieldDefinition {
  /**
   * If true, the value of this field will be encrypted in the DB.
   */
  secure: boolean;

  /**
   * Description for internal documentation (optional)
   */
  description?: string;
}

/**
 * dashboard update visual severity
 */
export type UpdatePriority = "low" | "recommended" | "critical" | "security";

/**
 * release versioning and migration plan
 */
export interface ProviderRelease {
  /**
   * Semantic version of the provider package (e.g., '1.0.0').
   * Vital for managing updates in the marketplace.
   */
  version: string;

  /**
   * Indicates if this update breaks compatibility with previous configurations.
   * - `true`: "Hard Break". The integration stops (Status: Error) until the user updates the config.
   * - `false`: "Soft Update". The integration continues working (Status: Healthy) using the old logic.
   */
  breaking: boolean;

  /**
   * The visual urgency level to display in the UI.
   * - `low`: Grey/Blue badge. (Minor bug fixes)
   * - `recommended`: Yellow badge. (New features)
   * - `critical`: Red badge. (Mandatory API changes)
   * - `security`: Flashing Red/Alert. (Vulnerabilities)
   */
  priority: UpdatePriority;

  /**
   * Short message (1-2 sentences) explaining the value of the update.
   * Example: "Adds support for partial refunds and fixes a webhook timeout issue."
   */
  message: string;

  /**
   * Optional link to a detailed migration guide.
   * Useful when the user needs to make manual changes in their Stripe/PayPal dashboard.
   */
  docsUrl?: string;

  /**
   * ISO 8601 Date when the previous version will stop working permanently.
   * Useful for "Soft Updates" that eventually become mandatory.
   * Example: "2026-12-31T23:59:59Z"
   */
  sunsetDate?: string;
}

/**
 * core provider metadata and capabilities schema
 */
export interface ProviderManifest {
  /** Unique identifier (e.g., 'stripe', 'polar') */
  slug: string;

  /** Display name (e.g., 'Stripe') */
  name: string;

  /** Provider category */
  category: ProviderCategory;

  /**
   * semver provider version
   * needed for marketplace updates
   */
  version: string;

  /** Short description displayed in the marketplace card. */
  description?: string;

  /** The organization or developer maintaining this provider. */
  author?: string;

  /** Link to the official documentation for this specific provider. */
  documentationUrl?: string;

  /** Link to the support page or repository issue tracker. */
  supportUrl?: string;

  /** Link to the provider's dashboard for easy access to settings and metrics. */
  dashboardUrl?: string;

  /**
   * supported country ISOs or ['global']
   * filters UI by merchant location
   */
  regions?: string[];

  /**
   * supported currencies or ['*']
   */
  currencies?: string[];

  /**
   * flags if there's a dedicated sandbox mode
   */
  sandboxAvailable?: boolean;

  /**
   * config schema mapped to internal keys
   */
  configSchema: Record<string, ConfigFieldDefinition>;

  /**
   * internal data output schema
   * helps core figure out what to encrypt
   */
  dataSchema?: Record<string, DataFieldDefinition>;

  /**
   * capability flags
   */
  capabilities: ProviderCapabilities;

  /** Lifecycle status */
  status: ProviderStatus;

  /** If true, hidden from the public marketplace (private plugins) */
  hidden?: boolean;

  /** Compatibility requirements */
  engine: ProviderEngine;

  /** List of other plugin slugs required by this one */
  dependencies?: string[];

  /** Visual assets for the marketplace UI */
  media: ProviderMedia;

  /** Pricing info for the merchant */
  pricing?: ProviderPricing;

  releases?: ProviderRelease[];
}
