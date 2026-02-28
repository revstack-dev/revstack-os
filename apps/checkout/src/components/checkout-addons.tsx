import type { CheckoutSession } from "@/types";
import { Package } from "lucide-react";

interface CheckoutAddonsProps {
  availableAddons: CheckoutSession["availableAddons"];
  selectedAddonSlugs: Set<string>;
  onToggleAddon: (slug: string) => void;
}

export function CheckoutAddons({
  availableAddons,
  selectedAddonSlugs,
  onToggleAddon,
}: CheckoutAddonsProps) {
  if (!availableAddons || availableAddons.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Package className="w-4 h-4 text-(--brand)" />
        <h3 className="text-xs font-semibold text-(--brand) uppercase tracking-widest">
          Customize Your Plan
        </h3>
      </div>
      <div className="flex flex-col gap-3 max-h-60 overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-zinc-300 dark:[&::-webkit-scrollbar-thumb]:bg-zinc-800 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full">
        {availableAddons.map((addon) => {
          const isSelected = selectedAddonSlugs.has(addon.slug);
          return (
            <div
              key={addon.slug}
              onClick={() => onToggleAddon(addon.slug)}
              className={`cursor-pointer transition-all duration-200 border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                isSelected
                  ? "bg-(--brand)/5 border-(--brand)"
                  : "bg-zinc-50 dark:bg-white/2 border-zinc-200 dark:border-white/5 hover:border-zinc-300 dark:hover:border-white/10"
              }`}
            >
              <div className="flex flex-col gap-0.5 max-w-[70%]">
                <span className="text-sm font-medium text-zinc-900 dark:text-white">
                  {addon.name}
                </span>
                {addon.description && (
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 leading-snug">
                    {addon.description}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 self-start sm:self-auto min-w-max">
                <div className="flex flex-col items-end">
                  <span className="text-sm font-medium text-zinc-900 dark:text-white">
                    +
                    {(addon.unitAmount / 100).toLocaleString("en-US", {
                      style: "currency",
                      currency: addon.currency,
                    })}
                    {addon.billing_interval && (
                      <span className="text-xs text-zinc-500 font-normal ml-0.5">
                        /
                        {addon.billing_interval === "monthly"
                          ? "mo"
                          : addon.billing_interval === "yearly"
                            ? "yr"
                            : addon.billing_interval}
                      </span>
                    )}
                  </span>
                </div>
                <div
                  className={`w-5 h-5 shrink-0 rounded-full border flex items-center justify-center transition-colors ${
                    isSelected
                      ? "bg-(--brand) border-(--brand)"
                      : "bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600"
                  }`}
                >
                  {isSelected && (
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
