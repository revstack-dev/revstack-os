import { ERROR_CODE_MAP, ERROR_TYPE_MAP } from "@/maps/error-map";
import {
  Address,
  Customer,
  Payment,
  PaymentMethod,
  PaymentMethodDetails,
  PaymentStatus,
  RevstackErrorCode,
  Subscription,
  SubscriptionStatus,
} from "@revstackhq/providers-core";
import Stripe from "stripe";

// stripe sdk types don't expose current_period_start/end even though the API returns them
interface StripeSubscriptionWithPeriods extends Stripe.Subscription {
  current_period_start?: number;
  current_period_end?: number;
}

// --- STATUS MAPPERS ---

export function mapStripeStatusToPaymentStatus(status: string): PaymentStatus {
  const map: Record<string, PaymentStatus> = {
    succeeded: PaymentStatus.Succeeded,
    requires_payment_method: PaymentStatus.Pending,
    requires_confirmation: PaymentStatus.Pending,
    requires_action: PaymentStatus.RequiresAction,
    canceled: PaymentStatus.Canceled,
    processing: PaymentStatus.Pending,
  };
  return map[status] || PaymentStatus.Pending;
}

export function mapStripeSubStatusToSubscriptionStatus(
  status: string,
): SubscriptionStatus {
  const map: Record<string, SubscriptionStatus> = {
    incomplete: SubscriptionStatus.Incomplete,
    incomplete_expired: SubscriptionStatus.IncompleteExpired,
    trialing: SubscriptionStatus.Trialing,
    active: SubscriptionStatus.Active,
    past_due: SubscriptionStatus.PastDue,
    canceled: SubscriptionStatus.Canceled,
    unpaid: SubscriptionStatus.Unpaid,
    paused: SubscriptionStatus.Paused,
  };
  return map[status] || SubscriptionStatus.Active;
}

// --- SESSION → DOMAIN MAPPERS (for redirect-based checkout flows) ---

export function mapSessionToCheckoutResult(session: Stripe.Checkout.Session) {
  return {
    id: session.id,
    expiresAt: session.expires_at
      ? new Date(session.expires_at * 1000).toISOString()
      : undefined,
  };
}

// --- STRIPE OBJECT → DOMAIN MAPPERS ---

export function mapStripePaymentToPayment(pi: Stripe.PaymentIntent): Payment {
  // extract refund amount from the latest charge when expanded
  let amountRefunded = 0;
  if (pi.latest_charge && typeof pi.latest_charge === "object") {
    amountRefunded = (pi.latest_charge as Stripe.Charge).amount_refunded || 0;
  }

  return {
    id: pi.id,
    providerId: "stripe",
    externalId: pi.id,
    amount: pi.amount,
    amountRefunded,
    currency: pi.currency.toUpperCase(),
    status: mapStripeStatusToPaymentStatus(pi.status),
    customerId: typeof pi.customer === "string" ? pi.customer : pi.customer?.id,
    createdAt: new Date(pi.created * 1000).toISOString(),
    raw: pi,
  };
}

export function mapStripeSubscriptionToSubscription(
  rawSub: Stripe.Subscription,
): Subscription {
  const sub = rawSub as StripeSubscriptionWithPeriods;
  const price = sub.items.data[0]?.price;

  // safe fallbacks: current_period fields aren't in the SDK types but exist at runtime
  const periodStartTs =
    sub.current_period_start ?? sub.start_date ?? sub.created;
  const periodEndTs =
    sub.current_period_end ?? sub.billing_cycle_anchor ?? sub.created;

  return {
    id: sub.id,
    providerId: "stripe",
    externalId: sub.id,
    status: mapStripeSubStatusToSubscriptionStatus(sub.status),

    amount: price?.unit_amount || 0,
    currency: sub.currency.toUpperCase(),
    interval: (price?.recurring?.interval as any) || "month",

    customerId:
      typeof sub.customer === "string" ? sub.customer : sub.customer?.id || "",

    currentPeriodStart: new Date(periodStartTs * 1000).toISOString(),
    currentPeriodEnd: new Date(periodEndTs * 1000).toISOString(),

    cancelAtPeriodEnd: sub.cancel_at_period_end,
    startedAt: new Date(sub.start_date * 1000).toISOString(),
    canceledAt: sub.canceled_at
      ? new Date(sub.canceled_at * 1000).toISOString()
      : undefined,

    raw: sub,
  };
}

export function mapStripeCustomerToCustomer(
  cust: Stripe.Customer | Stripe.DeletedCustomer,
): Customer {
  if (cust.deleted) {
    return {
      id: cust.id,
      providerId: "stripe",
      externalId: cust.id,
      email: "",
      createdAt: new Date().toISOString(),
      metadata: { deleted: "true" },
    };
  }

  const c = cust as Stripe.Customer;

  return {
    id: c.id,
    providerId: "stripe",
    externalId: c.id,
    email: c.email || "",
    name: c.name || undefined,
    phone: c.phone || undefined,
    metadata: c.metadata,
    createdAt: new Date(c.created * 1000).toISOString(),
  };
}

// --- PAYMENT METHOD MAPPERS ---

export function mapStripePaymentMethodToPaymentMethod(
  pm: Stripe.PaymentMethod,
  defaultPaymentMethodId?: string | null,
): PaymentMethod {
  let details: PaymentMethodDetails = { type: "card" };

  if (pm.type === "card" && pm.card) {
    details = {
      type: "card",
      brand: pm.card.brand,
      last4: pm.card.last4,
      expiryMonth: pm.card.exp_month,
      expiryYear: pm.card.exp_year,
      cardHolderName: pm.billing_details?.name || undefined,
    };
  } else if (pm.type === "us_bank_account") {
    details = { type: "bank_transfer", brand: "ach" };
  }

  return {
    id: pm.id,
    customerId:
      typeof pm.customer === "string" ? pm.customer : pm.customer?.id || "",
    externalId: pm.id,
    type: "card",
    details: details,
    isDefault: !!defaultPaymentMethodId && pm.id === defaultPaymentMethodId,
    metadata: pm.metadata || {},
  };
}

export function mapAddressToStripe(
  addr?: Address,
): Stripe.AddressParam | undefined {
  if (!addr) return undefined;
  return {
    line1: addr.line1,
    line2: addr.line2,
    city: addr.city,
    state: addr.state,
    postal_code: addr.postalCode,
    country: addr.country,
  };
}

/**
 * maps stripe sdk errors to revstack error codes
 */
export function mapStripeError(error: unknown): {
  code: RevstackErrorCode;
  message: string;
  providerError?: string;
} {
  if (error instanceof Stripe.errors.StripeError) {
    const msg = error.message;
    const stripeCode = error.code;

    // 1. try by specific error code
    const mappedCode = stripeCode ? ERROR_CODE_MAP[stripeCode] : undefined;
    if (mappedCode) {
      return {
        code: mappedCode,
        message: msg,
        providerError: stripeCode,
      };
    }

    // 2. try by error type
    const mappedType = ERROR_TYPE_MAP[error.type];
    if (mappedType) {
      return {
        code: mappedType,
        message: msg,
        providerError: stripeCode,
      };
    }

    return {
      code: RevstackErrorCode.UnknownError,
      message: msg,
      providerError: stripeCode,
    };
  }

  return {
    code: RevstackErrorCode.UnknownError,
    message: (error as Error).message || "Unknown error",
  };
}
