import { StripeProvider } from "@/provider";
import {
  ProviderContext,
  RevstackErrorCode,
  runSmoke,
} from "@revstackhq/providers-core";
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
  customerId: process.env.STRIPE_CUSTOMER_ID!,
  paymentMethodId: process.env.STRIPE_PAYMENT_METHOD_ID!,
  subscriptionId: process.env.STRIPE_SUBSCRIPTION_ID!,
  paymentId: process.env.STRIPE_PAYMENT_ID!,
  priceId: process.env.STRIPE_PRICE_ID!,
  successUrl: process.env.STRIPE_SUCCESS_URL!,
  cancelUrl: process.env.STRIPE_CANCEL_URL!,
  returnUrl: process.env.STRIPE_RETURN_URL!,
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
        JSON.stringify({ id: "evt_test", type: "payment_intent.succeeded" }),
        { "stripe-signature": "t=123,v1=bad_signature" },
        FIXTURES.webhookSecret,
      );
      console.log("[verifyWebhookSignature]", res);
      return res;
    },
    parseWebhookEvent: async (ctx) => {
      const res = await provider.parseWebhookEvent(ctx, {
        // 🔥 ENVOLTURA REAL DE STRIPE EVENT
        id: "evt_test_123",
        type: "checkout.session.completed",
        created: 1772512043,
        data: {
          object: {
            id: "cs_test_a1QMPokmxpdeIQEDnVOA257mZRsj65y9K92FfdV87UIwylz0yW07o6ItsC",
            object: "checkout.session",
            adaptive_pricing: {
              enabled: true,
            },
            after_expiration: null,
            allow_promotion_codes: null,
            amount_subtotal: 24900,
            amount_total: 24900,
            automatic_tax: {
              enabled: false,
              liability: null,
              provider: null,
              status: null,
            },
            billing_address_collection: "auto",
            branding_settings: {
              background_color: "#ffffff",
              border_style: "rounded",
              button_color: "#0074d4",
              display_name: "Revstack",
              font_family: "default",
              icon: null,
              logo: null,
            },
            cancel_url: "https://example.com/cancel",
            client_reference_id: "test",
            client_secret: null,
            collected_information: {
              business_name: null,
              individual_name: null,
              shipping_details: null,
            },
            consent: null,
            consent_collection: null,
            created: 1772512043,
            currency: "usd",
            currency_conversion: null,
            custom_fields: [],
            custom_text: {
              after_submit: null,
              shipping_address: null,
              submit: null,
              terms_of_service_acceptance: null,
            },
            customer: "cus_U4uNwICzkKm3Fw",
            customer_account: null,
            customer_creation: null,
            customer_details: {
              address: {
                city: null,
                country: "AR",
                line1: null,
                line2: null,
                postal_code: null,
                state: null,
              },
              business_name: null,
              email: "test-payment@revstack.dev",
              individual_name: null,
              name: "Facundo Lavagnino",
              phone: null,
              tax_exempt: "none",
              tax_ids: [],
            },
            customer_email: null,
            discounts: [],
            expires_at: 1772598442,
            invoice: null,
            invoice_creation: {
              enabled: false,
              invoice_data: {
                account_tax_ids: null,
                custom_fields: null,
                description: null,
                footer: null,
                issuer: null,
                metadata: {},
                rendering_options: null,
              },
            },
            livemode: false,
            locale: null,
            metadata: {
              revstack_addon: "1k-tokens",
              revstack_plan: "pro",
              revstack_trace_id: "smoke-1772512041574",
              trace_id: "smoke-1772512041574",
            },
            mode: "payment",
            origin_context: null,
            payment_intent: "pi_3T6kZMAlYb77eHnG1e50Jkyu",
            payment_link: null,
            payment_method_collection: "if_required",
            payment_method_configuration_details: {
              id: "pmc_1ReBs5AlYb77eHnGF8gjrKYZ",
              parent: null,
            },
            payment_method_options: {
              card: {
                request_three_d_secure: "automatic",
              },
            },
            payment_method_types: ["card", "link", "cashapp", "amazon_pay"],
            payment_status: "paid",
            permissions: null,
            phone_number_collection: {
              enabled: false,
            },
            recovered_from: null,
            saved_payment_method_options: {
              allow_redisplay_filters: ["always"],
              payment_method_remove: "disabled",
              payment_method_save: null,
            },
            setup_intent: null,
            shipping_address_collection: null,
            shipping_cost: null,
            shipping_details: null,
            shipping_options: [],
            status: "complete",
            submit_type: null,
            subscription: null,
            success_url:
              "https://example.com/return?session_id={CHECKOUT_SESSION_ID}",
            total_details: {
              amount_discount: 0,
              amount_shipping: 0,
              amount_tax: 0,
            },
            ui_mode: "hosted",
            url: null,
            wallet_options: null,
          },
          previous_attributes: null,
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
      const res = await provider.getCustomer(ctx, FIXTURES.customerId);
      console.log("[getCustomer]", res);
      return res;
    },
    updateCustomer: async (ctx) => {
      const res = await provider.updateCustomer(ctx, FIXTURES.customerId, {
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
      const res = await provider.deleteCustomer(ctx, FIXTURES.customerId);
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
        email: "test-payment@revstack.dev",
        name: "Revstack Founding Member",
      });

      if (!customerRes.data) {
        throw new Error("Failed to create test customer for payment");
      }

      const realCustomerId = customerRes.data;

      const payCtx = { ...ctx, idempotencyKey: `idem-pay-${Date.now()}` };
      const res = await provider.createPayment(payCtx, {
        clientReferenceId: "test",
        customerId: realCustomerId,
        returnUrl: FIXTURES.returnUrl,
        cancelUrl: FIXTURES.cancelUrl,
        metadata: {
          revstack_plan: "pro",
          revstack_addon: "1k-tokens",
          trace_id: ctx.traceId,
        },
        statementDescriptor: "REVSTACK",
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
      const res = await provider.getPayment(ctx, FIXTURES.paymentId);
      console.log("[getPayment]", res);
      return res;
    },
    capturePayment: async (ctx) => {
      const res = await provider.capturePayment(ctx, FIXTURES.paymentId);
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
      const res = await provider.listPaymentMethods(ctx, FIXTURES.customerId);
      console.log("[listPaymentMethods]", res);
      return res;
    },
    deletePaymentMethod: async (ctx) => {
      const res = await provider.deletePaymentMethod(
        ctx,
        FIXTURES.paymentMethodId,
      );
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
        email: "sub-test@revstack.com",
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
      const res = await provider.getSubscription(ctx, FIXTURES.subscriptionId);
      console.log("[getSubscription]", res);
      return res;
    },
    updateSubscription: async (ctx) => {
      const res = await provider.updateSubscription(
        ctx,
        FIXTURES.subscriptionId,
        {
          lineItems: [{ priceId: FIXTURES.priceId, quantity: 2 }],
        },
      );
      console.log("[updateSubscription]", res);
      return res;
    },
    pauseSubscription: async (ctx) => {
      const res = await provider.pauseSubscription(
        ctx,
        FIXTURES.subscriptionId,
      );
      console.log("[pauseSubscription]", res);
      return res;
    },
    resumeSubscription: async (ctx) => {
      const res = await provider.resumeSubscription(
        ctx,
        FIXTURES.subscriptionId,
      );
      console.log("[resumeSubscription]", res);
      return res;
    },
    listSubscriptions: async (ctx) => {
      const res = await provider.listSubscriptions(ctx, { limit: 10 });
      console.log("[listSubscriptions]", res);
      return res;
    },
    cancelSubscription: async (ctx) => {
      const res = await provider.cancelSubscription(
        ctx,
        FIXTURES.subscriptionId,
      );
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
  manifest: StripeProvider.manifest,
});
