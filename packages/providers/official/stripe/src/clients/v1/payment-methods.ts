import { getOrCreateStripe } from "@/clients/v1/shared";
import {
  mapStripeError,
  mapStripePaymentMethodToPaymentMethod,
} from "@/maps/mappers";
import {
  AsyncActionResult,
  PaymentMethod,
  ProviderContext,
} from "@revstackhq/providers-core";
import Stripe from "stripe";

export async function listPaymentMethods(
  ctx: ProviderContext,
  customerId: string,
): Promise<AsyncActionResult<PaymentMethod[]>> {
  const stripe = getOrCreateStripe(ctx.config.apiKey);

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
    const mapped = mapStripeError(error);
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
  const stripe = getOrCreateStripe(ctx.config.apiKey);

  try {
    await stripe.paymentMethods.detach(id);

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
