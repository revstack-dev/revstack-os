import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Command } from "commander";

// ── Mock auth (using @/ alias to match push.ts imports) ──────
vi.mock("../../src/utils/auth", () => ({
  getApiKey: vi.fn(),
}));

// ── Mock config-loader ───────────────────────────────────────
vi.mock("../../src/utils/config-loader", () => ({
  loadLocalConfig: vi.fn(),
}));

// ── Mock prompts ─────────────────────────────────────────────
vi.mock("prompts", () => ({
  default: vi.fn(),
}));

// ── Mock @revstackhq/core ────────────────────────────────────
vi.mock("@revstackhq/core", () => {
  class RevstackValidationError extends Error {
    errors: string[];
    constructor(errors: string[]) {
      super("Validation failed");
      this.name = "RevstackValidationError";
      this.errors = errors;
    }
  }
  return {
    validateConfig: vi.fn(),
    RevstackConfigSchema: {
      parse: vi.fn().mockImplementation((config) => config),
    },
    RevstackValidationError,
  };
});

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
import { getApiKey } from "../../src/utils/auth";
import { loadLocalConfig } from "../../src/utils/config-loader";
import { pushCommand } from "../../src/commands/push";
import prompts from "prompts";

const mockGetApiKey = vi.mocked(getApiKey);
const mockLoadLocalConfig = vi.mocked(loadLocalConfig);
const mockPrompts = vi.mocked(prompts);

// ── Helpers ──────────────────────────────────────────────────

const SAMPLE_CONFIG = {
  features: { seats: { name: "Seats", type: "static", unit_type: "count" } },
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

// ── Capture process.exit via a thrown sentinel ────────────────

class ProcessExitError extends Error {
  code: number;
  constructor(code: number) {
    super(`process.exit(${code})`);
    this.code = code;
  }
}

/**
 * Creates a fresh commander wrapper around pushCommand's action
 * to avoid state leakage between tests.
 */
function createTestProgram(): Command {
  const program = new Command();
  program.exitOverride(); // Throw instead of calling process.exit
  program.addCommand(pushCommand);
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

describe("push command", () => {
  it("exits if the user is not authenticated", async () => {
    mockGetApiKey.mockReturnValue(null);

    const program = createTestProgram();

    await expect(
      program.parseAsync(["node", "revstack", "push"], { from: "node" }),
    ).rejects.toThrow(ProcessExitError);

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(mockLoadLocalConfig).not.toHaveBeenCalled();
  });

  it("diffs, confirms, and pushes successfully", async () => {
    mockGetApiKey.mockReturnValue("sk_test_valid123");
    mockLoadLocalConfig.mockResolvedValue(
      SAMPLE_CONFIG as Record<string, unknown>,
    );

    const diffResponse = {
      diff: [
        { action: "added", entity: "plan", id: "pro", message: "New plan" },
      ],
      canPush: true,
    };

    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(createFetchResponse(diffResponse))
      .mockResolvedValueOnce(createFetchResponse({ success: true }));

    vi.stubGlobal("fetch", mockFetch);
    mockPrompts.mockResolvedValue({ confirm: true });

    const program = createTestProgram();
    await program.parseAsync(["node", "revstack", "push"], { from: "node" });

    // Verify both diff and push endpoints were called
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch.mock.calls[0][0]).toContain("/api/v1/cli/diff");
    expect(mockFetch.mock.calls[1][0]).toContain("/api/v1/cli/push");
  });

  it("exits early when push is blocked (canPush: false)", async () => {
    mockGetApiKey.mockReturnValue("sk_test_valid123");
    mockLoadLocalConfig.mockResolvedValue(
      SAMPLE_CONFIG as Record<string, unknown>,
    );

    const diffResponse = {
      diff: [
        {
          action: "removed",
          entity: "plan",
          id: "default",
          message: "Cannot remove default plan",
        },
      ],
      canPush: false,
      blockedReason: "Cannot delete the default plan.",
    };

    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(createFetchResponse(diffResponse));

    vi.stubGlobal("fetch", mockFetch);

    const program = createTestProgram();

    await expect(
      program.parseAsync(["node", "revstack", "push"], { from: "node" }),
    ).rejects.toThrow(ProcessExitError);

    // Only diff called, push never reached
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
