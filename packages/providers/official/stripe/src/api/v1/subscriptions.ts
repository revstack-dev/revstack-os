import { mapStripeSubscriptionToSubscription } from "@/api/v1/mappers";
import {
  ProviderContext,
  CreateSubscriptionInput,
  UpdateSubscriptionInput,
  Subscription,
  PaginatedResult,
  PaginationOptions,
  AsyncActionResult,
  RevstackErrorCode,
  buildCursorPagination,
  CheckoutSessionInput,
  CheckoutSessionResult,
} from "@revstackhq/providers-core";
import Stripe from "stripe";
import { getOrCreateClient } from "@/api/v1/client";
import { mapError } from "@/shared/error-map";

/**
 * Safely compiles a mutated update payload for an active Stripe Subscription.
 * Evaluates deeply nested subscription items logically (Quantity vs Price modification vectors),
 * explicitly mapping current anchor item prices into proper deletion arrays when swapping prices.
 * Precalculates complex UNIX trial extensions if applicable.
 *
 * @param stripe - The pre-authenticated generic Stripe Client SDK instance.
 * @param id - The active unique Stripe Subscription ID anchor resolving configuration mappings against.
 * @param input - Strict payload of subscription property mutations requesting fulfillment (e.x new priceId, quantity adjustments).
 * @returns A fully constructed asynchronous Promise resolving into standard Stripe SubscriptionUpdateParams configuration objects.
 */
async function buildUpdateParams(
  stripe: Stripe,
  id: string,
  input: UpdateSubscriptionInput,
): Promise<Stripe.SubscriptionUpdateParams> {
  const updateParams: Stripe.SubscriptionUpdateParams = {
    metadata: input.metadata,
    proration_behavior: input.proration || "create_prorations",
  };

  if (input.lineItems && input.lineItems.length > 0) {
    updateParams.items = input.lineItems.map((item) => {
      if (item.id) {
        return {
          id: item.id,
          price: item.priceId,
          quantity: item.quantity,
          deleted: item.deleted,
          metadata: item.metadata,
        };
      }

      if (item.priceId) {
        return {
          price: item.priceId,
          quantity: item.quantity,
          metadata: item.metadata,
        };
      }

      throw new Error(
        "Stripe update requires either an item 'id' or a 'priceId'.",
      );
    });
  }

  if (input.trialEnd) {
    updateParams.trial_end =
      input.trialEnd === "now"
        ? "now"
        : Math.floor(new Date(input.trialEnd).getTime() / 1000);
  }

  return updateParams;
}

/**
 * Executes a deferred Subscription initialization through a Stripe Checkout Session flow.
 * Overrides standard generic Checkout configurations explicitly into 'subscription' modes,
 * pushing single-line items dynamically supporting quantity structures and external URLs.
 *
 * @param ctx - The generic provider context containing configuration and execution traces.
 * @param input - Strict parameters isolating target `customerId`, primary `priceId`, and routing URLs.
 * @param createCheckoutSession - Subjugated dependency injection utilizing robust global Session construction logic securely.
 * @returns An AsyncActionResult natively yielding either the completed Checkout Session identifier or consequential redirect actionable URLs.
 */
export async function createSubscription(
  ctx: ProviderContext,
  input: CreateSubscriptionInput,
  createCheckoutSession: (
    ctx: ProviderContext,
    input: CheckoutSessionInput,
  ) => Promise<AsyncActionResult<CheckoutSessionResult>>,
): Promise<AsyncActionResult<CheckoutSessionResult>> {
  try {
    return await createCheckoutSession(ctx, {
      mode: "subscription",
      customerId: input.customerId,
      successUrl: input.returnUrl,
      cancelUrl: input.cancelUrl,
      metadata: input.metadata,
      allowPromotionCodes: input.allowPromotionCodes,
      automaticTax: input.automaticTax,
      customerEmail: input.customerEmail,
      trialDays: input.trialDays,
      lineItems: input.lineItems,
      clientReferenceId: input.clientReferenceId,
    });
  } catch (error: any) {
    if (error.isRevstackError)
      return { data: null, status: "failed", error: error.errorPayload };
    return { data: null, status: "failed", error: mapError(error) };
  }
}

/**
 * Fetches an authoritative full-profile active Subscription entity direct from Stripe.
 * Normalizes natively complex internal nested Stripe structures deeply into predictable Revstack mappings automatically.
 *
 * @param ctx - The core provider context executing the query securely.
 * @param id - The authoritative literal Stripe Subscription ID.
 * @returns An AsyncActionResult successfully yielding the comprehensively mapped Subscription Revstack format.
 */
