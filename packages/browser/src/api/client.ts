import type {
  RevstackConfig,
  CheckoutParams,
  IdentifyResponse,
  CheckoutSessionResponse,
} from "@/types";

const DEFAULT_API_URL = "https://app.revstack.dev";

/**
 * builds the identity headers for api calls
 */
async function buildHeaders(
  config: RevstackConfig,
  guestId: string | null
): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${config.publicKey}`,
  };

  try {
    const token = await config.getToken();
    if (token) {
      headers["X-Revstack-Auth"] = `Bearer ${token}`;
    }
  } catch {
    // no token available — continue as anonymous
  }

  if (guestId) {
    headers["X-Revstack-Guest-Id"] = guestId;
  }

  return headers;
}

/**
 * calls the identify endpoint to resolve entitlements
 */
export async function fetchEntitlements(
  config: RevstackConfig,
  guestId: string | null
): Promise<IdentifyResponse> {
  const baseUrl = config.apiUrl ?? DEFAULT_API_URL;
  const headers = await buildHeaders(config, guestId);

  const res = await fetch(`${baseUrl}/api/v1/identify`, {
    method: "POST",
    headers,
    body: JSON.stringify({}),
  });

  if (!res.ok) {
    throw new Error(
      `Revstack identify failed: ${res.status} ${res.statusText}`
    );
  }

  return res.json() as Promise<IdentifyResponse>;
}

/**
 * creates a checkout session and returns the session token
 */
export async function createCheckoutSession(
  config: RevstackConfig,
  guestId: string | null,
  params: CheckoutParams
): Promise<CheckoutSessionResponse> {
  const baseUrl = config.apiUrl ?? DEFAULT_API_URL;
  const headers = await buildHeaders(config, guestId);

  const res = await fetch(`${baseUrl}/api/v1/checkout/session`, {
    method: "POST",
    headers,
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    throw new Error(
      `Revstack checkout failed: ${res.status} ${res.statusText}`
    );
  }

  return res.json() as Promise<CheckoutSessionResponse>;
}
