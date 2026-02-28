import {
  ArrowRight,
  CreditCard,
  Wallet,
  Landmark,
  Bitcoin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type {
  CheckoutSession,
  CheckoutLineItem,
  CheckoutSubmitPayload,
  PaymentOption,
} from "@/types";
import { type AppliedCouponInfo } from "@/hooks/use-checkout-coupon";
import { useSubmitCheckout } from "@/hooks/use-submit-checkout";
import { Loader2 } from "lucide-react";

function getIconForCategory(category: string) {
  switch (category) {
    case "card":
      return <CreditCard className="w-5 h-5 text-current" />;
    case "wallet":
    case "paypal":
      return <Wallet className="w-5 h-5 text-current" />;
    case "bank_transfer":
      return <Landmark className="w-5 h-5 text-current" />;
    case "crypto":
      return <Bitcoin className="w-5 h-5 text-current" />;
    default:
      return <CreditCard className="w-5 h-5 text-current" />;
  }
}

interface CheckoutPaymentMethodsProps {
  session: CheckoutSession;
  options: PaymentOption[];
  isExpired: boolean;
  selectedItems: CheckoutLineItem[];
  appliedCoupon: AppliedCouponInfo | null;
}

export function CheckoutPaymentMethods({
  session,
  options,
  isExpired,
  selectedItems,
  appliedCoupon,
}: CheckoutPaymentMethodsProps) {
  const { mutate: submitCheckout, isPending } = useSubmitCheckout();

  const handlePayment = (opt: PaymentOption) => {
    const payload: CheckoutSubmitPayload = {
      sessionId: session.id,
      providerSlug: opt.providerSlug,
      customerEmail: session.customerEmail,
      items: selectedItems,
      couponCode: appliedCoupon?.code,
    };

    submitCheckout(
      { payload, redirectUrl: opt.action.url },
      {
        onSuccess: (data) => {
          window.location.href = data.redirectUrl;
        },
      },
    );
  };

  if (isExpired) {
    return (
      <Button
        disabled
        className="w-full bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl py-3 px-4 flex items-center justify-center text-zinc-500"
      >
        Session Expired
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-3 relative">
      {isPending && (
        <div className="absolute inset-0 z-10 bg-white/50 dark:bg-[#111111]/50 backdrop-blur-sm rounded-xl flex items-center justify-center">
          <div className="flex items-center gap-2 text-(--brand) font-medium text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Redirecting...
          </div>
        </div>
      )}

      {options.map((opt) => (
        <button
          key={opt.id}
          onClick={() => handlePayment(opt)}
          disabled={isPending}
          className="group w-full bg-white dark:bg-white/5 hover:bg-zinc-50 dark:hover:bg-white/10 border border-zinc-200 dark:border-white/10 transition-all duration-200 rounded-xl py-4 px-5 flex items-center justify-between shadow-sm dark:shadow-none hover:border-(--brand) dark:hover:border-(--brand) hover:shadow-md cursor-pointer text-left disabled:opacity-50"
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center text-zinc-400 dark:text-zinc-500 group-hover:text-(--brand) transition-colors">
              {getIconForCategory(opt.category)}
            </div>
            <span className="font-medium text-zinc-900 dark:text-white text-sm">
              {opt.label}
            </span>
          </div>
          <ArrowRight className="w-4 h-4 text-zinc-400 dark:text-zinc-600 group-hover:text-(--brand) transition-colors" />
        </button>
      ))}
    </div>
  );
}
