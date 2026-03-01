import { PolarProvider } from "@/provider";
import { ProviderContext, runSmoke } from "@revstackhq/providers-core";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env.test") });

if (!process.env.POLAR_ACCESS_TOKEN || !process.env.POLAR_ORGANIZATION_ID) {
  console.error(
    "❌ Missing POLAR_ACCESS_TOKEN or POLAR_ORGANIZATION_ID in .env.test",
  );
  process.exit(1);
}

const provider = new PolarProvider();

const ctx: ProviderContext = {
  isTestMode: true,
  traceId: `smoke-${Date.now()}`,
  idempotencyKey: `idem-${Date.now()}`,
  config: {
    accessToken: process.env.POLAR_ACCESS_TOKEN,
    organizationId: process.env.POLAR_ORGANIZATION_ID,
  },
};

const FIXTURES = {
  webhookUrl:
    process.env.POLAR_WEBHOOK_URL || "https://webhook.site/polar-test",
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET || "polar_whs_dummy",
  webhookEndpointId: process.env.POLAR_WEBHOOK_ENDPOINT_ID || "dummy_endpoint",
  customerId: "cust_dummy",
  subscriptionId: "sub_dummy",
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

    getPayment: async (ctx) => provider.getPayment(ctx, "pmt_dummy"),

    createSubscription: async (ctx) =>
      provider.createSubscription(ctx, {
        customerId: FIXTURES.customerId,
        priceId: "price_dummy",
      }),

    cancelSubscription: async (ctx) =>
      provider.cancelSubscription(ctx, FIXTURES.subscriptionId),

    verifyWebhookSignature: async (ctx) =>
      provider.verifyWebhookSignature(
        ctx,
        JSON.stringify({ id: "evt_test", type: "checkout.created" }),
        {
          "webhook-id": "msg_xxx",
          "webhook-timestamp": "123",
          "webhook-signature": "v1,bad_signature",
        },
        FIXTURES.webhookSecret,
      ),
  },
  manifest: PolarProvider.manifest,
});
