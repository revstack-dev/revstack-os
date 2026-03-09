import { mapError } from "@/shared/error-map";
import {
  ProviderContext,
  CreatePaymentLinkInput,
  AsyncActionResult,
  normalizeCurrency,
  RevstackErrorCode,
} from "@revstackhq/providers-core";
import { getOrCreateClient } from "@/api/v1/client";
import Stripe from "stripe";

/**
 * Generates a shareable, standalone payment link for a one-off charge.
 * Used for manual overage collection or ad-hoc invoicing.
 *
 * @param ctx - The provider execution context.
 * @param input - The amount, currency, description, and optional customer/expiry details.
 * @returns An AsyncActionResult containing the generated payment link URL.
 */
export async function createPaymentLink(
  ctx: ProviderContext,
  input: CreatePaymentLinkInput,
): Promise<AsyncActionResult<string>> {
  if (!input.amount || !input.currency) {
    return {
      data: null,
      status: "failed",
      error: {
        code: RevstackErrorCode.InvalidInput,
        message: "Amount and currency are required.",
      },
    };
  }

  try {
    const stripe = getOrCreateClient(ctx.config.apiKey);

    const price = await stripe.prices.create({
      unit_amount: input.amount,
      currency: normalizeCurrency(input.currency, "lowercase"),
      product_data: {
        name: input.description,
      },
    });

    const linkParams: Stripe.PaymentLinkCreateParams = {
      line_items: [{ price: price.id, quantity: 1 }],
    };

    if (input.customerId) {
      linkParams.metadata = { customer_id: input.customerId };
    }

    const paymentLink = await stripe.paymentLinks.create(linkParams);

    return { data: paymentLink.url, status: "success" };
  } catch (error: any) {
    if (error.isRevstackError)
      return { data: null, status: "failed", error: error.errorPayload };
    return { data: null, status: "failed", error: mapError(error) };
  }
}
