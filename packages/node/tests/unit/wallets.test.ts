import { describe, it, expect, vi, beforeEach } from "vitest";
import { WalletsClient } from "../../src/modules/wallets";

describe("WalletsClient", () => {
  const config = {
    secretKey: "sk_test",
    baseUrl: "http://api.test",
    timeout: 1000,
  };
  let client: WalletsClient;

  beforeEach(() => {
    client = new WalletsClient(config);
    global.fetch = vi.fn();
  });

  it("should send a GET to /wallets/:id/:currency for getBalance", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });
    await client.getBalance("cus_123", "USD");
    expect(global.fetch).toHaveBeenCalledWith(
      "http://api.test/wallets/cus_123/USD",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("should send a GET to /wallets/:id for listBalances", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });
    await client.listBalances("cus_123");
    expect(global.fetch).toHaveBeenCalledWith(
      "http://api.test/wallets/cus_123",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("should send a POST to /wallets/grant for grantBalance", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });
    await client.grantBalance({
      customerId: "cus_123",
      currency: "USD",
      amount: 50,
    });
    expect(global.fetch).toHaveBeenCalledWith(
      "http://api.test/wallets/grant",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          customerId: "cus_123",
          currency: "USD",
          amount: 50,
        }),
      }),
    );
  });

  it("should send a POST to /wallets/revoke for revokeBalance", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });
    await client.revokeBalance({
      customerId: "cus_123",
      currency: "USD",
      amount: 10,
    });
    expect(global.fetch).toHaveBeenCalledWith(
      "http://api.test/wallets/revoke",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          customerId: "cus_123",
          currency: "USD",
          amount: 10,
        }),
      }),
    );
  });
});
