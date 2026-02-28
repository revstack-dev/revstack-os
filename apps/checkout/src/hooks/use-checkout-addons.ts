import { useState } from "react";
import type { CheckoutSession } from "@/types";

export function useCheckoutAddons(session: CheckoutSession) {
  const [selectedAddonSlugs, setSelectedAddonSlugs] = useState<Set<string>>(
    () => {
      const initial = new Set<string>();
      const initialNames = session.items.map((li) => li.name);
      session.availableAddons?.forEach((addon) => {
        if (initialNames.includes(addon.name)) {
          initial.add(addon.slug);
        }
      });
      return initial;
    },
  );

  const toggleAddon = (slug: string) => {
    setSelectedAddonSlugs((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  const selectedAddonsArray = (session.availableAddons || []).filter((a) =>
    selectedAddonSlugs.has(a.slug),
  );

  return {
    selectedAddonSlugs,
    toggleAddon,
    selectedAddonsArray,
  };
}
