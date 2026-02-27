import {
  mapAddressToStripe,
  mapStripeCustomerToCustomer,
  mapStripeError,
} from "@/maps/mappers";
import {
  ProviderContext,
  RevstackErrorCode,
  CreateCustomerInput,
  Customer,
  UpdateCustomerInput,
  PaginatedResult,
  PaginationOptions,
  AsyncActionResult,
} from "@revstackhq/providers-core";
import { getOrCreateStripe } from "./shared";

export async function createCustomer(
  ctx: ProviderContext,
  input: CreateCustomerInput,
): Promise<AsyncActionResult<string>> {
  const stripe = getOrCreateStripe(ctx.config.apiKey);

  try {
    const customer = await stripe.customers.create(
      {
        email: input.email,
        name: input.name,
        phone: input.phone,
        description: input.description,
        address: mapAddressToStripe(input.address),
        metadata: {
          ...input.metadata,
          revstack_trace_id: ctx.traceId || null,
        },
      },
      { idempotencyKey: ctx.idempotencyKey },
    );

    return {
      data: customer.id,
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

export async function updateCustomer(
  ctx: ProviderContext,
  id: string,
  input: UpdateCustomerInput,
): Promise<AsyncActionResult<string>> {
  const stripe = getOrCreateStripe(ctx.config.apiKey);

  try {
    const customer = await stripe.customers.update(id, {
      email: input.email,
      name: input.name,
      phone: input.phone,
      description: input.description,
      address: mapAddressToStripe(input.address),
      metadata: input.metadata,
    });

    return {
      data: customer.id,
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

export async function deleteCustomer(
  ctx: ProviderContext,
  id: string,
): Promise<AsyncActionResult<boolean>> {
  const stripe = getOrCreateStripe(ctx.config.apiKey);

  try {
    const deleted = await stripe.customers.del(id);
    return {
      data: deleted.deleted,
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

export async function getCustomer(
  ctx: ProviderContext,
  id: string,
): Promise<AsyncActionResult<Customer>> {
  const stripe = getOrCreateStripe(ctx.config.apiKey);

  try {
    const customer = await stripe.customers.retrieve(id);

    if (customer.deleted) {
      return {
        data: null,
        status: "failed",
        error: {
          code: RevstackErrorCode.ResourceNotFound,
          message: "Customer has been deleted in Stripe",
        },
      };
    }

    return {
      data: mapStripeCustomerToCustomer(customer),
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

export async function listCustomers(
  ctx: ProviderContext,
  pagination: PaginationOptions,
): Promise<AsyncActionResult<PaginatedResult<Customer>>> {
  const stripe = getOrCreateStripe(ctx.config.apiKey);

  try {
    const customers = await stripe.customers.list({
      limit: pagination.limit || 10,
      starting_after: pagination.startingAfter || undefined,
    });

    return {
      data: {
        data: customers.data.map(mapStripeCustomerToCustomer),
        hasMore: customers.has_more,
        nextCursor: customers.data.at(-1)?.id,
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
