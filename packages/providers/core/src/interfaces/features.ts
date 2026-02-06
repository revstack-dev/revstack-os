/**
 * src/interfaces/features.ts
 * * Defines the specific capabilities a provider can implement.
 * This adheres to the Interface Segregation Principle.
 */

import { ProviderContext } from "@/context";
import {
  CreatePaymentInput,
  PaymentResult,
  CreateSubscriptionInput,
  SubscriptionResult,
  CheckoutSessionInput,
  CheckoutSessionResult,
} from "@/types/models";

/**
 * Contract for providers that support one-time payments.
 */
export interface IPaymentFeature {
  createPayment(
    ctx: ProviderContext,
    input: CreatePaymentInput,
  ): Promise<PaymentResult>;
  getPayment(ctx: ProviderContext, id: string): Promise<PaymentResult>;
  // refundPayment(...): Promise<...>; // Future extension
}

/**
 * Contract for providers that support native recurring billing.
 * (e.g., Stripe, Paddle, but NOT simple bank transfers).
 */
export interface ISubscriptionFeature {
  createSubscription(
    ctx: ProviderContext,
    input: CreateSubscriptionInput,
  ): Promise<SubscriptionResult>;

  cancelSubscription(
    ctx: ProviderContext,
    id: string,
    reason?: string,
  ): Promise<SubscriptionResult>;

  pauseSubscription(
    ctx: ProviderContext,
    id: string,
    reason?: string,
  ): Promise<SubscriptionResult>;

  resumeSubscription(
    ctx: ProviderContext,
    id: string,
    reason?: string,
  ): Promise<SubscriptionResult>;
}

/**
 * Contract for providers that offer a hosted checkout page.
 */
export interface ICheckoutFeature {
  createCheckoutSession(
    ctx: ProviderContext,
    input: CheckoutSessionInput,
  ): Promise<CheckoutSessionResult>;
}

/**
 * The unified contract that all Revstack Providers must technically satisfy.
 * * Even if a provider doesn't support a feature, it must implement the interface
 * (usually by throwing a 'Not Implemented' error via the BaseProvider).
 */
export interface IProvider
  extends IPaymentFeature, ISubscriptionFeature, ICheckoutFeature {
  // Common lifecycle methods or utility methods can be defined here if needed,
  // but usually those are handled by the Abstract Base Class.
}
