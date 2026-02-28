import axios from "axios";
import type { CheckoutSession } from "@/types";
import { MOCK_SESSION } from "@/mocks/session";

const REVSTACK_API_URL =
  process.env.NEXT_PUBLIC_REVSTACK_API_URL || "https://api.revstack.dev";

export async function getCheckoutSession(
  token: string,
): Promise<{ data: CheckoutSession | null; error?: string }> {
  if (process.env.NODE_ENV === "development" || token.startsWith("test_")) {
    return { data: MOCK_SESSION };
  }

  try {
    const res = await axios.get<CheckoutSession>(
      `${REVSTACK_API_URL}/v1/checkout/sessions/${token}`,
    );
    return { data: res.data };
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        return { data: null, error: "Session not found" };
      }
      if (error.response?.status === 410) {
        return { data: null, error: "Session has expired" };
      }
    }
    return { data: null, error: "Failed to load checkout session" };
  }
}
