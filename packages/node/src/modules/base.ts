import {
  RevstackAPIError,
  RateLimitError,
  SyncConflictError,
  type APIErrorResponse,
} from "@/errors";

/**
 * Base HTTP client shared by all SDK modules.
 * Handles authentication, timeouts, idempotency headers, and typed error responses.
 *
 * @internal Not intended for direct use — all public modules extend this class.
 */
export class BaseClient {
  constructor(
    protected config: { secretKey: string; baseUrl: string; timeout: number }
  ) {}

  /**
   * Builds a URL query string from an object of parameters.
   * Filters out `null` and `undefined` values.
   *
   * @typeParam T - The parameter object type.
   * @param params - Key-value pairs to encode as query parameters.
   * @returns A query string prefixed with `?`, or an empty string if no params.
   */
  protected buildQuery<T extends object>(params?: T): string {
    if (!params) return "";
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    }
    const query = searchParams.toString();
    return query ? `?${query}` : "";
  }

  /**
   * Sends an authenticated HTTP request to the Revstack API.
   *
   * @typeParam T - Expected response body type.
   * @param endpoint - API endpoint path (e.g. `/customers`).
   * @param options - Fetch options with optional `idempotencyKey`.
   * @returns Parsed JSON response body.
   *
   * @throws {RateLimitError} When the API returns HTTP 429.
   * @throws {SyncConflictError} When `admin.system.sync()` detects a conflict (HTTP 409).
   * @throws {RevstackAPIError} For all other non-2xx responses.
   */
  protected async request<T>(
    endpoint: string,
    options: RequestInit & { idempotencyKey?: string } = {}
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.config.secretKey}`,
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (options.idempotencyKey) {
      headers["Idempotency-Key"] = options.idempotencyKey;
    }

    try {
      const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
        ...options,
        headers,
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorData = (await response
          .json()
          .catch(() => ({}))) as APIErrorResponse;

        const message =
          errorData.message || `Revstack API Error: ${response.status}`;
        const requestId = errorData.requestId;

        if (response.status === 429) {
          const retryAfter =
            errorData.retryAfter ??
            parseInt(response.headers.get("Retry-After") || "60", 10);
          throw new RateLimitError(message, retryAfter, requestId);
        }

        if (response.status === 409 && errorData.conflicts) {
          throw new SyncConflictError(message, errorData.conflicts, requestId);
        }

        throw new RevstackAPIError(
          message,
          response.status,
          errorData.code || "UNKNOWN_ERROR",
          requestId
        );
      }

      return (await response.json()) as T;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
