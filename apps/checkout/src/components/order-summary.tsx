import type { CheckoutTotals } from "@/types";
import { formatPrice } from "@/utils";

export function OrderSummary({ totals }: { totals: CheckoutTotals }) {
  return (
    <div className="space-y-3 pt-4 border-t border-zinc-200 dark:border-white/10">
      <div className="flex justify-between text-sm">
        <span className="text-zinc-500 dark:text-zinc-400">Subtotal</span>
        <span className="text-zinc-900 dark:text-white font-medium">
          {formatPrice(totals.subtotal, totals.currency)}
        </span>
      </div>

      {totals.discount !== undefined && totals.discount > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-zinc-500 dark:text-zinc-400">Discount</span>
          <span className="text-emerald-500 dark:text-emerald-400 font-medium">
            −{formatPrice(totals.discount, totals.currency)}
          </span>
        </div>
      )}

      <div className="flex justify-between pt-3 border-t border-zinc-200 dark:border-white/10 mt-4">
        <span className="text-sm font-semibold text-zinc-900 dark:text-white">
          Total
        </span>
        <div className="flex flex-col items-end gap-0.5">
          {totals.discount !== undefined && totals.discount > 0 && (
            <span className="text-xs text-zinc-400 dark:text-zinc-500 line-through">
              {formatPrice(totals.subtotal, totals.currency)}
            </span>
          )}
          <span className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">
            {formatPrice(totals.total ?? totals.subtotal, totals.currency)}
          </span>
        </div>
      </div>
    </div>
  );
}
