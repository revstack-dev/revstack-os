import {
  mapStripeSubscriptionToSubscription,
  mapStripeError,
} from "@/maps/mappers";
import {
  ProviderContext,
  RevstackErrorCode,
  CreateSubscriptionInput,
  UpdateSubscriptionInput,
  Subscription,
  PaginatedResult,
  PaginationOptions,
  AsyncActionResult,
} from "@revstackhq/providers-core";
import Stripe from "stripe";
import { getOrCreateStripe } from "./shared";

export async function createSubscription(
  ctx: ProviderContext,
  input: CreateSubscriptionInput,
  createCheckoutSession: (ctx: ProviderContext, input: any) => Promise<any>,
): Promise<AsyncActionResult<string>> {
  const result = await createCheckoutSession(ctx, {
    mode: "subscription",
    customerId: input.customerId,
    successUrl: input.returnUrl || "",
    cancelUrl: input.cancelUrl || "",
    metadata: input.metadata,
    allowPromotionCodes: input.promotionCode ? true : undefined,
    lineItems: [
      {
        priceId: input.priceId,
        quantity: input.quantity || 1,
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

export async function getSubscription(
  ctx: ProviderContext,
  id: string,
): Promise<AsyncActionResult<Subscription>> {
  const stripe = getOrCreateStripe(ctx.config.apiKey);

  try {
    const sub = await stripe.subscriptions.retrieve(id);
    return {
      data: mapStripeSubscriptionToSubscription(sub),
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

export async function cancelSubscription(
  ctx: ProviderContext,
  id: string,
  reason?: string,
): Promise<AsyncActionResult<string>> {
  const stripe = getOrCreateStripe(ctx.config.apiKey);

  try {
    const sub = await stripe.subscriptions.update(id, {
      cancel_at_period_end: true,
      cancellation_details: {
        comment: reason || null,
        feedback: "other",
      },
    });

    return {
      data: sub.id,
      status: "success",
    };
  } catch (error: unknown) {
    if (error instanceof Stripe.errors.StripeError) {
      if (error.code === "resource_missing") {
        return {
          data: null,
          status: "failed",
          error: {
            code: RevstackErrorCode.SubscriptionNotFound,
            message: error.message,
            providerError: error.code,
          },
        };
      }
      if (
        error.message.includes("cancel") ||
        error.message.includes("status")
      ) {
        return {
          data: null,
          status: "failed",
          error: {
            code: RevstackErrorCode.InvalidState,
            message: error.message,
            providerError: error.code,
          },
        };
      }
    }
    const mapped = mapStripeError(error);
    return {
      data: null,
      status: "failed",
      error: mapped,
    };
  }
}

export async function pauseSubscription(
  ctx: ProviderContext,
  id: string,
): Promise<AsyncActionResult<string>> {
  const stripe = getOrCreateStripe(ctx.config.apiKey);

  try {
    const sub = await stripe.subscriptions.update(
      id,
      {
        pause_collection: {
          behavior: "void",
        },
      },
      { idempotencyKey: ctx.idempotencyKey },
    );

    return {
      data: sub.id,
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

export async function resumeSubscription(
  ctx: ProviderContext,
  id: string,
): Promise<AsyncActionResult<string>> {
  const stripe = getOrCreateStripe(ctx.config.apiKey);

  try {
    const sub = await stripe.subscriptions.update(
      id,
      {
        pause_collection: null,
      },
      { idempotencyKey: ctx.idempotencyKey },
    );

    return {
      data: sub.id,
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

export async function listSubscriptions(
  ctx: ProviderContext,
  pagination: PaginationOptions,
): Promise<AsyncActionResult<PaginatedResult<Subscription>>> {
  const stripe = getOrCreateStripe(ctx.config.apiKey);

  try {
    const subs = await stripe.subscriptions.list({
      limit: pagination.limit || 10,
      starting_after: pagination.startingAfter || undefined,
    });

    return {
      data: {
        data: subs.data.map(mapStripeSubscriptionToSubscription),
        hasMore: subs.has_more,
        nextCursor: subs.data.at(-1)?.id,
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

export async function updateSubscription(
  ctx: ProviderContext,
  id: string,
  input: UpdateSubscriptionInput,
): Promise<AsyncActionResult<string>> {
  const stripe = getOrCreateStripe(ctx.config.apiKey);

  try {
    // retrieve current subscription to get the item id for price swap
    const current = await stripe.subscriptions.retrieve(id);
    const updateParams: Stripe.SubscriptionUpdateParams = {
      metadata: input.metadata || undefined,
      proration_behavior:
        (input.proration as Stripe.SubscriptionUpdateParams.ProrationBehavior) ||
        "create_prorations",
    };

    if (input.priceId && current.items.data[0]) {
      updateParams.items = [
        {
          id: current.items.data[0].id,
          price: input.priceId,
          quantity: input.quantity || undefined,
        },
      ];
    } else if (input.quantity && current.items.data[0]) {
      updateParams.items = [
        {
          id: current.items.data[0].id,
          quantity: input.quantity,
        },
      ];
    }

    if (input.trialEnd) {
      updateParams.trial_end =
        input.trialEnd === "now"
          ? "now"
          : Math.floor(new Date(input.trialEnd).getTime() / 1000);
    }

    const sub = await stripe.subscriptions.update(id, updateParams, {
      idempotencyKey: ctx.idempotencyKey,
    });

    return {
      data: sub.id,
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
