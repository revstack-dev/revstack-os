import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Command } from "commander";

// ── Mock auth ────────────────────────────────────────────────
vi.mock("../../src/utils/auth", () => ({
  setApiKey: vi.fn(),
}));

// ── Mock prompts ─────────────────────────────────────────────
vi.mock("prompts", () => ({
  default: vi.fn(),
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
import { setApiKey } from "../../src/utils/auth";
import prompts from "prompts";
import { loginCommand } from "../../src/commands/login";

const mockSetApiKey = vi.mocked(setApiKey);
const mockPrompts = vi.mocked(prompts);

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
  program.addCommand(loginCommand);
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

describe("login command", () => {
  it("stores the API key when user provides a valid key", async () => {
    mockPrompts.mockResolvedValue({ secretKey: "sk_test_mykey123" });
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const program = createTestProgram();
    await program.parseAsync(["node", "revstack", "login"], { from: "node" });

    expect(mockSetApiKey).toHaveBeenCalledWith("sk_test_mykey123");
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Authenticated successfully")
    );

    consoleSpy.mockRestore();
  });

  it("exits when user cancels the prompt", async () => {
    mockPrompts.mockResolvedValue({}); // empty → no secretKey
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const program = createTestProgram();

    await expect(
      program.parseAsync(["node", "revstack", "login"], { from: "node" })
    ).rejects.toThrow(ProcessExitError);

    expect(exitSpy).toHaveBeenCalledWith(0);
    expect(mockSetApiKey).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});
