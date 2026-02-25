import type { RevstackConfig } from "@/types";

/**
 * resolves a guest id for anonymous users
 * priority: custom resolver > fingerprintjs > null
 */
export async function resolveGuestId(
  config: RevstackConfig
): Promise<string | null> {
  if (config.disableFingerprint) return null;

  // use custom resolver if provided
  if (config.getGuestId) {
    try {
      return await config.getGuestId();
    } catch {
      return null;
    }
  }

  // dynamic import to avoid bundling fingerprintjs when unused
  // uses Function constructor so tsc doesn't try to resolve the module
  try {
    const mod = await (Function(
      'return import("@fingerprintjs/fingerprintjs")'
    )() as Promise<{
      load: () => Promise<{ get: () => Promise<{ visitorId: string }> }>;
    }>);
    const agent = await mod.load();
    const result = await agent.get();
    return result.visitorId;
  } catch {
    // fingerprintjs not installed or failed — non-fatal
    return null;
  }
}
