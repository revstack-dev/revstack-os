import { describe, it, expect, vi, beforeEach } from "vitest";
import { CustomersClient } from "../../src/modules/customers";

describe("CustomersClient", () => {
  const config = {
    secretKey: "sk_test",
    baseUrl: "http://api.test",
    timeout: 1000,
  };
  let client: CustomersClient;

  beforeEach(() => {
    client = new CustomersClient(config);
    global.fetch = vi.fn();
  });

  it("should send a POST to /customers for identify", async () => {
    const mockResponse = { id: "cus_123", email: "test@example.com" };
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await client.identify({
      customerId: "cus_123",
      email: "test@example.com",
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "http://api.test/customers",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          customerId: "cus_123",
          email: "test@example.com",
        }),
      }),
    );
    expect(result).toEqual(mockResponse);
  });

  it("should send a GET to /customers/:id for get", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });
    await client.get("cus_abc");
    expect(global.fetch).toHaveBeenCalledWith(
      "http://api.test/customers/cus_abc",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("should send a GET to /customers with query params for list", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });
    await client.list({ limit: 10, offset: 5 });
    expect(global.fetch).toHaveBeenCalledWith(
      "http://api.test/customers?limit=10&offset=5",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("should send a PATCH to /customers/:id for update", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });
    await client.update("cus_abc", { email: "new@example.com" });
    expect(global.fetch).toHaveBeenCalledWith(
      "http://api.test/customers/cus_abc",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ email: "new@example.com" }),
      }),
    );
  });

  it("should send a DELETE to /customers/:id for delete", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });
    await client.delete("cus_abc");
    expect(global.fetch).toHaveBeenCalledWith(
      "http://api.test/customers/cus_abc",
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});
