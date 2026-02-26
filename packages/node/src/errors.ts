/**
 * @module @revstackhq/node/errors
 * @description Typed error hierarchy for the Revstack SDK. All errors thrown by the
 * SDK extend {@link RevstackError}, enabling precise error handling with `instanceof`.
 *
 * @example
 * ```typescript
 * import { RateLimitError, RevstackAPIError } from "@revstackhq/node";
 *
 * try {
 *   await revstack.entitlements.check(userId, "api-calls");
 * } catch (error) {
 *   if (error instanceof RateLimitError) {
 *     console.log(`Rate limited. Retry after ${error.retryAfter}s`);
 *   } else if (error instanceof RevstackAPIError) {
 *     console.log(`API error ${error.status}: ${error.code}`);
 *   }
 * }
 * ```
 */

// ─── Base Error ──────────────────────────────────────────────

/**
 * Base class for all Revstack SDK errors.
 * Use `instanceof RevstackError` to catch any SDK-originated error.
 */
export class RevstackError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RevstackError";
  }
}

// ─── API Errors ──────────────────────────────────────────────

/** Shape of the JSON error body returned by the Revstack API. */
export interface APIErrorResponse {
  /** Human-readable error message. */
  message?: string;
  /** Machine-readable error code (e.g. `INSUFFICIENT_BALANCE`). */
  code?: string;
  /** Unique request identifier for debugging and support tickets. */
  requestId?: string;
  /** Seconds to wait before retrying (for 429 responses). */
  retryAfter?: number;
  /** List of conflicts in case of a 409 response */
  conflicts?: any[];
}

/**
 * Thrown when the Revstack API returns a non-2xx HTTP response.
 * Contains structured fields for programmatic error handling.
 */
export class RevstackAPIError extends RevstackError {
  /** HTTP status code (e.g. `400`, `401`, `404`, `500`). */
  public readonly status: number;
  /** Machine-readable error code (e.g. `INSUFFICIENT_BALANCE`, `NOT_FOUND`). */
  public readonly code: string;
  /** Unique request ID for tracing. Include this in support tickets. */
  public readonly requestId?: string;

  constructor(
    message: string,
    status: number,
    code: string,
    requestId?: string,
  ) {
    super(message);
    this.name = "RevstackAPIError";
    this.status = status;
    this.code = code;
    this.requestId = requestId;
  }
}

// ─── Rate Limit ──────────────────────────────────────────────

/**
 * Thrown when the API returns HTTP 429 (Too Many Requests).
 * The `retryAfter` field indicates how long to wait before retrying.
 *
 * @example
 * ```typescript
 * try {
 *   await revstack.usage.report(params);
 * } catch (error) {
 *   if (error instanceof RateLimitError) {
 *     await sleep(error.retryAfter * 1000);
 *     await revstack.usage.report(params); // retry
 *   }
 * }
 * ```
 */
export class RateLimitError extends RevstackAPIError {
  /** Number of seconds to wait before retrying the request. */
  public readonly retryAfter: number;

  constructor(message: string, retryAfter: number, requestId?: string) {
    super(message, 429, "RATE_LIMIT_EXCEEDED", requestId);
    this.name = "RateLimitError";
    this.retryAfter = retryAfter;
  }
}

// ─── Webhook Signature ──────────────────────────────────────

/**
 * Thrown when webhook signature verification fails.
 * This indicates the webhook payload was tampered with, the signing secret is wrong,
 * or the webhook timestamp has expired (replay protection).
 */
export class SignatureVerificationError extends RevstackError {
  constructor(message: string = "Webhook signature verification failed") {
    super(message);
    this.name = "SignatureVerificationError";
  }
}

// ─── Sync Conflict ──────────────────────────────────────────

/**
 * Thrown when the system sync endpoint detects a conflict (HTTP 409).
 */
export class SyncConflictError extends RevstackAPIError {
  /** The conflicts discovered during sync attempts. */
  public readonly conflicts: any[];

  constructor(message: string, conflicts: any[], requestId?: string) {
    super(message, 409, "SYNC_CONFLICT", requestId);
    this.name = "SyncConflictError";
    this.conflicts = conflicts;
  }
}
