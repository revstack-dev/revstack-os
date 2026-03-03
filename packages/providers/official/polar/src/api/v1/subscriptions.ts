import { getOrCreatePolar } from "@/api/v1/client";
import { mapPolarSubscriptionToSubscription } from "@/api/v1/mappers";
import {
  AsyncActionResult,
  CreateSubscriptionInput,
  PaginatedResult,
  PaginationOptions,
  ProviderContext,
  Subscription,
  RevstackErrorCode,
  CheckoutSessionResult,
  buildPagePagination,
  UpdateSubscriptionInput,
} from "@revstackhq/providers-core";

import { resolveJitProductId } from "@/utils/jit";
import { mapError } from "@/shared/error-map";

/**
 * Defers Polar subscription creation safely to a checkout session.
 *
 * @param ctx - The provider context.
 * @param input - The explicit subscription input limits.
 * @param createCheckoutSession - Subjugated checkout function hook.
 * @returns A result yielding the redirect URL or checkout session.
 */
export async function createSubscription(
  ctx: ProviderContext,
  input: CreateSubscriptionInput,
  createCheckoutSession: (
    ctx: ProviderContext,
    input: any,
  ) => Promise<AsyncActionResult<CheckoutSessionResult>>,
): Promise<AsyncActionResult<string>> {
  try {
    const polar = getOrCreatePolar(ctx.config.accessToken);

    const resolvedLineItems = await Promise.all(
      input.lineItems.map(async (item) => {
        if ("amount" in item) {
          const priceId = await resolveJitProductId(polar, ctx, {
            jit: {
              name: item.name,
              amount: item.amount,
              currency: item.currency,
              interval: item.interval,
            },
          });
          return { priceId, quantity: item.quantity };
        }
        return { priceId: item.priceId, quantity: item.quantity };
      }),
    );

    const result = await createCheckoutSession(ctx, {
      mode: "subscription",
      customerId: input.customerId,
      successUrl: input.returnUrl || "",
      cancelUrl: input.cancelUrl || "",
      metadata: input.metadata,
      allowPromotionCodes: input.allowPromotionCodes,
      lineItems: resolvedLineItems,
    });

    return {
      data: result.data?.id || null,
      status: result.status,
      nextAction: result.nextAction,
      error: result.error,
    };
  } catch (error: any) {
    if (error.isRevstackError)
      return { data: null, status: "failed", error: error.errorPayload };
    return { data: null, status: "failed", error: mapError(error) };
  }
}

/**
 * Fetches an active comprehensive subscription from Polar.
 *
 * @param ctx - The provider context.
 * @param id - The active subscription ID.
 * @returns The cleanly mapped Revstack subscription.
 */
export async function getSubscription(
  ctx: ProviderContext,
  id: string,
): Promise<AsyncActionResult<Subscription>> {
  try {
    const polar = getOrCreatePolar(ctx.config.accessToken);
    const sub = await polar.subscriptions.get({ id });
    return {
      data: mapPolarSubscriptionToSubscription(sub),
      status: "success",
    };
  } catch (error: any) {
    if (error.isRevstackError) {
      return { data: null, status: "failed", error: error.errorPayload };
    }
    return { data: null, status: "failed", error: mapError(error) };
  }
}

/**
 * Gracefully cancels an active Polar subscription.
 *
 * @param ctx - The provider context.
 * @param id - The active subscription ID.
 * @param _reason - Unused cancellation description.
 * @returns The ID of the cancelled subscription.
 */
export async function cancelSubscription(
  ctx: ProviderContext,
  id: string,
  _reason?: string,
): Promise<AsyncActionResult<string>> {
  try {
    const polar = getOrCreatePolar(ctx.config.accessToken);
    const sub = await polar.subscriptions.revoke({ id });

    return {
      data: sub.id,
      status: "success",
    };
  } catch (error: any) {
    if (error.status === 404) {
      return {
        data: null,
        status: "failed",
        error: {
          code: RevstackErrorCode.SubscriptionNotFound,
          message: error.message,
          providerError: error.name,
        },
      };
    }
    if (error.isRevstackError) {
      return { data: null, status: "failed", error: error.errorPayload };
    }
    return { data: null, status: "failed", error: mapError(error) };
  }
}

