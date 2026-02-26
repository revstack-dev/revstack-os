import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock jiti ─────────────────────────────────────────────────
const mockImport = vi.fn();

vi.mock("jiti", () => ({
  createJiti: vi.fn(() => ({
    import: mockImport,
  })),
}));

// ── Mock chalk to avoid ANSI in test output ───────────────────
vi.mock("chalk", () => ({
  default: {
    red: (s: string) => s,
    dim: (s: string) => s,
    bold: (s: string) => s,
  },
}));

// ── Mock process.exit ────────────────────────────────────────
const mockExit = vi
  .spyOn(process, "exit")
  .mockImplementation(() => undefined as never);

import { loadLocalConfig } from "../../src/utils/config-loader.js";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("config-loader", () => {
  describe("loadLocalConfig", () => {
    it("extracts the default export from the module", async () => {
      const sampleConfig = {
        features: {
          seats: { name: "Seats", type: "static", unit_type: "count" },
        },
        plans: {},
      };

      mockImport.mockResolvedValue({ default: sampleConfig });

      const result = await loadLocalConfig("/fake/project");

      expect(result).toEqual(sampleConfig);
    });

    it("falls back to the module itself if no default export", async () => {
      const sampleConfig = { features: {}, plans: {} };

      mockImport.mockResolvedValue(sampleConfig);

      const result = await loadLocalConfig("/fake/project");

      expect(result).toEqual(sampleConfig);
    });

    it("sanitizes non-serializable values (functions stripped)", async () => {
      const configWithFn = {
        default: {
          features: {},
          plans: {},
          helper: () => "should be stripped",
        },
      };

      mockImport.mockResolvedValue(configWithFn);

      const result = await loadLocalConfig("/fake/project");

      expect(result).not.toHaveProperty("helper");
      expect(result).toEqual({ features: {}, plans: {} });
    });

    it("calls process.exit(1) if the config file is not found", async () => {
      const error: NodeJS.ErrnoException = new Error("Cannot find module");
      error.code = "MODULE_NOT_FOUND";
      mockImport.mockRejectedValue(error);

      await loadLocalConfig("/fake/project");

      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it("calls process.exit(1) on syntax errors", async () => {
      mockImport.mockRejectedValue(new SyntaxError("Unexpected token"));

      await loadLocalConfig("/fake/project");

      expect(mockExit).toHaveBeenCalledWith(1);
    });
  });
});
