import { describe, it, expect, vi, beforeEach } from "vitest";
import { EntitlementsClient } from "../../src/modules/entitlements";

describe("EntitlementsClient", () => {
  const config = {
    secretKey: "sk_test",
    baseUrl: "http://api.test",
    timeout: 1000,
  };
  let client: EntitlementsClient;

  beforeEach(() => {
    client = new EntitlementsClient(config);
    global.fetch = vi.fn();
  });

  it("should send a POST to /entitlements/check for check", async () => {
    const mockResponse = { allowed: true, remainingBalance: 10 };
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await client.check("cus_123", "api-calls", { amount: 5 });

    expect(global.fetch).toHaveBeenCalledWith(
      "http://api.test/entitlements/check",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          customerId: "cus_123",
          featureId: "api-calls",
          requestedAmount: 5,
        }),
      }),
    );
    expect(result).toEqual(mockResponse);
  });
});
