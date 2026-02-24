/**
 * @file tests/sdk.test.ts
 * @description Integration tests for the SDK's network layer and error handling.
 * Uses MSW to intercept fetch requests and validate that the SDK correctly
 * parses responses, throws typed errors, and maps HTTP semantics to the
 * error class hierarchy.
 */

import { describe, it, expect, beforeAll, afterEach, afterAll } from "vitest";
import { http, delay } from "msw";
import { server, TEST_BASE_URL, TEST_SECRET_KEY } from "./setup";
import { Revstack, RateLimitError, RevstackAPIError } from "@/index";

// ─── MSW Lifecycle ───────────────────────────────────────────

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ─── SDK Clients ─────────────────────────────────────────────

const revstack = new Revstack({
  secretKey: TEST_SECRET_KEY,
  baseUrl: TEST_BASE_URL,
  timeout: 5000,
});

/** Short-timeout client used exclusively for AbortController tests. */
const revstackFast = new Revstack({
  secretKey: TEST_SECRET_KEY,
  baseUrl: TEST_BASE_URL,
  timeout: 50,
});

// ─── Entitlements (200 OK Path) ──────────────────────────────

describe("EntitlementsClient", () => {
  it("should parse a successful entitlement check response", async () => {
    const result = await revstack.entitlements.check(
      "usr_test_001",
      "api-calls"
    );

    expect(result).toBeDefined();
    expect(result.allowed).toBe(true);
    expect(result.remainingBalance).toBe(50);
  });

  it("should send the correct Authorization header", async () => {
    // The MSW handler rejects unauthorized requests with 401.
    // If we get a successful response, the header was correct.
    const result = await revstack.entitlements.check("usr_test_002", "seats");

    expect(result.allowed).toBe(true);
  });
});

// ─── Usage (429 Error Path) ──────────────────────────────────

describe("UsageClient — RateLimitError", () => {
  it("should throw RateLimitError on 429 responses", async () => {
    await expect(
      revstack.usage.report({
        customerId: "usr_test_001",
        featureId: "api-calls",
        amount: 1,
        idempotencyKey: "idem_test_001",
      })
    ).rejects.toThrow(RateLimitError);
  });

  it("should parse retryAfter, status, and code from the 429 response", async () => {
    try {
      await revstack.usage.report({
        customerId: "usr_test_001",
        featureId: "api-calls",
        amount: 1,
        idempotencyKey: "idem_test_002",
      });

      // Fail the test if no error is thrown
      expect.unreachable("Expected RateLimitError to be thrown");
    } catch (error) {
      // Narrowing: verify it's an instance of our typed error
      expect(error).toBeInstanceOf(RateLimitError);
      expect(error).toBeInstanceOf(RevstackAPIError);

      const rateLimitError = error as RateLimitError;

      // Verify HTTP semantics were correctly mapped
      expect(rateLimitError.status).toBe(429);
      expect(rateLimitError.code).toBe("RATE_LIMIT_EXCEEDED");
      expect(rateLimitError.retryAfter).toBe(30);
      expect(rateLimitError.requestId).toBe("req_test_ratelimit_001");
      expect(rateLimitError.name).toBe("RateLimitError");
    }
  });
});

// ─── Idempotency-Key Validation (400 Bad Request) ────────────

describe("UsageClient — Idempotency-Key validation", () => {
  it("should throw RevstackAPIError with 400 when Idempotency-Key is missing", async () => {
    try {
      await revstack.usage.report({
        customerId: "usr_test_001",
        featureId: "api-calls",
        amount: 1,
        // intentionally omitting idempotencyKey
      });

      expect.unreachable("Expected RevstackAPIError to be thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(RevstackAPIError);
      // Must NOT be a RateLimitError — it's a plain 400
      expect(error).not.toBeInstanceOf(RateLimitError);

      const apiError = error as RevstackAPIError;
      expect(apiError.status).toBe(400);
      expect(apiError.code).toBe("MISSING_IDEMPOTENCY_KEY");
    }
  });
});

// ─── CustomersClient (404 Error Path) ────────────────────────

describe("CustomersClient — Generic 4xx Error", () => {
  it("should throw RevstackAPIError with 404 and CUSTOMER_NOT_FOUND code", async () => {
    try {
      await revstack.customers.get("usr_not_exists");
      expect.unreachable("Expected RevstackAPIError to be thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(RevstackAPIError);

      const apiError = error as RevstackAPIError;
      expect(apiError.status).toBe(404);
      expect(apiError.code).toBe("CUSTOMER_NOT_FOUND");
      expect(apiError.message).toBe("Customer not found");
    }
  });
});

// ─── AbortController Timeout ─────────────────────────────────

describe("BaseClient — Network Timeout", () => {
  it("should abort the request when the server exceeds the timeout", async () => {
    // Override: make GET /customers/usr_timeout hang for 10 seconds
    server.use(
      http.get(`${TEST_BASE_URL}/customers/usr_timeout`, async () => {
        await delay(10_000);
        return new Response(JSON.stringify({ id: "usr_timeout" }), {
          headers: { "Content-Type": "application/json" },
        });
      })
    );

    // revstackFast has a 50ms timeout — the abort must fire before 10s
    await expect(revstackFast.customers.get("usr_timeout")).rejects.toThrow();
  });

  it("should reject with an AbortError (DOMException)", async () => {
    server.use(
      http.get(`${TEST_BASE_URL}/customers/usr_timeout`, async () => {
        await delay(10_000);
        return new Response(JSON.stringify({ id: "usr_timeout" }), {
          headers: { "Content-Type": "application/json" },
        });
      })
    );

    try {
      await revstackFast.customers.get("usr_timeout");
      expect.unreachable("Expected timeout error to be thrown");
    } catch (error) {
      // Node's fetch throws a DOMException with name "AbortError" on timeout
      expect((error as Error).name).toBe("AbortError");
    }
  });
});
