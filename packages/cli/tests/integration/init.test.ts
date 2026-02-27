import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Command } from "commander";

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

// ── Mock node:child_process ────────────────────────────────────
vi.mock("node:child_process", () => ({
  spawnSync: vi.fn().mockReturnValue({ status: 0, error: null }),
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

// ── Imports (after mocks) ────────────────────────────────────
import fs from "node:fs";
import { initCommand } from "../../src/commands/init";

const mockFs = vi.mocked(fs);

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
  program.addCommand(initCommand);
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
});

// ── Tests ────────────────────────────────────────────────────

describe("init command", () => {
  it("creates revstack.config.ts when it does not exist", async () => {
    mockFs.existsSync.mockReturnValue(false);
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const program = createTestProgram();
    await program.parseAsync(["node", "revstack", "init"], { from: "node" });

    expect(mockFs.mkdirSync).toHaveBeenCalledWith(
      expect.stringContaining("revstack"),
      { recursive: true },
    );
    expect(mockFs.writeFileSync).toHaveBeenCalledTimes(5);
    expect(mockFs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining("features.ts"),
      expect.stringContaining("defineFeature"),
      "utf-8",
    );
    expect(mockFs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining("addons.ts"),
      expect.stringContaining("defineAddon"),
      "utf-8",
    );
    expect(mockFs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining("plans.ts"),
      expect.stringContaining("definePlan"),
      "utf-8",
    );
    expect(mockFs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining("index.ts"),
      expect.stringContaining("defineConfig"),
      "utf-8",
    );
    expect(mockFs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining("revstack.config.ts"),
      expect.stringContaining("import config from"),
      "utf-8",
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Created revstack config structure"),
    );

    consoleSpy.mockRestore();
  });

  it("exits with code 1 when revstack.config.ts already exists", async () => {
    mockFs.existsSync.mockReturnValue(true);
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const program = createTestProgram();

    await expect(
      program.parseAsync(["node", "revstack", "init"], { from: "node" }),
    ).rejects.toThrow(ProcessExitError);

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(mockFs.writeFileSync).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});
