import axios from "axios";
import type { CheckoutSubmitPayload } from "@/types";

const REVSTACK_API_URL =
  process.env.NEXT_PUBLIC_REVSTACK_API_URL || "https://api.revstack.dev";

export async function submitCheckoutPayload(
  payload: CheckoutSubmitPayload,
  redirectUrl: string,
): Promise<{ redirectUrl: string }> {
  if (
    process.env.NODE_ENV === "development" ||
    payload.sessionId.startsWith("cs_test_")
  ) {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(
          "🚀 [REV Checkout] Submitting final payment payload:\n",
          JSON.stringify(payload, null, 2),
        );
        resolve({ redirectUrl });
      }, 400);
    });
  }

  try {
    const res = await axios.post<{ redirectUrl: string }>(
      `${REVSTACK_API_URL}/v1/checkout/sessions/${payload.sessionId}/submit`,
      payload,
    );
    return res.data;
  } catch (err: unknown) {
    if (axios.isAxiosError(err) && err.response?.data?.message) {
      throw new Error(err.response.data.message);
    }
    throw new Error("Failed to process payment application");
  }
}
