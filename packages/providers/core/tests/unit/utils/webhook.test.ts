import { describe, it, expect } from "vitest";
import { normalizeHeaders } from "@/utils/webhook";

describe("normalizeHeaders", () => {
  it("normalizes headers by lowercasing keys and flattening arrays", () => {
    const headers = {
      "Stripe-Signature": ["v1=123,t=456"],
      "content-type": "application/json",
    };

    const normalized = normalizeHeaders(headers);

    expect(normalized).toEqual({
      "stripe-signature": "v1=123,t=456",
      "content-type": "application/json",
    });
  });

  it("ignores undefined headers", () => {
    const normalized = normalizeHeaders({ "custom-header": undefined });
    expect(normalized).toEqual({});
  });
});
