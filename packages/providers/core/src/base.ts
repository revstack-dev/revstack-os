/**
 * src/base.ts
 * * The Foundation of the Provider Development Kit (PDK).
 */

import { ProviderManifest } from "@/manifest";
import { ProviderContext } from "@/context";
import { InstallInput, InstallResult } from "@/types/lifecycle";
import { RevstackEvent, WebhookResponse } from "@/types/events";
import { IProvider } from "@/interfaces/features";
import {
  CreatePaymentInput,
  PaymentResult,
  CreateSubscriptionInput,
  SubscriptionResult,
  CheckoutSessionInput,
  CheckoutSessionResult,
} from "@/types/models";

/**
 * The Abstract Base Class for all Revstack Providers.
 * * It implements the IProvider interface with default behaviors (throwing errors).
 * Specific providers (e.g., Stripe) will override only the methods they actually support.
 */
export abstract class BaseProvider implements IProvider {
  /**
   * The static manifest definition.
   * Defines capabilities, metadata, and config schema (UI).
   */
  abstract readonly manifest: ProviderManifest;

  // ===========================================================================
  // LIFECYCLE METHODS
  // ===========================================================================

  /**
   * Called when a merchant installs or updates this provider.
   * * RESPONSIBILITY:
   * 1. Instantiate the provider SDK with the input config.
   * 2. Validate credentials (e.g., make a 'ping' or 'get balance' request).
   * 3. Return the payload to be saved in the database.
   * * @param ctx - The execution context (includes environment info).
   * @param input - The input data provided by the user in the UI.
   * @returns The success status and the data to be stored (encrypted by Core).
   */
  abstract onInstall(
    ctx: ProviderContext,
    input: InstallInput,
  ): Promise<InstallResult>;

  // ===========================================================================
  // WEBHOOK METHODS
  // ===========================================================================

  /**
   * Verifies the cryptographic signature of an incoming webhook.
   * * SECURITY CRITICAL:
   * This ensures that the request actually originated from the Payment Provider
   * and hasn't been tampered with.
   * * @param payload - The raw body of the request (string or buffer).
   * @param headers - The request headers.
   * @param secret - The webhook signing secret stored in the DB.
   */
  abstract verifyWebhookSignature(
    payload: string | Buffer,
    headers: Record<string, string | string[] | undefined>,
    secret: string,
  ): Promise<boolean>;

  /**
   * Transforms a raw provider payload into a standardized Revstack Event.
   * * This acts as the "Translation Layer" or "Adapter" for incoming events.
   * * @param payload - The raw JSON body from the provider.
   * @returns A normalized RevstackEvent or null if the event is irrelevant.
   */
  abstract parseWebhookEvent(payload: any): Promise<RevstackEvent | null>;

  /**
   * Returns the HTTP response that should be sent back to the Provider
   * after receiving a webhook.
   * * Default implementation returns 200 OK. Override if the provider expects
   * a specific XML or JSON confirmation.
   */
  async getWebhookResponse(): Promise<WebhookResponse> {
    return { statusCode: 200, body: { received: true } };
  }

  // ===========================================================================
  // PAYMENT FEATURE IMPLEMENTATION (IProvider)
  // ===========================================================================

  /**
   * Process a one-time payment.
   * Override this if manifest.capabilities.payments.oneTime is true.
   * * @throws Error if not implemented by the specific provider.
   */
  async createPayment(
    ctx: ProviderContext,
    input: CreatePaymentInput,
  ): Promise<PaymentResult> {
    throw new Error(
      `Provider '${this.manifest.slug}' does not support createPayment.`,
    );
  }

  /**
   * Retrieve details of a payment by its ID.
   */
  async getPayment(ctx: ProviderContext, id: string): Promise<PaymentResult> {
    throw new Error(
      `Provider '${this.manifest.slug}' does not support getPayment.`,
    );
  }

  // ===========================================================================
  // SUBSCRIPTION FEATURE IMPLEMENTATION (IProvider)
  // ===========================================================================

  /**
   * Create a recurring subscription.
   * Override this if manifest.capabilities.subscriptions.native is true.
   */
  async createSubscription(
    ctx: ProviderContext,
    input: CreateSubscriptionInput,
  ): Promise<SubscriptionResult> {
    throw new Error(
      `Provider '${this.manifest.slug}' does not support createSubscription.`,
    );
  }

  /**
   * Cancel an active subscription immediately or at period end.
   */
  async cancelSubscription(
    ctx: ProviderContext,
    id: string,
    reason?: string,
  ): Promise<SubscriptionResult> {
    throw new Error(
      `Provider '${this.manifest.slug}' does not support cancelSubscription.`,
    );
  }

  pauseSubscription(
    ctx: ProviderContext,
    id: string,
    reason?: string,
  ): Promise<SubscriptionResult> {
    throw new Error("Method not implemented.");
  }

  resumeSubscription(
    ctx: ProviderContext,
    id: string,
    reason?: string,
  ): Promise<SubscriptionResult> {
    throw new Error("Method not implemented.");
  }

  // ===========================================================================
  // CHECKOUT FEATURE IMPLEMENTATION (IProvider)
  // ===========================================================================

  /**
   * Generate a hosted checkout session URL (e.g., Stripe Checkout).
   * Override this if manifest.capabilities.checkout.supported is true.
   */
  async createCheckoutSession(
    ctx: ProviderContext,
    input: CheckoutSessionInput,
  ): Promise<CheckoutSessionResult> {
    throw new Error(
      `Provider '${this.manifest.slug}' does not support createCheckoutSession.`,
    );
  }
}
