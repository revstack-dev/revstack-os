import { useState } from "react";
import type { CheckoutSession } from "@/types";
import { useMutation } from "@tanstack/react-query";
import { applyCouponToSession } from "@/actions/apply-coupon";

export type AppliedCouponInfo = {
  code: string;
  type: "percent" | "amount";
  value: number;
};

export function useCheckoutCoupon(session: CheckoutSession) {
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCouponInfo | null>(
    session.appliedCoupon || null,
  );
  const [error, setError] = useState<string | null>(null);

  const applyMutation = useMutation({
    mutationFn: (code: string) => applyCouponToSession(session.id, code),
    onSuccess: (data) => {
      setAppliedCoupon(data);
      setError(null);
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const applyCoupon = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const code = couponCode.trim().toUpperCase();
    if (!code) {
      setError("Please enter a coupon code");
      return;
    }
    setError(null);
    applyMutation.mutate(code);
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setError(null);
  };

  return {
    couponCode,
    setCouponCode,
    appliedCoupon,
    isApplying: applyMutation.isPending,
    error,
    applyCoupon,
    removeCoupon,
  };
}
