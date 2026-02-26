import { describe, it, expect, vi, beforeEach } from "vitest";
import { UsageClient } from "../../src/modules/usage";

describe("UsageClient", () => {
  const config = {
    secretKey: "sk_test",
    baseUrl: "http://api.test",
    timeout: 1000,
  };
  let client: UsageClient;

  beforeEach(() => {
    client = new UsageClient(config);
    global.fetch = vi.fn();
  });

  it("should send a POST to /usage/report for report", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    await client.report({
      customerId: "cus_123",
      featureId: "api-calls",
      amount: 5,
      idempotencyKey: "idem_1",
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "http://api.test/usage/report",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          customerId: "cus_123",
          featureId: "api-calls",
          amount: 5,
        }),
      }),
    );
  });

  it("should send a POST to /usage/revert for revert", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    await client.revert({
      customerId: "cus_123",
      featureId: "api-calls",
      amount: 5,
      reason: "err",
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "http://api.test/usage/revert",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          customerId: "cus_123",
          featureId: "api-calls",
          amount: 5,
          reason: "err",
        }),
      }),
    );
  });
});
