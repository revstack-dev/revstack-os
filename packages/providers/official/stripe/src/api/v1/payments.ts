import { mapStripePaymentToPayment } from "@/api/v1/mappers";
import { mapError } from "@/shared/error-map";
import {
  ProviderContext,
  RevstackErrorCode,
  CreatePaymentInput,
  RefundPaymentInput,
  Payment,
  PaginatedResult,
  PaginationOptions,
  AsyncActionResult,
  buildCursorPagination,
  PaymentStatus,
  RevstackCurrency,
  CheckoutSessionInput,
  CheckoutSessionResult,
} from "@revstackhq/providers-core";
import Stripe from "stripe";
import { getOrCreateClient } from "@/api/v1/client";
import { currencyMap } from "@/shared/currency-map";

/**
 * Executes a deferred payment creation through a Stripe Checkout Session flow.
 * Intentionally isolates complexity from raw PaymentIntents, defaulting towards the unified
 * Checkout environment to naturally support external return URLs and standardized metadata bridging.
 *
 * @param ctx - The generic provider context containing configuration and execution bounds.
 * @param input - Strict payload instructing amount matrices and destination strings.
 * @param createCheckoutSession - Subjugated dependency injection utilized to securely boot Session workflows.
 * @returns An AsyncActionResult returning natively either the Checkout Session identifier or consequential redirect URLs.
 */
export async function createPayment(
  ctx: ProviderContext,
  input: CreatePaymentInput,
  createCheckoutSession: (
    ctx: ProviderContext,
    input: CheckoutSessionInput,
  ) => Promise<AsyncActionResult<CheckoutSessionResult>>,
): Promise<AsyncActionResult<CheckoutSessionResult>> {
  return await createCheckoutSession(ctx, {
    mode: "payment",
    customerId: input.customerId,
    successUrl: input.returnUrl,
    cancelUrl: input.cancelUrl,
    metadata: input.metadata,
    allowPromotionCodes: input.allowPromotionCodes,
    lineItems: input.lineItems,
    automaticTax: input.automaticTax,
    statementDescriptor: input.statementDescriptor,
    setupFutureUsage: input.setupFutureUsage,
    clientReferenceId: input.clientReferenceId,
  });
}

/**
 * Safely fetches an authoritative payment entity mapped specifically from either ID origin.
 * Extremely robust dual-mode resolver: securely unpacks ambiguous `cs_` (Checkout Sessions) into
 * authoritative `pi_` (Payment Intents) representations natively, defending heavily against null
 * instantiation states conditionally created by setups or pure subscription forms.
 *
 * @param ctx - The generic provider context instance.
 * @param id - An origin-agnostic native identifier representing either a Checkout Session or raw Payment Intent.
 * @returns An AsyncActionResult containing the parsed and fully expanded Revstack Payment normalization object.
 */
