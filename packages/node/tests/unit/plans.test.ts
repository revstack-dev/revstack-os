import { describe, it, expect, vi, beforeEach } from "vitest";
import { PlansClient } from "../../src/modules/plans";

describe("PlansClient", () => {
  const config = {
    secretKey: "sk_test",
    baseUrl: "http://api.test",
    timeout: 1000,
  };
  let client: PlansClient;

  beforeEach(() => {
    client = new PlansClient(config);
    global.fetch = vi.fn();
  });

  it("should send a GET to /plans for list", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });
    await client.list({ status: "active" });
    expect(global.fetch).toHaveBeenCalledWith(
      "http://api.test/plans?status=active",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("should send a GET to /plans/:id for get", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });
    await client.get("plan_123");
    expect(global.fetch).toHaveBeenCalledWith(
      "http://api.test/plans/plan_123",
      expect.objectContaining({ method: "GET" }),
    );
  });
});
