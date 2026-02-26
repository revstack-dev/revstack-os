import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Command } from "commander";

// ── Mock auth ────────────────────────────────────────────────
vi.mock("../../src/utils/auth", () => ({
  getApiKey: vi.fn(),
}));

// ── Mock prompts ─────────────────────────────────────────────
vi.mock("prompts", () => ({
  default: vi.fn(),
}));

// ── Mock ora ─────────────────────────────────────────────────
const mockSpinner = {
  start: vi.fn().mockReturnThis(),
  succeed: vi.fn().mockReturnThis(),
  fail: vi.fn().mockReturnThis(),
};

vi.mock("ora", () => ({
  default: vi.fn(() => mockSpinner),
}));

// ── Mock chalk (no-op proxy) ─────────────────────────────────
vi.mock("chalk", () => {
  const passthrough = (s: string) => s;
  const handler: ProxyHandler<typeof passthrough> = {
    get: () => new Proxy(passthrough, handler),
    apply: (_t, _ctx, args: string[]) => args[0],
  };
  return { default: new Proxy(passthrough, handler) };
});

// ── Mock node:fs ─────────────────────────────────────────────
vi.mock("node:fs", () => ({
  default: {
    existsSync: vi.fn(),
    writeFileSync: vi.fn(),
    mkdirSync: vi.fn(),
  },
  existsSync: vi.fn(),
  writeFileSync: vi.fn(),
  mkdirSync: vi.fn(),
}));

// ── Imports (after mocks) ────────────────────────────────────
import { getApiKey } from "../../src/utils/auth";
import prompts from "prompts";
import fs from "node:fs";
import { pullCommand } from "../../src/commands/pull";

const mockGetApiKey = vi.mocked(getApiKey);
const mockPrompts = vi.mocked(prompts);
const mockFs = vi.mocked(fs);

// ── Helpers ──────────────────────────────────────────────────

const REMOTE_CONFIG = {
  features: {
    seats: { name: "Seats", type: "static", unit_type: "count" },
  },
  plans: {
    default: {
      name: "Default",
      is_default: true,
      is_public: false,
      type: "free",
      features: {},
    },
  },
};

function createFetchResponse(body: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    statusText: ok ? "OK" : "Bad Request",
    json: () => Promise.resolve(body),
    headers: new Headers(),
    redirected: false,
    type: "basic" as ResponseType,
    url: "",
    clone: () => createFetchResponse(body, ok, status),
    body: null,
    bodyUsed: false,
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    blob: () => Promise.resolve(new Blob()),
    formData: () => Promise.resolve(new FormData()),
    text: () => Promise.resolve(JSON.stringify(body)),
    bytes: () => Promise.resolve(new Uint8Array()),
  };
}

class ProcessExitError extends Error {
  code: number;
  constructor(code: number) {
    super(`process.exit(${code})`);
    this.code = code;
  }
}

function createTestProgram(): Command {
  const program = new Command();
  program.exitOverride();
  program.addCommand(pullCommand);
  return program;
}

let exitSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  vi.clearAllMocks();
  exitSpy = vi
    .spyOn(process, "exit")
    .mockImplementation((code?: string | number | null | undefined) => {
      throw new ProcessExitError(Number(code ?? 0));
    });
});

afterEach(() => {
  exitSpy.mockRestore();
  vi.unstubAllGlobals();
});

// ── Tests ────────────────────────────────────────────────────

describe("pull command", () => {
  it("exits if the user is not authenticated", async () => {
    mockGetApiKey.mockReturnValue(null);

    const program = createTestProgram();

    await expect(
      program.parseAsync(["node", "revstack", "pull"], { from: "node" }),
    ).rejects.toThrow(ProcessExitError);

    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("exits when the API returns an error", async () => {
    mockGetApiKey.mockReturnValue("sk_test_valid123");

    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(createFetchResponse({}, false, 500));

    vi.stubGlobal("fetch", mockFetch);

    const program = createTestProgram();

    await expect(
      program.parseAsync(["node", "revstack", "pull"], { from: "node" }),
    ).rejects.toThrow(ProcessExitError);

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(mockSpinner.fail).toHaveBeenCalled();
  });

  it("pulls config and writes file after user confirmation", async () => {
    mockGetApiKey.mockReturnValue("sk_test_valid123");
    mockFs.existsSync.mockImplementation((p) =>
      String(p).endsWith("revstack.config.ts"),
    ); // config file exists

    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(createFetchResponse(REMOTE_CONFIG));

    vi.stubGlobal("fetch", mockFetch);
    mockPrompts.mockResolvedValue({ confirm: true });

    const program = createTestProgram();
    await program.parseAsync(["node", "revstack", "pull"], { from: "node" });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch.mock.calls[0][0]).toContain("/api/v1/cli/pull");
    expect(mockFs.mkdirSync).toHaveBeenCalledWith(
      expect.stringContaining("revstack"),
      { recursive: true },
    );
    expect(mockFs.writeFileSync).toHaveBeenCalledTimes(3);
    expect(mockFs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining("features.ts"),
      expect.stringContaining("defineFeature"),
      "utf-8",
    );
    expect(mockFs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining("plans.ts"),
      expect.stringContaining("definePlan"),
      "utf-8",
    );
    expect(mockFs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining("revstack.config.ts"),
      expect.stringContaining("defineConfig"),
      "utf-8",
    );
  });

  it("cancels without writing when user declines", async () => {
    mockGetApiKey.mockReturnValue("sk_test_valid123");
    mockFs.existsSync.mockReturnValue(true);

    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(createFetchResponse(REMOTE_CONFIG));

    vi.stubGlobal("fetch", mockFetch);
    mockPrompts.mockResolvedValue({ confirm: false });

    const program = createTestProgram();
    await program.parseAsync(["node", "revstack", "pull"], { from: "node" });

    expect(mockFs.writeFileSync).not.toHaveBeenCalled();
    expect(mockFs.mkdirSync).not.toHaveBeenCalled();
  });

  it("skips confirmation when config file does not exist", async () => {
    mockGetApiKey.mockReturnValue("sk_test_valid123");
    mockFs.existsSync.mockReturnValue(false); // no existing config

    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(createFetchResponse(REMOTE_CONFIG));

    vi.stubGlobal("fetch", mockFetch);

    const program = createTestProgram();
    await program.parseAsync(["node", "revstack", "pull"], { from: "node" });

    // Prompts never called since file doesn't exist
    expect(mockPrompts).not.toHaveBeenCalled();
    // File was written directly
    expect(mockFs.writeFileSync).toHaveBeenCalledTimes(3);
  });
});
