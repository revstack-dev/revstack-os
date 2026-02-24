/**
 * @file tests/webhooks.test.ts
 * @description Unit tests for the WebhooksClient's HMAC-SHA256 signature verification.
 * These tests are pure logic — no MSW, no network. They validate the cryptographic
 * contract between Revstack Cloud and the merchant's server.
 */

import { describe, it, expect } from "vitest";
import { createHmac } from "node:crypto";
import { WebhooksClient } from "@/modules/webhooks";
import { SignatureVerificationError } from "@/errors";

const webhooks = new WebhooksClient();
const WEBHOOK_SECRET = "whsec_test_secret_key_for_hmac";

/**
 * Helper: generates a valid `revstack-signature` header for a given payload.
 * Mirrors the signing algorithm used by Revstack Cloud.
 */
function signPayload(
  payload: string,
  secret: string,
  timestampOverride?: number
): string {
  const timestamp = timestampOverride ?? Math.floor(Date.now() / 1000);
  const signature = createHmac("sha256", secret)
    .update(`${timestamp}.${payload}`)
    .digest("hex");
  return `t=${timestamp},v1=${signature}`;
}

// ─── Test Payload ────────────────────────────────────────────

const eventPayload = JSON.stringify({
  id: "evt_test_001",
  type: "subscription.created",
  data: { subscriptionId: "sub_abc", planId: "plan_pro" },
  createdAt: "2026-02-23T22:00:00Z",
});

// ─── Tests ───────────────────────────────────────────────────

describe("WebhooksClient.constructEvent", () => {
  it("should return the parsed event when signature and timestamp are valid", () => {
    const header = signPayload(eventPayload, WEBHOOK_SECRET);

    const event = webhooks.constructEvent(eventPayload, header, WEBHOOK_SECRET);

    expect(event).toBeDefined();
    expect(event.id).toBe("evt_test_001");
    expect(event.type).toBe("subscription.created");
    expect(event.data).toEqual({
      subscriptionId: "sub_abc",
      planId: "plan_pro",
    });
    expect(event.createdAt).toBe("2026-02-23T22:00:00Z");
  });

  it("should throw SignatureVerificationError when signature is invalid", () => {
    const header = signPayload(eventPayload, "wrong_secret_key");

    expect(() =>
      webhooks.constructEvent(eventPayload, header, WEBHOOK_SECRET)
    ).toThrow(SignatureVerificationError);

    expect(() =>
      webhooks.constructEvent(eventPayload, header, WEBHOOK_SECRET)
    ).toThrow("Webhook signature does not match the expected signature");
  });

  it("should throw SignatureVerificationError when timestamp exceeds tolerance (replay attack)", () => {
    // Timestamp from 10 minutes ago (exceeds the 5-minute default tolerance)
    const staleTimestamp = Math.floor(Date.now() / 1000) - 600;
    const header = signPayload(eventPayload, WEBHOOK_SECRET, staleTimestamp);

    expect(() =>
      webhooks.constructEvent(eventPayload, header, WEBHOOK_SECRET)
    ).toThrow(SignatureVerificationError);

    expect(() =>
      webhooks.constructEvent(eventPayload, header, WEBHOOK_SECRET)
    ).toThrow(/Webhook timestamp too old/);
  });

  it("should accept stale timestamps when tolerance is disabled (set to 0)", () => {
    const staleTimestamp = Math.floor(Date.now() / 1000) - 600;
    const header = signPayload(eventPayload, WEBHOOK_SECRET, staleTimestamp);

    // Tolerance = 0 disables replay protection
    const event = webhooks.constructEvent(
      eventPayload,
      header,
      WEBHOOK_SECRET,
      0
    );

    expect(event.id).toBe("evt_test_001");
  });

  it("should throw SignatureVerificationError on malformed header", () => {
    expect(() =>
      webhooks.constructEvent(eventPayload, "invalid-header", WEBHOOK_SECRET)
    ).toThrow(SignatureVerificationError);

    expect(() =>
      webhooks.constructEvent(eventPayload, "invalid-header", WEBHOOK_SECRET)
    ).toThrow(/Invalid signature header format/);
  });
});
