import { ProviderClient } from "@/clients/interface";
import {
  ProviderContext,
  CreatePaymentInput,
  RefundPaymentInput,
  PaginationOptions,
  CreateSubscriptionInput,
  UpdateSubscriptionInput,
  CheckoutSessionInput,
  BillingPortalInput,
  SetupPaymentMethodInput,
  CreateCustomerInput,
  UpdateCustomerInput,
  CreateAddonInput,
  UpdateAddonInput,
  DeleteAddonInput,
} from "@revstackhq/providers-core";

import * as payments from "@/clients/v1/payments";
import * as subscriptions from "@/clients/v1/subscriptions";
import * as checkout from "@/clients/v1/checkout";
import * as customers from "@/clients/v1/customers";
import * as webhooks from "@/clients/v1/webhooks";
import * as addons from "@/clients/v1/addons";
import * as paymentMethods from "@/clients/v1/payment-methods";

export class PolarClientV1 implements ProviderClient {
  // ===========================================================================
  // LIFECYCLE & WEBHOOKS
  // ===========================================================================

  validateCredentials(ctx: ProviderContext) {
    return webhooks.validateCredentials(ctx);
  }

  setupWebhooks(ctx: ProviderContext, webhookUrl: string) {
    return webhooks.setupWebhooks(ctx, webhookUrl);
  }

  removeWebhooks(ctx: ProviderContext, webhookId: string) {
    return webhooks.removeWebhooks(ctx, webhookId);
  }

  verifyWebhookSignature(
    ctx: ProviderContext,
    payload: string | Buffer,
    headers: Record<string, string | string[] | undefined>,
    secret: string,
  ) {
    return webhooks.verifyWebhookSignature(ctx, payload, headers, secret);
  }

  parseWebhookEvent(payload: unknown) {
    return webhooks.parseWebhookEvent(payload);
  }

  listPaymentMethods(ctx: ProviderContext, customerId: string) {
    return paymentMethods.listPaymentMethods(ctx, customerId);
  }

  deletePaymentMethod(ctx: ProviderContext, id: string) {
    return paymentMethods.deletePaymentMethod(ctx, id);
  }

  // ===========================================================================
  // PAYMENTS
  // ===========================================================================

  createPayment(ctx: ProviderContext, input: CreatePaymentInput) {
    return payments.createPayment(ctx, input, checkout.createCheckoutSession);
  }

  getPayment(ctx: ProviderContext, id: string) {
    return payments.getPayment(ctx, id);
  }

  refundPayment(ctx: ProviderContext, input: RefundPaymentInput) {
    return payments.refundPayment(ctx, input);
  }

  listPayments(ctx: ProviderContext, pagination: PaginationOptions) {
    return payments.listPayments(ctx, pagination);
  }

  capturePayment(ctx: ProviderContext, id: string, amount?: number) {
    return payments.capturePayment(ctx, id, amount);
  }

  // ===========================================================================
  // SUBSCRIPTIONS
  // ===========================================================================

  createSubscription(ctx: ProviderContext, input: CreateSubscriptionInput) {
    return subscriptions.createSubscription(
      ctx,
      input,
      checkout.createCheckoutSession,
    );
  }

  getSubscription(ctx: ProviderContext, id: string) {
    return subscriptions.getSubscription(ctx, id);
  }

  cancelSubscription(ctx: ProviderContext, id: string, reason?: string) {
    return subscriptions.cancelSubscription(ctx, id, reason);
  }

  pauseSubscription(ctx: ProviderContext, id: string) {
    return subscriptions.pauseSubscription(ctx, id);
  }

  resumeSubscription(ctx: ProviderContext, id: string) {
    return subscriptions.resumeSubscription(ctx, id);
  }

  listSubscriptions(ctx: ProviderContext, pagination: PaginationOptions) {
    return subscriptions.listSubscriptions(ctx, pagination);
  }

  updateSubscription(
    ctx: ProviderContext,
    id: string,
    input: UpdateSubscriptionInput,
  ) {
    return subscriptions.updateSubscription(ctx, id, input);
  }

  // ===========================================================================
  // CHECKOUT
  // ===========================================================================

  createCheckoutSession(ctx: ProviderContext, input: CheckoutSessionInput) {
    return checkout.createCheckoutSession(ctx, input);
  }

  setupPaymentMethod(ctx: ProviderContext, input: SetupPaymentMethodInput) {
    return checkout.setupPaymentMethod(ctx, input);
  }

  createBillingPortalSession(ctx: ProviderContext, input: BillingPortalInput) {
    return checkout.createBillingPortalSession(ctx, input);
  }

  // ===========================================================================
  // CUSTOMERS
  // ===========================================================================

  createCustomer(ctx: ProviderContext, input: CreateCustomerInput) {
    return customers.createCustomer(ctx, input);
  }

  updateCustomer(ctx: ProviderContext, id: string, input: UpdateCustomerInput) {
    return customers.updateCustomer(ctx, id, input);
  }

  deleteCustomer(ctx: ProviderContext, id: string) {
    return customers.deleteCustomer(ctx, id);
  }

  getCustomer(ctx: ProviderContext, id: string) {
    return customers.getCustomer(ctx, id);
  }

  listCustomers(ctx: ProviderContext, pagination: PaginationOptions) {
    return customers.listCustomers(ctx, pagination);
  }

  // ===========================================================================
  // ADDONS
  // ===========================================================================

  createAddon(ctx: ProviderContext, input: CreateAddonInput) {
    return addons.createAddon(ctx, input);
  }

  getAddon(ctx: ProviderContext, id: string) {
    return addons.getAddon(ctx, id);
  }

  updateAddon(ctx: ProviderContext, id: string, input: UpdateAddonInput) {
    return addons.updateAddon(ctx, id, input);
  }

  deleteAddon(ctx: ProviderContext, input: DeleteAddonInput) {
    return addons.deleteAddon(ctx, input);
  }

  listAddons(
    ctx: ProviderContext,
    subscriptionId: string,
    pagination: PaginationOptions,
  ) {
    return addons.listAddons(ctx, subscriptionId, pagination);
  }
}
