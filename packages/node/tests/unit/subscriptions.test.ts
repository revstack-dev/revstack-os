import { describe, it, expect, vi, beforeEach } from "vitest";
import { SubscriptionsClient } from "../../src/modules/subscriptions";

describe("SubscriptionsClient", () => {
  const config = {
    secretKey: "sk_test",
    baseUrl: "http://api.test",
    timeout: 1000,
  };
  let client: SubscriptionsClient;

  beforeEach(() => {
    client = new SubscriptionsClient(config);
    global.fetch = vi.fn();
  });

  it("should send a GET to /subscriptions for list", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });
    await client.list({ customerId: "cus_123" });
    expect(global.fetch).toHaveBeenCalledWith(
      "http://api.test/subscriptions?customerId=cus_123",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("should send a GET to /subscriptions/:id for get", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });
    await client.get("sub_123");
    expect(global.fetch).toHaveBeenCalledWith(
      "http://api.test/subscriptions/sub_123",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("should send a POST to /subscriptions for create", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });
    await client.create({ customerId: "cus_123", planId: "plan_2" });
    expect(global.fetch).toHaveBeenCalledWith(
      "http://api.test/subscriptions",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ customerId: "cus_123", planId: "plan_2" }),
      }),
    );
  });

  it("should send a POST to /subscriptions/:id/cancel for cancel", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });
    await client.cancel("sub_123");
    expect(global.fetch).toHaveBeenCalledWith(
      "http://api.test/subscriptions/sub_123/cancel",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("should send a POST to /subscriptions/:id/change-plan for changePlan", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });
    await client.changePlan("sub_123", { newPlanId: "plan_3" });
    expect(global.fetch).toHaveBeenCalledWith(
      "http://api.test/subscriptions/sub_123/change-plan",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ newPlanId: "plan_3" }),
      }),
    );
  });
});
