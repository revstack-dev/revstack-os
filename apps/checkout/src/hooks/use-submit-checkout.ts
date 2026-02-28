import { useMutation } from "@tanstack/react-query";
import { submitCheckoutPayload } from "@/actions/submit-checkout";
import type { CheckoutSubmitPayload } from "@/types";

export function useSubmitCheckout() {
  return useMutation({
    mutationFn: ({
      payload,
      redirectUrl,
    }: {
      payload: CheckoutSubmitPayload;
      redirectUrl: string;
    }) => submitCheckoutPayload(payload, redirectUrl),
  });
}
