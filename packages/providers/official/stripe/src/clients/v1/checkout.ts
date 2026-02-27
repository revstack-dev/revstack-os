import { mapSessionToCheckoutResult, mapStripeError } from "@/maps/mappers";
import {
  ProviderContext,
  CheckoutSessionInput,
  CheckoutSessionResult,
  BillingPortalInput,
  BillingPortalResult,
  SetupPaymentMethodInput,
  AsyncActionResult,
} from "@revstackhq/providers-core";
import Stripe from "stripe";
import { getOrCreateStripe, appendQueryParam } from "./shared";

/**
 * formats checkout line items for stripe depending on checkout mode.
 * - when a priceId is provided, uses the existing stripe price.
 * - otherwise builds inline price_data, adding recurring interval for subscriptions.
 */
function formatLineItems(
  items: CheckoutSessionInput["lineItems"],
  mode: CheckoutSessionInput["mode"],
): Stripe.Checkout.SessionCreateParams.LineItem[] {
  return items.map((item) => {
    if (item.priceId) {
      return {
        price: item.priceId,
        quantity: item.quantity,
      };
    }

    const priceData: Stripe.Checkout.SessionCreateParams.LineItem.PriceData = {
      currency: item.currency ? item.currency.toUpperCase() : "USD",
      product_data: {
        name: item.name || "Unknown",
        description: item.description || "",
        images: item.images || [],
      },
      unit_amount: item.amount,
      tax_behavior: item.taxRates ? "exclusive" : "unspecified",
    };

    if (mode === "subscription" && item.interval) {
      priceData.recurring = { interval: item.interval };
    }

    return {
      price_data: priceData,
      tax_rates: item.taxRates,
      quantity: item.quantity,
    };
  });
}

export async function createCheckoutSession(
  ctx: ProviderContext,
  input: CheckoutSessionInput,
): Promise<AsyncActionResult<CheckoutSessionResult>> {
  const stripe = getOrCreateStripe(ctx.config.apiKey);

  try {
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: input.mode,
      client_reference_id: input.clientReferenceId,
      ui_mode: "hosted",
      success_url: appendQueryParam(
        input.successUrl,
        "session_id={CHECKOUT_SESSION_ID}",
      ),
      cancel_url: input.cancelUrl,
      customer: input.customerId,
      customer_email: !input.customerId ? input.customerEmail : undefined,
      allow_promotion_codes: input.allowPromotionCodes,

      line_items: formatLineItems(input.lineItems, input.mode),
      metadata: {
        ...input.metadata,
        revstack_trace_id: ctx.traceId ?? null,
      },
    };

    const session = await stripe.checkout.sessions.create(sessionParams, {
      idempotencyKey: ctx.idempotencyKey,
    });

    return {
      data: mapSessionToCheckoutResult(session),
      status: "requires_action",
      nextAction: {
        type: "redirect",
        url: session.url!,
      },
    };
  } catch (error: unknown) {
    const mapped = mapStripeError(error);
    return {
      data: null,
      status: "failed",
      error: mapped,
    };
  }
}

export async function setupPaymentMethod(
  ctx: ProviderContext,
  input: SetupPaymentMethodInput,
): Promise<AsyncActionResult<CheckoutSessionResult>> {
  return createCheckoutSession(ctx, {
    mode: "setup",
    customerId: input.customerId,
    successUrl: input.returnUrl,
    cancelUrl: input.returnUrl,
    metadata: input.metadata,
    lineItems: [],
  });
}

export async function createBillingPortalSession(
  ctx: ProviderContext,
  input: BillingPortalInput,
): Promise<AsyncActionResult<BillingPortalResult>> {
  const stripe = getOrCreateStripe(ctx.config.apiKey);

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: input.customerId,
      return_url: input.returnUrl,
    });

    return {
      data: { url: session.url },
      status: "success",
    };
  } catch (error: unknown) {
    const mapped = mapStripeError(error);
    return {
      data: null,
      status: "failed",
      error: mapped,
    };
  }
}
