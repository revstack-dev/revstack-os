import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock node:fs before importing auth ────────────────────────
vi.mock("node:fs", () => ({
  default: {
    existsSync: vi.fn(),
    mkdirSync: vi.fn(),
    writeFileSync: vi.fn(),
    readFileSync: vi.fn(),
    unlinkSync: vi.fn(),
  },
  existsSync: vi.fn(),
  mkdirSync: vi.fn(),
  writeFileSync: vi.fn(),
  readFileSync: vi.fn(),
  unlinkSync: vi.fn(),
}));

import fs from "node:fs";
import { setApiKey, getApiKey, clearApiKey } from "../../src/utils/auth.js";

const mockFs = vi.mocked(fs);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("auth", () => {
  describe("setApiKey", () => {
    it("creates the .revstack directory if it does not exist", () => {
      mockFs.existsSync.mockReturnValue(false);

      setApiKey("sk_test_abc123");

      expect(mockFs.mkdirSync).toHaveBeenCalledWith(
        expect.stringContaining(".revstack"),
        { recursive: true }
      );
    });

    it("writes credentials.json with the API key", () => {
      mockFs.existsSync.mockReturnValue(true);

      setApiKey("sk_test_abc123");

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining("credentials.json"),
        JSON.stringify({ apiKey: "sk_test_abc123" }, null, 2),
        "utf-8"
      );
    });

    it("skips mkdir if directory already exists", () => {
      mockFs.existsSync.mockReturnValue(true);

      setApiKey("sk_live_xyz");

      expect(mockFs.mkdirSync).not.toHaveBeenCalled();
    });
  });

  describe("getApiKey", () => {
    it("returns the stored API key", () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(
        JSON.stringify({ apiKey: "sk_test_stored" })
      );

      const key = getApiKey();

      expect(key).toBe("sk_test_stored");
    });

    it("returns null if credentials file does not exist", () => {
      mockFs.existsSync.mockReturnValue(false);

      const key = getApiKey();

      expect(key).toBeNull();
      expect(mockFs.readFileSync).not.toHaveBeenCalled();
    });

    it("returns null if the file contains invalid JSON", () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue("not valid json");

      const key = getApiKey();

      expect(key).toBeNull();
    });
  });

  describe("clearApiKey", () => {
    it("deletes the credentials file if it exists", () => {
      mockFs.existsSync.mockReturnValue(true);

      clearApiKey();

      expect(mockFs.unlinkSync).toHaveBeenCalledWith(
        expect.stringContaining("credentials.json")
      );
    });

    it("does nothing if credentials file does not exist", () => {
      mockFs.existsSync.mockReturnValue(false);

      clearApiKey();

      expect(mockFs.unlinkSync).not.toHaveBeenCalled();
    });
  });
});
