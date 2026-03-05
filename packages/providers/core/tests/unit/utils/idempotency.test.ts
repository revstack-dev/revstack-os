import { describe, it, expect } from "vitest";
import { generateIdempotencyKey } from "@/utils/idempotency";

describe("generateIdempotencyKey", () => {
  it("generates a 32 character key starting with idem_", () => {
    const key = generateIdempotencyKey("checkout_session", {
      amount: 1000,
      customer: "cus_123",
    });
    expect(key).toMatch(/^idem_[0-9a-f]{27}$/);
    expect(key.length).toBe(32);
  });

  it("generates identical keys for identical payload and context", () => {
    const key1 = generateIdempotencyKey("context", { a: 1 });
    const key2 = generateIdempotencyKey("context", { a: 1 });
    expect(key1).toBe(key2);
  });

  it("generates different keys for different payloads", () => {
    const key1 = generateIdempotencyKey("context", { a: 1 });
    const key2 = generateIdempotencyKey("context", { a: 2 });
    expect(key1).not.toBe(key2);
  });
});
