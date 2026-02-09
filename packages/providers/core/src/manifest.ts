import { ProviderCapabilities } from "@/types/capabilities";
import { ProviderCategory } from "@/types/categories";

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

  /** URL to the provider's logo */
  logoUrl?: string;

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
}
