/**
 * @file tests/setup.ts
 * @description MSW (Mock Service Worker) server configuration for SDK integration tests.
 * Intercepts outbound fetch requests and returns deterministic responses
 * that exercise the SDK's parsing, error handling, and type mapping.
 */

import { http, HttpResponse, delay } from "msw";
import { setupServer } from "msw/node";

/** Base URL the SDK is configured with during tests. */
export const TEST_BASE_URL = "https://app.revstack.dev/api/v1";

/** Test secret key — all mock handlers verify this value. */
export const TEST_SECRET_KEY = "sk_test_abc123";

// ─── Mock Handlers ───────────────────────────────────────────

const handlers = [
  /**
   * POST /entitlements/check — 200 OK
   * Verifies the Authorization header and returns a successful entitlement check.
   */
  http.post(`${TEST_BASE_URL}/entitlements/check`, ({ request }) => {
    const authHeader = request.headers.get("Authorization");

    if (authHeader !== `Bearer ${TEST_SECRET_KEY}`) {
      return HttpResponse.json(
        { message: "Unauthorized", code: "INVALID_API_KEY" },
        { status: 401 }
      );
    }

    return HttpResponse.json({
      allowed: true,
      reason: "included",
      remainingBalance: 50,
    });
  }),

  /**
   * POST /usage/report — 400 if missing Idempotency-Key, otherwise 429
   * First validates that the Idempotency-Key header exists.
   * If present, simulates a rate-limited response with Retry-After header.
   */
  http.post(`${TEST_BASE_URL}/usage/report`, ({ request }) => {
    const idempotencyKey = request.headers.get("Idempotency-Key");

    if (!idempotencyKey) {
      return HttpResponse.json(
        {
          message: "Idempotency-Key header is required for usage reports.",
          code: "MISSING_IDEMPOTENCY_KEY",
        },
        { status: 400 }
      );
    }

    return HttpResponse.json(
      {
        message: "Rate limit exceeded. Please retry after 30 seconds.",
        code: "RATE_LIMIT_EXCEEDED",
        requestId: "req_test_ratelimit_001",
      },
      {
        status: 429,
        headers: {
          "Retry-After": "30",
        },
      }
    );
  }),

  /**
   * GET /customers/usr_not_exists — 404 Not Found
   * Simulates a lookup for a customer that does not exist.
   */
  http.get(`${TEST_BASE_URL}/customers/usr_not_exists`, () => {
    return HttpResponse.json(
      {
        message: "Customer not found",
        code: "CUSTOMER_NOT_FOUND",
      },
      { status: 404 }
    );
  }),

  /**
   * GET /timeout-test — 10 second delay
   * Simulates a hanging server to exercise AbortController timeout logic.
   */
  http.get(`${TEST_BASE_URL}/timeout-test`, async () => {
    await delay(10_000);
    return HttpResponse.json({ ok: true });
  }),
];

// ─── Server Instance ─────────────────────────────────────────

/**
 * MSW server instance for use in integration tests.
 * Use `server.listen()` in `beforeAll` and `server.close()` in `afterAll`.
 */
export const server = setupServer(...handlers);
