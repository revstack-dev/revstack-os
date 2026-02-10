import { ProviderCapabilities } from "@/types/capabilities";
import { ProviderCategory } from "@/types/categories";

export interface ProviderEngine {
  /**
   * Semver range of the Revstack Core required to run this plugin.
   * Example: "^1.0.0" or ">=2.0.0"
   */
  revstack: string;

  /**
   * Optional Node.js version requirement.
   * Example: ">=18.0.0"
   */
  node?: string;
}

export interface ProviderPricing {
  /**
   * The pricing model of the external provider.
   * Used to inform the merchant before they connect.
   */
  model: "subscription" | "transactional" | "freemium" | "free";

  /**
   * Human-readable fee structure.
   * Example: "2.9% + $0.30 per transaction"
   */
  fees?: string;

  /**
   * Link to the official pricing page of the provider.
   */
  url?: string;
}

export interface ProviderMedia {
  /**
   * Square icon for lists and grids (SVG/PNG).
   */
  icon: string;

  /**
   * Full horizontal logo for headers and banners (SVG/PNG).
   */
  logo: string;

  /**
   * Large hero image for the plugin detail page.
   */
  banner?: string;

  /**
   * Array of URLs showing the plugin in action (dashboard, settings).
   */
  screenshots?: string[];
}

export type ProviderStatus = "stable" | "beta" | "deprecated" | "experimental";

/**
 * Defines the input field type for the installation UI.
 */
export type ConfigFieldType =
  | "text"
  | "password"
  | "switch"
  | "select"
  | "number"
  | "json";

/**
 * Configuration schema for a provider setting.
 * Used to generate the UI and handle encryption.
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
 * The Provider Manifest.
 * Acts as the source of truth for the provider's metadata and capabilities.
 */
export interface ProviderManifest {
  /** Unique identifier (e.g., 'stripe', 'polar') */
  slug: string;

  /** Display name (e.g., 'Stripe') */
  name: string;

  /** Provider category */
  category: ProviderCategory;

  /** * Semantic version of the provider package (e.g., '1.0.0').
   * Vital for managing updates in the marketplace.
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

  /** * List of supported ISO 3166-1 alpha-2 country codes (e.g., ['US', 'GB', 'BR']).
   * Use ['global'] if the provider works worldwide.
   * Used to filter providers in the UI based on the merchant's location.
   */
  regions?: string[];

  /**
   * List of supported ISO 4217 currency codes (e.g., ['USD', 'EUR']).
   * Use ['*'] if the provider supports all currencies.
   */
  currencies?: string[];

  /** * Indicates if the provider supports a dedicated sandbox/test mode.
   * If true, the UI should allow switching between Test and Live credentials.
   */
  sandboxAvailable?: boolean;

  /** * Schema to generate the installation form.
   * Key is the internal config key (e.g., 'apiKey').
   */
  configSchema: Record<string, ConfigFieldDefinition>;

  /**
   * Defines the fields that the provider generates and stores internally (Outputs).
   * The Core uses this to know which fields to encrypt in the 'data' column.
   */
  dataSchema?: Record<string, DataFieldDefinition>;

  /**
   * What this provider can do. Used for feature flagging in the core.
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
}
