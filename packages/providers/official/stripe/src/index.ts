import { manifest } from "@/manifest";
import {
  BaseProvider,
  CheckoutSessionInput,
  CheckoutSessionResult,
  CreatePaymentInput,
  CreateSubscriptionInput,
  InstallInput,
  InstallResult,
  PaymentResult,
  ProviderContext,
  ProviderManifest,
  RevstackEvent,
  SubscriptionResult,
  WebhookResponse,
} from "@revstackhq/providers-core";

export class StripeProvider extends BaseProvider {
  manifest: ProviderManifest = manifest;

  onInstall(ctx: ProviderContext, input: InstallInput): Promise<InstallResult> {
    console.log(input.webhookUrl);
    throw new Error("Method not implemented.");
  }

  verifyWebhookSignature(
    payload: string | Buffer,
    headers: Record<string, string | string[] | undefined>,
    secret: string,
  ): Promise<boolean> {
    throw new Error("Method not implemented.");
  }

  parseWebhookEvent(payload: any): Promise<RevstackEvent | null> {
    throw new Error("Method not implemented.");
  }

  getWebhookResponse(): Promise<WebhookResponse> {
    throw new Error("Method not implemented.");
  }

  createPayment(
    ctx: ProviderContext,
    input: CreatePaymentInput,
  ): Promise<PaymentResult> {
    throw new Error("Method not implemented.");
  }

  getPayment(ctx: ProviderContext, id: string): Promise<PaymentResult> {
    throw new Error("Method not implemented.");
  }

  createSubscription(
    ctx: ProviderContext,
    input: CreateSubscriptionInput,
  ): Promise<SubscriptionResult> {
    throw new Error("Method not implemented.");
  }

  cancelSubscription(
    ctx: ProviderContext,
    id: string,
    reason?: string,
  ): Promise<SubscriptionResult> {
    throw new Error("Method not implemented.");
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

  createCheckoutSession(
    ctx: ProviderContext,
    input: CheckoutSessionInput,
  ): Promise<CheckoutSessionResult> {
    throw new Error("Method not implemented.");
  }
}
