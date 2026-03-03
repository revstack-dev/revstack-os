import { mapSessionToCheckoutResult } from "@/api/v1/mappers";
import {
  ProviderContext,
  CheckoutSessionInput,
  CheckoutSessionResult,
  BillingPortalInput,
  BillingPortalResult,
  AsyncActionResult,
  RevstackCurrency,
} from "@revstackhq/providers-core";
import Stripe from "stripe";
import { getOrCreateClient, appendQueryParam } from "@/api/v1/client";
import { mapError } from "@/shared/error-map";
import { currencyMap } from "@/shared/currency-map";

/**
 * Formats checkout line items for Stripe depending on checkout mode.
 * - When a priceId is provided, uses the existing Stripe price.
 * - Otherwise explicitly builds inline price_data temporarily, forcibly
 *   synthesizing recurring intervals natively for subscriptions.
 *
 * @param items - Array of unformatted Revstack line items.
 * @param mode - Operational Checkout mode ('payment' | 'subscription' | 'setup').
 * @returns An array of thoroughly formatted native Stripe SessionCreateParams.LineItem objects.
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
      currency: currencyMap[item.currency as RevstackCurrency] || "USD",
      product_data: {
        name: item.name || "Unknown",
        description: item.description || undefined,
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

/**
 * Initializes a secure unified Stripe Checkout Session explicitly natively bridging
 * complex fractional product configurations safely via inline pricing definitions or mapped Price IDs.
 * Dynamically binds trace idempotency reliably natively.
 *
 * @param ctx - The core provider execution context tracking secure trace spans globally.
 * @param input - Strict payload formally passing line items, routing URLs, and session mode specifications.
 * @returns An AsyncActionResult resolving definitively to a redirectable CheckoutSessionResult structure securely natively.
 */
/**
 * Initializes a secure unified Stripe Checkout Session explicitly natively bridging
 * complex fractional product configurations safely via inline pricing definitions or mapped Price IDs.
 * Dynamically binds trace idempotency reliably natively.
 *
 * @param ctx - The core provider execution context tracking secure trace spans globally.
 * @param input - Strict payload formally passing line items, routing URLs, and session mode specifications.
 * @returns An AsyncActionResult resolving definitively to a redirectable CheckoutSessionResult structure securely natively.
 */
export async function createCheckoutSession(
  ctx: ProviderContext,
  input: CheckoutSessionInput,
): Promise<AsyncActionResult<CheckoutSessionResult>> {
  const stripe = getOrCreateClient(ctx.config.apiKey);

  try {
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: input.mode,
      client_reference_id: input.clientReferenceId,
      metadata: {
        ...input.metadata,
        revstack_trace_id: ctx.traceId ?? null,
      },
      ui_mode: "hosted",
      success_url: input.successUrl
        ? appendQueryParam(input.successUrl, "session_id={CHECKOUT_SESSION_ID}")
        : undefined,
      cancel_url: input.cancelUrl,
      customer: input.customerId,
      customer_email: !input.customerId ? input.customerEmail : undefined,
      allow_promotion_codes: input.allowPromotionCodes,
      line_items: formatLineItems(input.lineItems, input.mode),

      automatic_tax: input.automaticTax ? { enabled: true } : undefined,

      billing_address_collection: input.automaticTax ? "required" : "auto",

      customer_update: input.customerId
        ? { address: "auto", name: "auto" }
        : undefined,
    };

    if (input.mode === "payment") {
      sessionParams.payment_intent_data = {
        setup_future_usage: input.setupFutureUsage ? "off_session" : undefined,
        metadata: input.metadata,
        statement_descriptor: input.statementDescriptor || undefined,
      };
    } else if (input.mode === "subscription") {
      sessionParams.subscription_data = {
        metadata: input.metadata,
        trial_period_days: input.trialDays || undefined,
      };
    }

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
    const mapped = mapError(error);
    return {
      data: null,
      status: "failed",
      error: mapped,
    };
  }
}
/**
 * Rapidly creates a secure authenticated session natively into Stripe's hosted Billing Portal natively.
 * Provides completely hosted natively managed subscription configuration explicitly securely
 * safely offloading complicated UI workflows natively securely globally.
 *
 * @param ctx - The core provider execution context instance reliably securely globally.
 * @param input - Parameters identifying uniquely the native Stripe customer string and reliable redirection return_url globally.
 * @returns An AsyncActionResult formally natively resolving strictly to universally securely redirectable Portal URLs.
 */
/**
 * Rapidly creates a secure authenticated session natively into Stripe's hosted Billing Portal natively.
 * Provides completely hosted natively managed subscription configuration explicitly securely
 * safely offloading complicated UI workflows natively securely globally.
 *
 * @param ctx - The core provider execution context instance reliably securely globally.
 * @param input - Parameters identifying uniquely the native Stripe customer string and reliable redirection return_url globally.
 * @returns An AsyncActionResult formally natively resolving strictly to universally securely redirectable Portal URLs.
 */
export async function createBillingPortalSession(
  ctx: ProviderContext,
  input: BillingPortalInput,
): Promise<AsyncActionResult<BillingPortalResult>> {
  const stripe = getOrCreateClient(ctx.config.apiKey);

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
    const mapped = mapError(error);
    return {
      data: null,
      status: "failed",
      error: mapped,
    };
  }
}
