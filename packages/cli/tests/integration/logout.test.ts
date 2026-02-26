import { describe, it, expect, vi, beforeEach } from "vitest";
import { Command } from "commander";

// ── Mock auth ────────────────────────────────────────────────
vi.mock("../../src/utils/auth", () => ({
  getApiKey: vi.fn(),
  clearApiKey: vi.fn(),
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
import { getApiKey, clearApiKey } from "../../src/utils/auth";
import { logoutCommand } from "../../src/commands/logout";

const mockGetApiKey = vi.mocked(getApiKey);
const mockClearApiKey = vi.mocked(clearApiKey);

function createTestProgram(): Command {
  const program = new Command();
  program.exitOverride();
  program.addCommand(logoutCommand);
  return program;
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Tests ────────────────────────────────────────────────────

describe("logout command", () => {
  it("prints 'not logged in' when no credentials exist", async () => {
    mockGetApiKey.mockReturnValue(null);
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const program = createTestProgram();
    await program.parseAsync(["node", "revstack", "logout"], { from: "node" });

    expect(mockClearApiKey).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Not currently logged in")
    );

    consoleSpy.mockRestore();
  });

  it("clears credentials and prints success when logged in", async () => {
    mockGetApiKey.mockReturnValue("sk_test_valid123");
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const program = createTestProgram();
    await program.parseAsync(["node", "revstack", "logout"], { from: "node" });

    expect(mockClearApiKey).toHaveBeenCalledOnce();
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Successfully logged out")
    );

    consoleSpy.mockRestore();
  });
});
