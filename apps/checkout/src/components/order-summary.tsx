import type { CheckoutTotals } from "@/types";

function formatPrice(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
  }).format(amount / 100);
}

export function OrderSummary({ totals }: { totals: CheckoutTotals }) {
  return (
    <div className="space-y-3 pt-4 border-t border-zinc-200 dark:border-white/10">
      <div className="flex justify-between text-sm">
        <span className="text-zinc-500 dark:text-zinc-400">Subtotal</span>
        <span className="text-zinc-900 dark:text-white font-medium">
          {formatPrice(totals.subtotal, totals.currency)}
        </span>
      </div>

      {totals.tax !== undefined && totals.tax > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-zinc-500 dark:text-zinc-400">Tax</span>
          <span className="text-zinc-900 dark:text-white font-medium">
            {formatPrice(totals.tax, totals.currency)}
          </span>
        </div>
      )}

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
        <span className="text-sm font-semibold text-zinc-900 dark:text-white">
          {formatPrice(totals.total, totals.currency)}
        </span>
      </div>
    </div>
  );
}