export async function getPayment(
  ctx: ProviderContext,
  id: string,
): Promise<AsyncActionResult<Payment>> {
  const stripe = getOrCreateClient(ctx.config.apiKey);

  try {
    if (id.startsWith("cs_")) {
      const session = await stripe.checkout.sessions.retrieve(id);

      const piId = session.payment_intent
        ? typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent.id
        : null;

      if (!piId) {
        const synthesizedPayment: Payment = {
          id: session.id,
          providerId: "stripe",
          externalId: session.id,
          amount: session.amount_total || 0,
          currency: currencyMap[session.currency as string] as RevstackCurrency,
          status:
            session.status === "expired"
              ? PaymentStatus.Canceled
              : session.payment_status === "paid"
                ? PaymentStatus.Succeeded
                : PaymentStatus.Pending,
          amountRefunded: 0,
          customerId:
            typeof session.customer === "string"
              ? session.customer
              : session.customer?.id,
          createdAt: new Date(session.created * 1000).toISOString(),
          metadata: session.metadata || undefined,
          raw: session,
        };

        return {
          data: synthesizedPayment,
          status: session.status === "open" ? "requires_action" : "success",
          nextAction:
            session.status === "open" && session.url
              ? {
                  type: "redirect",
                  url: session.url,
                }
              : undefined,
        };
      }

      id = piId;
    }

    const pi = await stripe.paymentIntents.retrieve(id, {
      expand: ["latest_charge"],
    });

    return {
      data: mapStripePaymentToPayment(pi),
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

/**
 * Emits a formalized partial or comprehensive automated monetary refund targeting an anchored recorded Payment Intent.
 * Unpacks enum-compliant reasoning standards, and deeply correlates the outgoing Stripe payload to
 * active Revstack operational spans (Trace ID).
 *
 * @param ctx - The generic provider context instance.
 * @param input - Strict parameters isolating target `paymentId`, optional deduction `amount`, and required operational `reason`.
 * @returns An AsyncActionResult successfully generating the concrete valid Stripe Refund Identifier reference.
 */
export async function refundPayment(
  ctx: ProviderContext,
  input: RefundPaymentInput,
): Promise<AsyncActionResult<string>> {
  const stripe = getOrCreateClient(ctx.config.apiKey);

  try {
    const refund = await stripe.refunds.create(
      {
        payment_intent: input.paymentId,
        amount: input.amount,
        reason: input.reason as Stripe.RefundCreateParams.Reason,
        metadata: {
          revstack_trace_id: ctx.traceId || null,
        },
      },
      { idempotencyKey: ctx.idempotencyKey },
    );

    return {
      data: refund.id,
      status: "success",
    };
  } catch (error: unknown) {
    const mapped = mapError(error);
    return {
      data: null,
      status: "failed",
      error: {
        code:
          mapped.code === RevstackErrorCode.UnknownError
            ? RevstackErrorCode.RefundFailed
            : mapped.code,
        message: mapped.message,
        providerError: mapped.providerError,
      },
    };
  }
}

/**
 * Operates a large-scale paginated extraction fetching localized indexed Payment Intents inside Stripe.
 * Mandates deterministic 'latest_charge' expansion universally to continuously guarantee correct mapped
 * capture statuses and associated receipts. Handles mathematically difficult forward/backward cursor
 * calculation natively correctly.
 *
 * @param ctx - The generic provider context instance.
 * @param pagination - Generic bounds limiting output cardinality via defined structural cursors vectors.
 * @param filters - Specialized modifier object attached natively inside generic underlying Stripe query params.
 * @returns An AsyncActionResult comprehensively delivering bidirectional PaginatedResult mappings populated with true Payment values.
 */
export async function listPayments(
  ctx: ProviderContext,
  pagination: PaginationOptions,
  filters?: Record<string, any>,
): Promise<AsyncActionResult<PaginatedResult<Payment>>> {
  const stripe = getOrCreateClient(ctx.config.apiKey);

  try {
    const params: Stripe.PaymentIntentListParams = {
      limit: pagination.limit || 20,
      expand: ["data.latest_charge"],
      ...filters,
    };

    if (pagination.cursor) {
      params.starting_after = pagination.cursor;
    } else if (pagination.startingAfter) {
      params.starting_after = pagination.startingAfter;
    } else if (pagination.endingBefore) {
      params.ending_before = pagination.endingBefore;
    }

    const result = await stripe.paymentIntents.list(params);
    return {
      data: buildCursorPagination(
        result.data,
        result.has_more,
        pagination,
        mapStripePaymentToPayment,
      ),
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

/**
 * Hard-captures a temporally authorized but natively uncaptured persistent Stripe Payment Intent.
 * Critically operates independent split-flow captures; allows targeted financial deduction values uniquely securely.
 * Defaults to max-possible full captured values if no specific fraction is directly passed.
 *
 * @param ctx - The generic provider context instance.
 * @param id - The verified isolated Stripe Payment Intent string reference target.
 * @param amount - Optional precise monetary decimal count executing exact restricted fractional captures natively.
 * @returns An AsyncActionResult returning explicitly the newly fully captured Payment Intent string format identity.
 */
export async function capturePayment(
  ctx: ProviderContext,
  id: string,
  amount?: number,
): Promise<AsyncActionResult<string>> {
  const stripe = getOrCreateClient(ctx.config.apiKey);

  try {
    const pi = await stripe.paymentIntents.capture(id, {
      ...(amount ? { amount_to_capture: amount } : {}),
    });

    return {
      data: pi.id,
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
