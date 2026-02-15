import {
  Address,
  Customer,
  Payment,
  PaymentMethod,
  PaymentMethodDetails,
  PaymentStatus,
  Subscription,
  SubscriptionStatus,
} from "@revstackhq/providers-core";
import Stripe from "stripe";

export function mapStripeStatusToPaymentStatus(status: string): PaymentStatus {
  const map: Record<string, PaymentStatus> = {
    succeeded: PaymentStatus.Succeeded,
    requires_payment_method: PaymentStatus.Pending,
    requires_confirmation: PaymentStatus.Pending,
    requires_action: PaymentStatus.Pending,
    canceled: PaymentStatus.Canceled,
    processing: PaymentStatus.Pending,
  };
  return map[status] || PaymentStatus.Pending;
}

export function mapSessionToPaymentResult(
  session: Stripe.Checkout.Session,
  amount: number,
  currency: string,
  customerId?: string,
): Payment {
  return {
    id: session.id,
    providerId: "stripe",
    externalId: session.id,
    status: PaymentStatus.Pending,
    amount: amount,
    amountRefunded: 0,
    currency: currency.toUpperCase(),
    customerId: customerId,
    createdAt: new Date().toISOString(),
    raw: session,
  };
}

export function mapSessionToSubscriptionResult(
  session: Stripe.Checkout.Session,
  customerId: string,
): Subscription {
  return {
    id: "sess_" + session.id,
    providerId: "stripe",
    externalId: session.id,
    status: SubscriptionStatus.Incomplete,
    amount: session.amount_total || 0,
    currency: session.currency?.toUpperCase() || "USD",
    interval: "month",
    customerId: customerId,
    currentPeriodStart: new Date().toISOString(),
    currentPeriodEnd: new Date().toISOString(),
    cancelAtPeriodEnd: false,
    startedAt: new Date().toISOString(),
    raw: session,
  };
}

export function mapSessionToCheckoutResult(session: Stripe.Checkout.Session) {
  return {
    id: session.id,
    expiresAt: session.expires_at
      ? new Date(session.expires_at * 1000).toISOString()
      : undefined,
  };
}

export function mapStripePaymentToPayment(pi: Stripe.PaymentIntent): Payment {
  return {
    id: pi.id,
    providerId: "stripe",
    externalId: pi.id,
    amount: pi.amount,
    amountRefunded: 0,
    currency: pi.currency.toUpperCase(),
    status: mapStripeStatusToPaymentStatus(pi.status),
    customerId: typeof pi.customer === "string" ? pi.customer : pi.customer?.id,
    createdAt: new Date(pi.created * 1000).toISOString(),
    raw: pi,
  };
}

export function mapStripeSubscriptionToSubscription(
  sub: Stripe.Subscription,
): Subscription {
  const price = sub.items.data[0]?.price;

  return {
    id: sub.id,
    providerId: "stripe",
    externalId: sub.id,
    status: sub.status as SubscriptionStatus,

    amount: price?.unit_amount || 0,
    currency: sub.currency.toUpperCase(),
    interval: (price?.recurring?.interval as any) || "month",

    customerId:
      typeof sub.customer === "string" ? sub.customer : sub.customer?.id || "",

    currentPeriodStart: new Date(sub.start_date * 1000).toISOString(),
    currentPeriodEnd: new Date(sub.created * 1000).toISOString(),

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
