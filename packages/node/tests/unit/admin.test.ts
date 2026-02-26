import { describe, it, expect, vi, beforeEach } from "vitest";
import { AdminEntitlementsClient } from "../../src/modules/admin/entitlements";
import { AdminEnvironmentsClient } from "../../src/modules/admin/environments";
import { AdminIntegrationsClient } from "../../src/modules/admin/integrations";
import { AdminPlansClient } from "../../src/modules/admin/plans";

describe("Admin Clients", () => {
  const config = {
    secretKey: "sk_test",
    baseUrl: "http://api.test",
    timeout: 1000,
  };

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  describe("AdminEntitlementsClient", () => {
    let client: AdminEntitlementsClient;
    beforeEach(() => {
      client = new AdminEntitlementsClient(config);
    });

    it("should send GET to /admin/entitlements for list", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });
      await client.list({ limit: 10 });
      expect(global.fetch).toHaveBeenCalledWith(
        "http://api.test/admin/entitlements?limit=10",
        expect.objectContaining({ method: "GET" }),
      );
    });

    it("should send GET to /admin/entitlements/:id for get", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });
      await client.get("ent_123");
      expect(global.fetch).toHaveBeenCalledWith(
        "http://api.test/admin/entitlements/ent_123",
        expect.objectContaining({ method: "GET" }),
      );
    });

    it("should send POST to /admin/entitlements for create", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });
      await client.create({ name: "API", slug: "api", type: "metered" });
      expect(global.fetch).toHaveBeenCalledWith(
        "http://api.test/admin/entitlements",
        expect.objectContaining({ method: "POST" }),
      );
    });

    it("should send PATCH to /admin/entitlements/:id for update", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });
      await client.update("ent_123", { name: "New API" });
      expect(global.fetch).toHaveBeenCalledWith(
        "http://api.test/admin/entitlements/ent_123",
        expect.objectContaining({ method: "PATCH" }),
      );
    });

    it("should send DELETE to /admin/entitlements/:id for delete", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });
      await client.delete("ent_123");
      expect(global.fetch).toHaveBeenCalledWith(
        "http://api.test/admin/entitlements/ent_123",
        expect.objectContaining({ method: "DELETE" }),
      );
    });

    it("should send PUT to /admin/entitlements for upsert", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });
      await client.upsert({ name: "API", slug: "api", type: "metered" });
      expect(global.fetch).toHaveBeenCalledWith(
        "http://api.test/admin/entitlements",
        expect.objectContaining({ method: "PUT" }),
      );
    });
  });

  describe("AdminEnvironmentsClient", () => {
    let client: AdminEnvironmentsClient;
    beforeEach(() => {
      client = new AdminEnvironmentsClient(config);
    });

    it("should send GET to /admin/environments for list", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });
      await client.list();
      expect(global.fetch).toHaveBeenCalledWith(
        "http://api.test/admin/environments",
        expect.objectContaining({ method: "GET" }),
      );
    });

    it("should send POST to /admin/environments/:id/rotate-keys for rotateKeys", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });
      await client.rotateKeys("env_123");
      expect(global.fetch).toHaveBeenCalledWith(
        "http://api.test/admin/environments/env_123/rotate-keys",
        expect.objectContaining({ method: "POST" }),
      );
    });
  });

  describe("AdminIntegrationsClient", () => {
    let client: AdminIntegrationsClient;
    beforeEach(() => {
      client = new AdminIntegrationsClient(config);
    });

    it("should send GET to /admin/integrations for list", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });
      await client.list({ provider: "stripe" });
      expect(global.fetch).toHaveBeenCalledWith(
        "http://api.test/admin/integrations?provider=stripe",
        expect.objectContaining({ method: "GET" }),
      );
    });

    it("should send GET to /admin/integrations/:id/events for listEvents", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });
      await client.listEvents("int_123", { status: "ok" });
      expect(global.fetch).toHaveBeenCalledWith(
        "http://api.test/admin/integrations/int_123/events?status=ok",
        expect.objectContaining({ method: "GET" }),
      );
    });

    it("should send GET to /admin/integrations/:id/metrics for listMetrics", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });
      await client.listMetrics("int_123", { from: "2026-01-01" });
      expect(global.fetch).toHaveBeenCalledWith(
        "http://api.test/admin/integrations/int_123/metrics?from=2026-01-01",
        expect.objectContaining({ method: "GET" }),
      );
    });
  });

  describe("AdminPlansClient", () => {
    let client: AdminPlansClient;
    beforeEach(() => {
      client = new AdminPlansClient(config);
    });

    it("should send GET to /admin/plans for list", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });
      await client.list();
      expect(global.fetch).toHaveBeenCalledWith(
        "http://api.test/admin/plans",
        expect.objectContaining({ method: "GET" }),
      );
    });

    it("should send PUT to /admin/plans for upsert", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });
      await client.upsert({ name: "Pro", slug: "pro" });
      expect(global.fetch).toHaveBeenCalledWith(
        "http://api.test/admin/plans",
        expect.objectContaining({ method: "PUT" }),
      );
    });
  });
});
