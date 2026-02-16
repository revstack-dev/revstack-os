import { EntitlementEngine } from "@/engine";
import { PlanDef } from "@/types";

const planPro: PlanDef = {
  name: "Pro",
  id: "pro",
  price: 2900,
  currency: "USD",
  interval: "month",
  features: {
    sso: true,
    ai_tokens: { limit: 50_000, unitPrice: 0.01, included: true },
  },
};

const engine = new EntitlementEngine(planPro);

console.log(engine.check("ai_tokens", 60_000));
