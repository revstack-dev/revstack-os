import axios from "axios";
import { type AppliedCouponInfo } from "@/hooks/use-checkout-coupon";

const REVSTACK_API_URL =
  process.env.NEXT_PUBLIC_REVSTACK_API_URL || "https://api.revstack.dev";

export async function applyCouponToSession(
  sessionId: string,
  couponCode: string,
): Promise<AppliedCouponInfo> {
  if (process.env.NODE_ENV === "development") {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (couponCode === "WELCOME20") {
          resolve({
            code: "WELCOME20",
            type: "percent",
            value: 20,
          });
        } else if (couponCode === "MINUS10") {
          resolve({
            code: "MINUS10",
            type: "amount",
            value: 1000,
          });
        } else {
          reject(new Error("Invalid or expired coupon code"));
        }
      }, 600);
    });
  }

  try {
    const res = await axios.post<AppliedCouponInfo>(
      `${REVSTACK_API_URL}/v1/checkout/sessions/${sessionId}/apply_coupon`,
      { couponCode },
    );
    return res.data;
  } catch (err: unknown) {
    if (axios.isAxiosError(err) && err.response?.data?.message) {
      throw new Error(err.response.data.message);
    }
    throw new Error("Failed to apply coupon");
  }
}
