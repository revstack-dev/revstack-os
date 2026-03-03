import { createCheckoutSession } from "@/api/v1/checkout";
import { getOrCreateClient } from "@/api/v1/client";
import { mapStripePaymentMethodToPaymentMethod } from "@/api/v1/mappers";
import { mapError } from "@/shared/error-map";
import {
  AsyncActionResult,
  CheckoutSessionResult,
  PaymentMethod,
  ProviderContext,
  SetupPaymentMethodInput,
} from "@revstackhq/providers-core";
import Stripe from "stripe";

export async function setupPaymentMethod(
  ctx: ProviderContext,
  input: SetupPaymentMethodInput,
): Promise<AsyncActionResult<CheckoutSessionResult>> {
  return createCheckoutSession(ctx, {
    mode: "setup",
    customerId: input.customerId,
    successUrl: input.returnUrl,
    cancelUrl: input.cancelUrl,
    metadata: input.metadata,
    lineItems: [],
  });
}

export async function listPaymentMethods(
  ctx: ProviderContext,
  customerId: string,
): Promise<AsyncActionResult<PaymentMethod[]>> {
  const stripe = getOrCreateClient(ctx.config.apiKey);

  try {
    const [paymentMethods, customer] = await Promise.all([
      stripe.paymentMethods.list({
        customer: customerId,
        limit: 100,
      }),
      stripe.customers.retrieve(customerId),
    ]);

    if (customer.deleted) {
      throw new Error("Customer deleted");
    }

    const defaultPaymentMethodId =
      (customer as Stripe.Customer).invoice_settings?.default_payment_method ||
      (customer as Stripe.Customer).default_source;

    const mappedMethods = paymentMethods.data.map((pm) =>
      mapStripePaymentMethodToPaymentMethod(
        pm,
        defaultPaymentMethodId as string,
      ),
    );

    return {
      data: mappedMethods,
      status: "success",
    };
  } catch (error: unknown) {
    const mapped = mapError(error);
    return {
      data: [],
      status: "failed",
      error: mapped,
    };
  }
}

export async function deletePaymentMethod(
  ctx: ProviderContext,
  id: string,
): Promise<AsyncActionResult<boolean>> {
  const stripe = getOrCreateClient(ctx.config.apiKey);

  try {
    await stripe.paymentMethods.detach(id);

    return {
      data: true,
      status: "success",
    };
  } catch (error: unknown) {
    const mapped = mapError(error);
    return {
      data: false,
      status: "failed",
      error: mapped,
    };
  }
}
