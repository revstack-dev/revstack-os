import {
  ProviderContext,
  CreateAddonInput,
  UpdateAddonInput,
  DeleteAddonInput,
  Addon,
  PaginatedResult,
  PaginationOptions,
  AsyncActionResult,
} from "@revstackhq/providers-core";
import { getOrCreateStripe } from "./shared";
import {
  mapStripeSubscriptionItemToAddon,
  mapStripeError,
} from "@/maps/mappers";
import Stripe from "stripe";

export async function createAddon(
  ctx: ProviderContext,
  input: CreateAddonInput,
): Promise<AsyncActionResult<string>> {
  const stripe = getOrCreateStripe(ctx.config.apiKey);

  try {
    const item = await stripe.subscriptionItems.create(
      {
        subscription: input.subscriptionId,
        price: input.priceId,
        quantity: input.quantity || 1,
        metadata: input.metadata,
        proration_behavior:
          input.prorationBehavior as Stripe.SubscriptionItemCreateParams.ProrationBehavior,
      },
      { idempotencyKey: ctx.idempotencyKey },
    );

    return {
      data: item.id,
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

export async function getAddon(
  ctx: ProviderContext,
  id: string,
): Promise<AsyncActionResult<Addon>> {
  const stripe = getOrCreateStripe(ctx.config.apiKey);

  try {
    const item = await stripe.subscriptionItems.retrieve(id);
    return {
      data: mapStripeSubscriptionItemToAddon(item),
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

export async function updateAddon(
  ctx: ProviderContext,
  id: string,
  input: UpdateAddonInput,
): Promise<AsyncActionResult<string>> {
  const stripe = getOrCreateStripe(ctx.config.apiKey);

  try {
    const item = await stripe.subscriptionItems.update(
      id,
      {
        price: input.priceId,
        quantity: input.quantity,
        metadata: input.metadata,
        proration_behavior:
          input.prorationBehavior as Stripe.SubscriptionItemUpdateParams.ProrationBehavior,
      },
      { idempotencyKey: ctx.idempotencyKey },
    );

    return {
      data: item.id,
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

export async function deleteAddon(
  ctx: ProviderContext,
  input: DeleteAddonInput,
): Promise<AsyncActionResult<boolean>> {
  const stripe = getOrCreateStripe(ctx.config.apiKey);

  try {
    await stripe.subscriptionItems.del(
      input.id,
      {
        proration_behavior:
          input.prorationBehavior as Stripe.SubscriptionItemDeleteParams.ProrationBehavior,
      },
      {
        idempotencyKey: ctx.idempotencyKey,
      },
    );
    return {
      data: true,
      status: "success",
    };
  } catch (error: unknown) {
    const mapped = mapStripeError(error);
    return {
      data: false,
      status: "failed",
      error: mapped,
    };
  }
}

export async function listAddons(
  ctx: ProviderContext,
  subscriptionId: string,
  pagination: PaginationOptions,
): Promise<AsyncActionResult<PaginatedResult<Addon>>> {
  const stripe = getOrCreateStripe(ctx.config.apiKey);

  try {
    const items = await stripe.subscriptionItems.list({
      subscription: subscriptionId,
      limit: pagination.limit || 10,
      starting_after: pagination.startingAfter || undefined,
    });

    return {
      data: {
        data: items.data.map(mapStripeSubscriptionItemToAddon),
        hasMore: items.has_more,
        nextCursor: items.data.at(-1)?.id,
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
