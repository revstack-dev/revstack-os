import { useQuery } from "@tanstack/react-query";
import { getCheckoutSession } from "@/actions/get-session";
import type { CheckoutSession } from "@/types";

export function useGetSession(token: string) {
  return useQuery<{
    data: CheckoutSession | null;
    error?: string;
  }>({
    queryKey: ["checkout-session", token],
    queryFn: () => getCheckoutSession(token),
    enabled: !!token,
    staleTime: 5 * 60 * 1000, // 5 min
  });
}
