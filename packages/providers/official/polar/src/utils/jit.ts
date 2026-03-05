import {
  normalizeCurrency,
  ProviderContext,
  RevstackErrorCode,
  Interval,
} from "@revstackhq/providers-core";
import { PresentmentCurrency } from "@polar-sh/sdk/models/components/presentmentcurrency.js";
import { Polar } from "@polar-sh/sdk";

/**
 * Automatically resolves or creates a Just-In-Time (JIT) product and price.
 * Provides a provider-agnostic utility for both one-time payments and subscriptions.
 *
 * @param client - The authenticated client.
 * @param ctx - The provider context explicitly containing the organization config.
 * @param params - The specific dynamic inputs containing JIT information or standard Price ID.
 * @returns The resolved standard product ID
 */
export async function resolveJitProductId(
  client: Polar,
  _ctx: ProviderContext,
  params: {
    priceId?: string;
    jit: {
      name: string;
      description?: string;
      interval?: string;
      amount: number;
      currency: string;
      trialInterval?: Interval;
      trialIntervalCount?: number;
    };
  },
): Promise<string> {
  let needsCreation = !params.priceId;

  if (params.priceId) {
    try {
      await client.products.get({ id: params.priceId });
    } catch (err: any) {
      if (err.status === 404) needsCreation = true;
      else throw err;
    }
  }

  if (!needsCreation) return params.priceId!;

  if (params.jit.interval) {
    if (params.jit.interval === "day" || params.jit.interval === "week") {
      throw {
        isRevstackError: true,
        errorPayload: {
          code: RevstackErrorCode.InvalidInput,
          message: "Polar only supports 'month' or 'year' for subscriptions.",
        },
      };
    }
  }

  const newProduct = await client.products.create({
    name: params.jit.name,
    description: params.jit.description,
    recurringInterval: params.jit.interval,
    trialInterval: params.jit.trialInterval,
    trialIntervalCount: params.jit.trialIntervalCount,
    prices: [
      {
        amountType: "fixed",
        priceAmount: params.jit.amount,
        priceCurrency: normalizeCurrency(
          params.jit.currency,
          "lowercase",
        ) as PresentmentCurrency,
      },
    ],
  });

  return newProduct.id;
}
