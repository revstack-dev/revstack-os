import { StripeProvider } from "@/provider";
import { ProviderContext, runSmoke } from "@revstackhq/providers-core";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env.test") });

if (!process.env.STRIPE_SECRET_KEY) {
  console.error("❌ Missing STRIPE_SECRET_KEY in .env.test");
  process.exit(1);
}

const provider = new StripeProvider();

const ctx: ProviderContext = {
  isTestMode: true,
  traceId: `smoke-${Date.now()}`,
  idempotencyKey: `idem-${Date.now()}`,
  config: {
    apiKey: process.env.STRIPE_SECRET_KEY,
  },
};

const FIXTURES = {
  webhookUrl: process.env.STRIPE_WEBHOOK_URL!,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
  webhookEndpointId: process.env.STRIPE_WEBHOOK_ENDPOINT_ID!,
  customerId: "cus_Rlg...",
  paymentMethodId: "pm_card_visa",
  subscriptionId: "sub_1Q...",
  paymentId: "pi_3Q...",
};

runSmoke({
  provider,
  ctx,
  scenarios: {
    onInstall: async (ctx) =>
      provider.onInstall(ctx, {
        webhookUrl: FIXTURES.webhookUrl,
        config: ctx.config,
      }),

    onUninstall: async (ctx) =>
      provider.onUninstall(ctx, {
        config: ctx.config,
        data: { webhookEndpointId: FIXTURES.webhookEndpointId },
      }),

    createPayment: async (ctx) =>
      provider.createPayment(ctx, {
        amount: 2000,
        currency: "USD",
        customerId: FIXTURES.customerId,
        description: "Smoke Test from CLI",
        capture: true,
      }),

    getPayment: async (ctx) => provider.getPayment(ctx, FIXTURES.paymentId),

    createSubscription: async (ctx) =>
      provider.createSubscription(ctx, {
        customerId: FIXTURES.customerId,
        priceId: "price_1Q...",
      }),

    cancelSubscription: async (ctx) =>
      provider.cancelSubscription(ctx, FIXTURES.subscriptionId),

    verifyWebhookSignature: async (ctx) =>
      provider.verifyWebhookSignature(
        ctx,
        JSON.stringify({ id: "evt_test", type: "payment_intent.succeeded" }),
        { "stripe-signature": "t=123,v1=bad_signature" },
        FIXTURES.webhookSecret,
      ),
  },
  manifest: StripeProvider.manifest,
});
