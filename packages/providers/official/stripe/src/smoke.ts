import { StripeProvider } from "@/provider";
import {
  InstallInput,
  ProviderContext,
  UninstallInput,
} from "@revstackhq/providers-core";
import dotenv from "dotenv";

dotenv.config({ path: ".env.test" });

export type SmokeContext = {
  provider: any;
};

export type SmokeScenario = (context: SmokeContext) => Promise<unknown>;

export function getSmokeContext(): SmokeContext {
  const provider = new StripeProvider();
  return { provider };
}

export const scenarios: Record<string, SmokeScenario> = {
  onInstall: async ({ provider }) =>
    provider.onInstall(onInstallParams.ctx, onInstallParams.input),
  onUninstall: async ({ provider }) =>
    provider.onUninstall(onUninstallParams.ctx, onUninstallParams.input),
  createPayment: async ({ provider }) =>
    provider.createPayment({ amount: 1000, currency: "USD" } as any),
  getPayment: async ({ provider }) => provider.getPayment("pay_test_id"),
  createSubscription: async ({ provider }) =>
    provider.createSubscription({
      mode: "native",
      customerId: "cus_123",
    } as any),
  cancelSubscription: async ({ provider }) =>
    provider.cancelSubscription("sub_test_id", "user_request"),
  pauseSubscription: async ({ provider }) =>
    provider.pauseSubscription("sub_test_id", "trial_pause"),
  resumeSubscription: async ({ provider }) =>
    provider.resumeSubscription("sub_test_id", "user_request"),
  createCheckoutSession: async ({ provider }) =>
    provider.createCheckoutSession({
      amount: 1000,
      currency: "USD",
    } as any),
  verifyWebhookSignature: async ({ provider }) =>
    provider.verifyWebhookSignature(
      {},
      "{}",
      { "stripe-signature": process.env.STRIPE_WEBHOOK_SIGNATURE! },
      process.env.STRIPE_WEBHOOK_SECRET!,
    ),
  parseWebhookEvent: async ({ provider }) => provider.parseWebhookEvent({}),
  getWebhookResponse: async ({ provider }) => provider.getWebhookResponse(),
};

export type RunInput = {
  method: string;
  configOverrides?: Partial<ProviderContext["config"]>;
};

export async function run(input: RunInput) {
  const context = getSmokeContext();

  if (input.method === "list") {
    const methods = Object.keys(scenarios).sort();
    console.log(JSON.stringify({ ok: true, methods }, null, 2));
    return;
  }

  const scenario = scenarios[input.method];
  if (scenario) {
    const result = await scenario(context);
    console.log(
      JSON.stringify({ ok: true, method: input.method, result }, null, 2),
    );
    return;
  }

  console.error(
    JSON.stringify(
      {
        ok: false,
        method: input.method,
        error: `Scenario '${input.method}' not found`,
      },
      null,
      2,
    ),
  );
  throw new Error(`Scenario '${input.method}' not found`);
}

const DEFAULT_CONTEXT = {
  traceId: "smoke-trace-id",
  idempotencyKey: "smoke-idempotency-key",
  config: {
    apiKey: process.env.STRIPE_SECRET_KEY,
  },
  isTestMode: true,
} as ProviderContext;

export const onInstallParams = {
  ctx: DEFAULT_CONTEXT,
  input: {
    webhookUrl: process.env.STRIPE_WEBHOOK_URL as string,
    config: {
      apiKey: process.env.STRIPE_SECRET_KEY,
    },
  } as InstallInput,
};

export const onUninstallParams = {
  ctx: DEFAULT_CONTEXT,
  input: {
    config: {
      apiKey: process.env.STRIPE_SECRET_KEY,
    },
    data: {
      webhookEndpointId: process.env.STRIPE_WEBHOOK_ENDPOINT_ID!,
    },
  } as UninstallInput,
};
