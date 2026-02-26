import { describe, it, expect, vi, beforeEach } from "vitest";
import { InvoicesClient } from "../../src/modules/invoices";

describe("InvoicesClient", () => {
  const config = {
    secretKey: "sk_test",
    baseUrl: "http://api.test",
    timeout: 1000,
  };
  let client: InvoicesClient;

  beforeEach(() => {
    client = new InvoicesClient(config);
    global.fetch = vi.fn();
  });

  it("should send a GET to /invoices for list", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });
    await client.list({ limit: 10, status: "paid" });
    expect(global.fetch).toHaveBeenCalledWith(
      "http://api.test/invoices?limit=10&status=paid",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("should send a GET to /invoices/:id for get", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });
    await client.get("inv_123");
    expect(global.fetch).toHaveBeenCalledWith(
      "http://api.test/invoices/inv_123",
      expect.objectContaining({ method: "GET" }),
    );
  });
});
