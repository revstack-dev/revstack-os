/**
 * The execution context for any provider operation.
 * Contains the decrypted configuration and environment info.
 */
export interface ProviderContext {
  /**
   * The decrypted credentials/settings for this specific merchant connection.
   * e.g., { apiKey: "sk_live_...", webhookSecret: "whsec_..." }
   */
  config: Record<string, any>;

  /**
   * The merchant executing this operation.
   * Useful for multi-tenancy, logging, and event correlation.
   */
  merchantId?: string;

  /**
   * Optional: The webhook ID or relevant correlation ID for logging/tracing.
   */
  traceId?: string;

  /**
   * Indicates if the operation is running in Sandbox/Test mode.
   */
  isTestMode: boolean;

  /**
   * Optional: Idempotency key for duplicate request prevention.
   */
  idempotencyKey?: string;

  /**
   * Locale for provider-side localization (checkout pages, emails, etc.).
   * e.g., "es-AR", "en-US", "pt-BR"
   */
  locale?: string;
}
