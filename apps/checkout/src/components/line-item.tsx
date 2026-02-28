import type { CheckoutLineItem } from "@/types";
import { formatPrice } from "@/utils";

function getBillingFrequencyText(item: CheckoutLineItem) {
  if (item.billingType === "one_time") return null;
  switch (item.billing_interval) {
    case "monthly":
      return "Monthly Subscription";
    case "yearly":
      return "Yearly Subscription";
    case "quarterly":
      return "Quarterly Subscription";
    default:
      return "Subscription";
  }
}

export function LineItem({
  item,
  compact = false,
}: {
  item: CheckoutLineItem;
  compact?: boolean;
}) {
  return (
    <div
      className={`flex items-start gap-3 w-full ${compact ? "py-1" : "py-4"}`}
    >
      {item.image && !compact && (
        <div
          className="w-12 h-12 rounded-lg border border-zinc-200 dark:border-white/8 bg-cover bg-center shrink-0 bg-white dark:bg-[#111111]"
          style={{ backgroundImage: `url(${item.image})` }}
        />
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p
              className={`font-medium text-zinc-900 dark:text-white truncate ${compact ? "text-xs" : "text-sm"}`}
            >
              {item.name}
            </p>
            {item.description && !compact && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-2">
                {item.description}
              </p>
            )}
            {item.type === "product" && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                {getBillingFrequencyText(item)}
              </p>
            )}
          </div>
          <p
            className={`font-medium text-zinc-900 dark:text-white shrink-0 ${compact ? "text-xs" : "text-sm"}`}
          >
            {formatPrice(item.unitAmount * item.quantity, item.currency)}
            {item.billingType === "recurring" && item.billing_interval && (
              <span className="font-normal text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                {" / "}
                {item.billing_interval === "monthly"
                  ? "mo"
                  : item.billing_interval === "yearly"
                    ? "yr"
                    : item.billing_interval === "quarterly"
                      ? "qt"
                      : item.billing_interval}
              </span>
            )}
          </p>
        </div>
        {item.quantity > 1 && !compact && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Qty: {item.quantity} × {formatPrice(item.unitAmount, item.currency)}
          </p>
        )}
      </div>
    </div>
  );
}