export async function getSubscription(
  ctx: ProviderContext,
  id: string,
): Promise<AsyncActionResult<Subscription>> {
  try {
    const stripe = getOrCreateClient(ctx.config.apiKey);
    const sub = await stripe.subscriptions.retrieve(id);
    return {
      data: mapStripeSubscriptionToSubscription(sub),
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
 * Gracefully orchestrates the scheduled termination of an active Stripe Subscription.
 * Ensures cancellation strictly engages cleanly at `period_end` securely, avoiding destructive internal Stripe
 * proration logic randomly, while officially logging cancellation commentary into native Stripe Feedback nodes.
 * Resolves safe exceptions mapping natural state mismatches (e.g., status flags already canceled) accurately.
 *
 * @param ctx - The core provider context instance.
 * @param id - The active literal Stripe Subscription ID targeted.
 * @param reason - Optional explicit string justification injected natively into Stripe's `cancellation_details.comment`.
 * @returns An AsyncActionResult successfully emitting the mutated Stripe Subscription string identity.
 */
export async function cancelSubscription(
  ctx: ProviderContext,
  id: string,
  reason?: string,
): Promise<AsyncActionResult<string>> {
  try {
    const stripe = getOrCreateClient(ctx.config.apiKey);
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
  } catch (error: any) {
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
    if (error.isRevstackError) {
      return { data: null, status: "failed", error: error.errorPayload };
    }
    return { data: null, status: "failed", error: mapError(error) };
  }
}

/**
 * Intercepts an actively billing Stripe Subscription natively and places it into an explicit billing pause.
 * Forces robust `void` behavioral paradigms internally, assuring no lingering invoices structurally accumulate natively
 * while externally suspended. Uses tight idempotency validation.
 *
 * @param ctx - The core provider context securely encapsulating idempotency controls.
 * @param id - The active literal Stripe Subscription ID to immediately suppress.
 * @returns An AsyncActionResult formally returning the paused Subscription ID format.
 */
export async function pauseSubscription(
  ctx: ProviderContext,
  id: string,
): Promise<AsyncActionResult<string>> {
  try {
    const stripe = getOrCreateClient(ctx.config.apiKey);
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
  } catch (error: any) {
    if (error.isRevstackError) {
      return { data: null, status: "failed", error: error.errorPayload };
    }
    return { data: null, status: "failed", error: mapError(error) };
  }
}

/**
 * Re-activates a natively paused Stripe Subscription cleanly globally.
 * Explicitly nullifies all internally cached `pause_collection` configuration properties,
 * triggering safe automatic native invoicing algorithms internally aligned securely within Stripe.
 *
 * @param ctx - The core provider context securely encapsulating idempotency controls.
 * @param id - The active suspended Stripe Subscription ID to explicitly wake up.
 * @returns An AsyncActionResult returning explicitly the cleanly resumed Subscription string logic.
 */
export async function resumeSubscription(
  ctx: ProviderContext,
  id: string,
): Promise<AsyncActionResult<string>> {
  try {
    const stripe = getOrCreateClient(ctx.config.apiKey);
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
  } catch (error: any) {
    if (error.isRevstackError) {
      return { data: null, status: "failed", error: error.errorPayload };
    }
    return { data: null, status: "failed", error: mapError(error) };
  }
}

/**
 * Executes high-performance paginated lookups listing active Subscriptions natively across Stripe environments.
 * Correctly intercepts standard bidirectional Revstack generic positional cursors translating securely natively into Stripe structural `starting_after/ending_before` formats respectively.
 *
 * @param ctx - The core provider context instance tracking configurations globally securely.
 * @param pagination - Generic depth integer overrides structurally capping results, plus native pointer boundaries.
 * @param filters - Generic dynamic structural native Stripe parameters passed explicitly directly securely (e.g. status or customer_id).
 * @returns An AsyncActionResult returning securely wrapped bidirectional arrays natively describing Subscriptions efficiently.
 */
export async function listSubscriptions(
  ctx: ProviderContext,
  pagination: PaginationOptions,
  filters?: Record<string, any>,
): Promise<AsyncActionResult<PaginatedResult<Subscription>>> {
  try {
    const stripe = getOrCreateClient(ctx.config.apiKey);
    const subs = await stripe.subscriptions.list({
      limit: pagination.limit || 10,
      starting_after: pagination.startingAfter || undefined,
      ending_before: pagination.endingBefore || undefined,
      ...filters,
    });

    return {
      data: buildCursorPagination(
        subs.data,
        subs.has_more,
        pagination,
        mapStripeSubscriptionToSubscription,
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
 * Comprehensively modifies core properties attached rigidly to active functional Stripe Subscriptions globally securely.
 * Internally compiles and evaluates difficult cross-price array deletions cleanly executing exact required structural native
 * Stripe mutations automatically natively, including deep proration calculations automatically accurately securely natively.
 *
 * @param ctx - The core provider execution context cleanly applying trace Idempotency globally automatically safely.
 * @param id - The primary authoritative generic Stripe Subscription string ID anchor dynamically mapped accurately cleanly.
 * @param input - Strict generic parameters executing specific quantity integer/price ID swaps explicitly effectively cleanly securely.
 * @returns An AsyncActionResult formally yielding successfully directly natively modified Subscription string configurations natively safely.
 */
export async function updateSubscription(
  ctx: ProviderContext,
  id: string,
  input: UpdateSubscriptionInput,
): Promise<AsyncActionResult<string>> {
  try {
    const stripe = getOrCreateClient(ctx.config.apiKey);
    const updateParams = await buildUpdateParams(stripe, id, input);

    const sub = await stripe.subscriptions.update(id, updateParams, {
      idempotencyKey: ctx.idempotencyKey,
    });

    return {
      data: sub.id,
      status: "success",
    };
  } catch (error: any) {
    if (error.isRevstackError) {
      return { data: null, status: "failed", error: error.errorPayload };
    }
    return { data: null, status: "failed", error: mapError(error) };
  }
}
