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
  webhookUrl: process.env.POLAR_WEBHOOK_URL!,
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET!,
  webhookEndpointId: process.env.POLAR_WEBHOOK_ENDPOINT_ID!,
  customerId: process.env.POLAR_CUSTOMER_ID!,
  subscriptionId: process.env.POLAR_SUBSCRIPTION_ID!,
  paymentId: process.env.POLAR_PAYMENT_ID!,
  priceId: process.env.POLAR_PRICE_ID!,
  paymentMethodId: process.env.POLAR_PAYMENT_METHOD_ID!,
  successUrl: process.env.POLAR_SUCCESS_URL!,
  cancelUrl: process.env.POLAR_CANCEL_URL!,
  returnUrl: process.env.POLAR_RETURN_URL!,
};

runSmoke({
  provider,
  ctx,
  scenarios: {
    // SETUP / WEBHOOKS
    onInstall: async (ctx) => {
      const res = await provider.onInstall(ctx, {
        webhookUrl: FIXTURES.webhookUrl,
        config: ctx.config,
      });
      console.log("[onInstall]", res);
      return res;
    },
    onUninstall: async (ctx) => {
      const res = await provider.onUninstall(ctx, {
        config: ctx.config,
        data: { webhookEndpointId: FIXTURES.webhookEndpointId },
      });
      console.log("[onUninstall]", res);
      return res;
    },
    verifyWebhookSignature: async (ctx) => {
      const res = await provider.verifyWebhookSignature(
        ctx,
        JSON.stringify({ id: "evt_test", type: "checkout.created" }),
        {
          "webhook-id": "msg_xxx",
          "webhook-timestamp": "123",
          "webhook-signature": "v1,bad_signature",
        },
        FIXTURES.webhookSecret,
      );
      console.log("[verifyWebhookSignature]", res);
      return res;
    },
    parseWebhookEvent: async (ctx) => {
      const res = await provider.parseWebhookEvent(ctx, {
        id: "evt_polar_test_123",
        type: "order.created",
        created_at: new Date().toISOString(),
        data: {
          id: "order_test_abc",
          product_id: "prod_test_123",
          customer_id: "cust_test_456",
          amount: 24900,
          currency: "usd",
          status: "paid",
          metadata: {
            revstack_plan: "pro",
            revstack_trace_id: "smoke-test",
          },
        },
      });
      console.log("[parseWebhookEvent]", res);
      return res;
    },
    getWebhookResponse: async () => {
      const res = await provider.getWebhookResponse();
      console.log("[getWebhookResponse]", res);
      return res;
    },

    // CUSTOMERS
    createCustomer: async (ctx) => {
      const res = await provider.createCustomer(ctx, {
        email: "smoke@example.com",
        name: "Smoke Test User",
      });
      console.log("[createCustomer]", res);
      return res;
    },
    getCustomer: async (ctx) => {
      const res = await provider.getCustomer(ctx, { id: FIXTURES.customerId });
      console.log("[getCustomer]", res);
      return res;
    },
    updateCustomer: async (ctx) => {
      const res = await provider.updateCustomer(ctx, {
        id: FIXTURES.customerId,
        name: "Smoke Test User Updated",
      });
      console.log("[updateCustomer]", res);
      return res;
    },
    listCustomers: async (ctx) => {
      const res = await provider.listCustomers(ctx, { limit: 10 });
      console.log("[listCustomers]", res);
      return res;
    },
    deleteCustomer: async (ctx) => {
      const res = await provider.deleteCustomer(ctx, {
        id: FIXTURES.customerId,
      });
      console.log("[deleteCustomer]", res);
      return res;
    },

    // PAYMENTS
    createPayment: async (ctx) => {
      const customerCtx = {
        ...ctx,
        idempotencyKey: `idem-cust-pay-${Date.now()}`,
      };

      const customerRes = await provider.createCustomer(customerCtx, {
        email: `test-payment-${Date.now()}@revstack.dev`,
        name: `Revstack Founding Member ${Date.now()}`,
        address: {
          country: "US",
          state: "CA",
          city: "San Francisco",
          postalCode: "94105",
          line1: "123 Main St",
          line2: "Apt 4B",
        },
      });

      if (!customerRes.data) {
        throw new Error("Failed to create test customer for payment");
      }

      const realCustomerId = customerRes.data;

      const payCtx = { ...ctx, idempotencyKey: `idem-pay-${Date.now()}` };
      const res = await provider.createPayment(payCtx, {
        clientReferenceId: `test-${Date.now()}`,
        customerId: realCustomerId,
        returnUrl: FIXTURES.returnUrl,
        cancelUrl: FIXTURES.cancelUrl,
        metadata: {
          revstack_plan: "pro",
          revstack_addon: "1k-tokens",
          trace_id: ctx.traceId,
        },
        lineItems: [
          {
            name: "Revstack Founding Member Tier 2",
            description: "Founding Member Tier 2",
            amount: 24900,
            currency: "USD",
            quantity: 1,
          },
        ],
      });

      console.log("[createPayment]", res);
      return res;
    },
    getPayment: async (ctx) => {
      const res = await provider.getPayment(ctx, { id: FIXTURES.paymentId });
      console.log("[getPayment]", res);
      return res;
    },
    capturePayment: async (ctx) => {
      const res = await provider.capturePayment(ctx, {
        id: FIXTURES.paymentId,
      });
      console.log("[capturePayment]", res);
      return res;
    },
    refundPayment: async (ctx) => {
      const res = await provider.refundPayment(ctx, {
        paymentId: FIXTURES.paymentId,
        amount: 1000,
        reason: "requested_by_customer",
      });
      console.log("[refundPayment]", res);
      return res;
    },
    listPayments: async (ctx) => {
      const res = await provider.listPayments(ctx, { limit: 10, page: 1 });
      console.log("[listPayments]", res);
      return res;
    },

    // PAYMENT METHODS
    listPaymentMethods: async (ctx) => {
      const res = await provider.listPaymentMethods(ctx, {
        customerId: FIXTURES.customerId,
      });
      console.log("[listPaymentMethods]", res);
      return res;
    },
    deletePaymentMethod: async (ctx) => {
      const res = await provider.deletePaymentMethod(ctx, {
        id: FIXTURES.paymentMethodId,
      });
      console.log("[deletePaymentMethod]", res);
      return res;
    },
    setupPaymentMethod: async (ctx) => {
      const res = await provider.setupPaymentMethod(ctx, {
        customerId: FIXTURES.customerId,
        returnUrl: FIXTURES.successUrl,
        cancelUrl: FIXTURES.cancelUrl,
      });
      console.log("[setupPaymentMethod]", res);
      return res;
    },

    // SUBSCRIPTIONS
    createSubscription: async (ctx) => {
      const customerCtx = { ...ctx, idempotencyKey: `idem-cust-${Date.now()}` };
      const customerRes = await provider.createCustomer(customerCtx, {
        email: `test-sub-${Date.now()}@revstack.dev`,
        name: `Revstack Test Sub ${Date.now()}`,
        address: {
          country: "US",
          state: "CA",
          city: "San Francisco",
          postalCode: "94105",
          line1: "123 Main St",
          line2: "Apt 4B",
        },
      });

      if (!customerRes.data) {
        throw new Error("Failed to create test customer");
      }

      const realCustomerId = customerRes.data;

      console.log("[createCustomer]", realCustomerId);

      const subCtx = { ...ctx, idempotencyKey: `idem-sub-${Date.now()}` };
      const res = await provider.createSubscription(subCtx, {
        customerId: realCustomerId,
        returnUrl: FIXTURES.returnUrl,
        cancelUrl: FIXTURES.cancelUrl,
        allowPromotionCodes: true,
        promotionCodeId: "f7be8dd3-a48d-43b6-817b-07a8ae1e519f",
        trialInterval: "month",
        trialIntervalCount: 1,
        successUrl: FIXTURES.successUrl,
        lineItems: [
          {
            name: "Pro Plan",
            amount: 21900,
            currency: "USD",
            interval: "month",
            quantity: 1,
          },
          {
            name: "1k Tokens Addon",
            amount: 1000,
            currency: "USD",
            interval: "month",
            quantity: 5,
          },
        ],
      });
      console.log("[createSubscription]", res);
      return res;
    },
    getSubscription: async (ctx) => {
      const res = await provider.getSubscription(ctx, {
        id: FIXTURES.subscriptionId,
      });
      console.log("[getSubscription]", res);
      return res;
    },
    updateSubscription: async (ctx) => {
      const res = await provider.updateSubscription(ctx, {
        id: FIXTURES.subscriptionId,
        lineItems: [{ priceId: FIXTURES.priceId, quantity: 2 }],
      });
      console.log("[updateSubscription]", res);
      return res;
    },
    pauseSubscription: async (ctx) => {
      const res = await provider.pauseSubscription(ctx, {
        id: FIXTURES.subscriptionId,
      });
      console.log("[pauseSubscription]", res);
      return res;
    },
    resumeSubscription: async (ctx) => {
      const res = await provider.resumeSubscription(ctx, {
        id: FIXTURES.subscriptionId,
      });
      console.log("[resumeSubscription]", res);
      return res;
    },
    listSubscriptions: async (ctx) => {
      const res = await provider.listSubscriptions(ctx, { limit: 10 });
      console.log("[listSubscriptions]", res);
      return res;
    },
    cancelSubscription: async (ctx) => {
      const res = await provider.cancelSubscription(ctx, {
        id: FIXTURES.subscriptionId,
      });
      console.log("[cancelSubscription]", res);
      return res;
    },

    // CHECKOUT / BILLING PORTAL
    createCheckoutSession: async (ctx) => {
      const res = await provider.createCheckoutSession(ctx, {
        customerId: FIXTURES.customerId,
        lineItems: [{ priceId: FIXTURES.priceId, quantity: 1 }],
        successUrl: FIXTURES.successUrl,
        cancelUrl: FIXTURES.cancelUrl,
        mode: "payment",
      });
      console.log("[createCheckoutSession]", res);
      return res;
    },
    createBillingPortalSession: async (ctx) => {
      const res = await provider.createBillingPortalSession(ctx, {
        customerId: FIXTURES.customerId,
        returnUrl: FIXTURES.returnUrl,
      });
      console.log("[createBillingPortalSession]", res);
      return res;
    },
  },
  manifest: PolarProvider.manifest,
});
