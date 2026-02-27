import { mapStripePaymentToPayment, mapStripeError } from "@/maps/mappers";
import {
  ProviderContext,
  RevstackErrorCode,
  CreatePaymentInput,
  RefundPaymentInput,
  Payment,
  PaginatedResult,
  PaginationOptions,
  AsyncActionResult,
} from "@revstackhq/providers-core";
import Stripe from "stripe";
import { getOrCreateStripe } from "./shared";

export async function createPayment(
  ctx: ProviderContext,
  input: CreatePaymentInput,
  createCheckoutSession: (ctx: ProviderContext, input: any) => Promise<any>,
): Promise<AsyncActionResult<string>> {
  const result = await createCheckoutSession(ctx, {
    mode: "payment",
    customerId: input.customerId,
    successUrl: input.returnUrl || "",
    cancelUrl: input.returnUrl || "",
    metadata: input.metadata,
    lineItems: [
      {
        name: input.description || "Payment",
        amount: input.amount,
        currency: input.currency,
        quantity: 1,
      },
    ],
  });

  return {
    data: result.data?.id || null,
    status: result.status,
    nextAction: result.nextAction,
    error: result.error,
  };
}

/**
 * retrieves a payment by id
 * accepts both pi_ (payment intent) and cs_ (checkout session) ids
 */
export async function getPayment(
  ctx: ProviderContext,
  id: string,
): Promise<AsyncActionResult<Payment>> {
  const stripe = getOrCreateStripe(ctx.config.apiKey);

  try {
    // if this is a checkout session id, resolve to payment intent
    if (id.startsWith("cs_")) {
      const session = await stripe.checkout.sessions.retrieve(id);
      const piId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id;

      if (!piId) {
        return {
          data: null,
          status: "failed",
          error: {
            code: RevstackErrorCode.ResourceNotFound,
            message: "Checkout session has no associated payment intent yet",
          },
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
    const mapped = mapStripeError(error);
    return {
      data: null,
      status: "failed",
      error: mapped,
    };
  }
}

export async function refundPayment(
  ctx: ProviderContext,
  input: RefundPaymentInput,
): Promise<AsyncActionResult<string>> {
  const stripe = getOrCreateStripe(ctx.config.apiKey);

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
    const mapped = mapStripeError(error);
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

export async function listPayments(
  ctx: ProviderContext,
  pagination: PaginationOptions,
): Promise<AsyncActionResult<PaginatedResult<Payment>>> {
  const stripe = getOrCreateStripe(ctx.config.apiKey);

  try {
    const params: Stripe.PaymentIntentListParams = {
      limit: pagination.limit || 20,
      expand: ["data.latest_charge"],
    };

    if (pagination.cursor) {
      params.starting_after = pagination.cursor;
    }

    const result = await stripe.paymentIntents.list(params);

    return {
      data: {
        data: result.data.map(mapStripePaymentToPayment),
        hasMore: result.has_more,
        nextCursor:
          result.data.length > 0
            ? result.data[result.data.length - 1]?.id
            : undefined,
      },
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

export async function capturePayment(
  ctx: ProviderContext,
  id: string,
  amount?: number,
): Promise<AsyncActionResult<string>> {
  const stripe = getOrCreateStripe(ctx.config.apiKey);

  try {
    const pi = await stripe.paymentIntents.capture(id, {
      ...(amount ? { amount_to_capture: amount } : {}),
    });

    return {
      data: pi.id,
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
