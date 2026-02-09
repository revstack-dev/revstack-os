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
}