/**
 * Pauses a Polar subscription. Returns a NotImplemented error.
 *
 * @param _ctx - Unused provider context.
 * @param _id - Unused ID.
 * @returns A NotImplemented Error.
 */
export async function pauseSubscription(
  _ctx: ProviderContext,
  _id: string,
): Promise<AsyncActionResult<string>> {
  return {
    data: null,
    status: "failed",
    error: {
      code: RevstackErrorCode.NotImplemented,
      message: "Polar does not natively support pausing subscriptions yet.",
    },
  };
}

/**
 * Resumes a Polar subscription. Returns a NotImplemented error.
 *
 * @param _ctx - Unused provider context.
 * @param _id - Unused ID.
 * @returns A NotImplemented Error.
 */
export async function resumeSubscription(
  _ctx: ProviderContext,
  _id: string,
): Promise<AsyncActionResult<string>> {
  return {
    data: null,
    status: "failed",
    error: {
      code: RevstackErrorCode.NotImplemented,
      message: "Polar does not natively support resuming paused subscriptions.",
    },
  };
}

/**
 * Lists multiple paginated subscriptions dynamically correctly.
 *
 * @param ctx - The provider context.
 * @param pagination - Generic depth limits.
 * @param filters - Query filters.
 * @returns A paginated array of mapped subscriptions.
 */
export async function listSubscriptions(
  ctx: ProviderContext,
  pagination: PaginationOptions,
  filters?: Record<string, any>,
): Promise<AsyncActionResult<PaginatedResult<Subscription>>> {
  try {
    const polar = getOrCreatePolar(ctx.config.accessToken);
    const targetPage =
      pagination.page ||
      (pagination.startingAfter && parseInt(pagination.startingAfter) + 1) ||
      (pagination.endingBefore &&
        Math.max(1, parseInt(pagination.endingBefore) - 1)) ||
      1;

    const subsResponse = await polar.subscriptions.list({
      organizationId: ctx.config.organizationId,
      limit: pagination.limit || 10,
      page: targetPage,
      ...filters,
    });

    return {
      data: buildPagePagination(
        subsResponse.result.items,
        targetPage,
        subsResponse.result.pagination.maxPage,
        mapPolarSubscriptionToSubscription,
      ),
      status: "success",
    };
  } catch (error: any) {
    if (error.isRevstackError) {
      return { data: null, status: "failed", error: error.errorPayload };
    }
    return { data: null, status: "failed", error: mapError(error) };
  }
}

/**
 * Replaces the product configuration for an active Polar subscription.
 *
 * @param ctx - The provider context.
 * @param id - The ID of the subscription.
 * @param input - The update payload with the new price ID.
 * @returns The successfully updated subscription ID.
 */
export async function updateSubscription(
  ctx: ProviderContext,
  id: string,
  input: UpdateSubscriptionInput,
): Promise<AsyncActionResult<string>> {
  try {
    const polar = getOrCreatePolar(ctx.config.accessToken);

    const mainItem = input.lineItems?.find((item) => "priceId" in item);

    if (!mainItem || !("priceId" in mainItem) || !mainItem.priceId) {
      return {
        data: null,
        status: "failed",
        error: {
          code: RevstackErrorCode.InvalidInput,
          message:
            "Polar requires a valid Price ID in line items for subscription updates.",
        },
      };
    }

    const sub = await polar.subscriptions.update({
      id,
      subscriptionUpdate: {
        prorationBehavior: input.proration === "none" ? "invoice" : "prorate",
        productId: mainItem.priceId,
      },
    });

    return {
      data: sub.id,
      status: "success",
    };
  } catch (error: any) {
    if (error.isRevstackError)
      return { data: null, status: "failed", error: error.errorPayload };
    return { data: null, status: "failed", error: mapError(error) };
  }
}
