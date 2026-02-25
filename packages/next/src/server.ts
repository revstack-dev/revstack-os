import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Entitlement } from "@revstackhq/browser";

// ── Config ───────────────────────────────────────────────────────────

export interface RevstackServerConfig {
  /** project secret key — authenticates server-side API calls */
  secretKey: string;
  /** api base url (defaults to https://app.revstack.dev) */
  apiUrl?: string;
  /** optional route to redirect to when access is denied (used by requireEntitlement) */
  redirectTo?: string;
}

// ── Types ────────────────────────────────────────────────────────────

interface IdentifyResponse {
  entitlements: Entitlement[];
}

export type { Entitlement };

// ── Internal constants ───────────────────────────────────────────────

const DEFAULT_API_URL = "https://app.revstack.dev";

// ── Identity helper ──────────────────────────────────────────────────

/**
 * Extracts the end-user's identity from the incoming request headers.
 *
 * In Next.js 15, `headers()` is async and must be awaited.
 *
 * Returns a `HeadersInit` object containing:
 * - `X-Revstack-Auth` — the user's auth token (if present)
 * - `X-Revstack-Guest-Id` — the guest fingerprint (if present)
 */
async function getIdentityHeaders(): Promise<Record<string, string>> {
  const requestHeaders = await headers();
  const identityHeaders: Record<string, string> = {};

  const authToken =
    requestHeaders.get("authorization") ??
    requestHeaders.get("x-revstack-auth");

  if (authToken) {
    identityHeaders["X-Revstack-Auth"] = authToken;
  }

  const guestId = requestHeaders.get("x-revstack-guest-id");

  if (guestId) {
    identityHeaders["X-Revstack-Guest-Id"] = guestId;
  }

  return identityHeaders;
}

// ── Public API ───────────────────────────────────────────────────────

/**
 * Server-side entitlement check.
 *
 * Authenticates as the merchant via `secretKey`, while forwarding the
 * end-user's identity headers so the backend resolves *their* entitlements.
 *
 * Must be called within a React Server Component or Server Action.
 */
export async function getEntitlement(
  key: string,
  config: RevstackServerConfig
): Promise<Entitlement> {
  const baseUrl = config.apiUrl ?? DEFAULT_API_URL;
  const identityHeaders = await getIdentityHeaders();

  const response = await fetch(`${baseUrl}/api/v1/identify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.secretKey}`,
      ...identityHeaders,
    },
    body: JSON.stringify({}),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `[@revstackhq/next] Identify request failed: ${response.status} ${response.statusText}`
    );
  }

  const data = (await response.json()) as IdentifyResponse;

  return (
    data.entitlements.find((entitlement) => entitlement.key === key) ?? {
      key,
      hasAccess: false,
    }
  );
}

/**
 * Server-side entitlement gate.
 *
 * Calls `getEntitlement` and, if the user does not have access:
 * - redirects to `config.redirectTo` (if provided), or
 * - throws an error.
 *
 * Must be called within a React Server Component or Server Action.
 */
export async function requireEntitlement(
  key: string,
  config: RevstackServerConfig
): Promise<Entitlement> {
  const entitlement = await getEntitlement(key, config);

  if (!entitlement.hasAccess) {
    if (config.redirectTo) {
      redirect(config.redirectTo);
    }

    throw new Error(
      `[@revstackhq/next] Access denied: missing entitlement "${key}".`
    );
  }

  return entitlement;
}

/**
 * Server-side usage tracking.
 *
 * Reports metered usage (e.g. API calls, credits consumed) against a
 * feature key for the current end-user.
 *
 * Throws if the request fails (e.g. the user has exhausted their quota).
 *
 * Must be called within a React Server Component or Server Action.
 */
export async function trackUsage(
  key: string,
  amount: number,
  config: RevstackServerConfig
): Promise<void> {
  const baseUrl = config.apiUrl ?? DEFAULT_API_URL;
  const identityHeaders = await getIdentityHeaders();

  const response = await fetch(`${baseUrl}/api/v1/usage/track`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.secretKey}`,
      ...identityHeaders,
    },
    body: JSON.stringify({ key, amount }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `[@revstackhq/next] Usage tracking failed for "${key}": ${response.status} ${response.statusText}`
    );
  }
}

// ── Route Handler utilities ──────────────────────────────────────────

/** Standard Next.js App Router route handler signature */
type RouteHandler = (
  req: Request,
  context: { params: Promise<Record<string, string>> }
) => Promise<Response> | Response;

/**
 * Higher-order function that wraps a Next.js Route Handler with
 * fixed-cost metering.
 *
 * Deducts `amount` units from the user's `key` quota *before* the
 * handler runs. If the user lacks sufficient credits, returns a
 * 402 Payment Required response without invoking the handler.
 *
 * @example
 * ```ts
 * // app/api/generate/route.ts
 * import { withMetering } from "@revstackhq/next/server";
 *
 * const config = { secretKey: process.env.REVSTACK_SECRET_KEY! };
 *
 * export const POST = withMetering("ai-credits", 1, config, async (req) => {
 *   const body = await req.json();
 *   const result = await generateWithAI(body.prompt);
 *   return Response.json({ result });
 * });
 * ```
 */
export function withMetering(
  key: string,
  amount: number,
  config: RevstackServerConfig,
  handler: RouteHandler
): RouteHandler {
  return async (req, context) => {
    try {
      await trackUsage(key, amount, config);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Unknown metering error";

      return Response.json(
        { error: "Payment Required", details: message },
        { status: 402 }
      );
    }

    return handler(req, context);
  };
}
