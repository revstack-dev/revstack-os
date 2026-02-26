import { describe, it, expect } from "vitest";
import { EntitlementEngine } from "../../src/engine";
import type { AddonDef, PlanDef } from "../../src/types";

describe("EntitlementEngine — Add-ons", () => {
  it("aggregates limits from plan and add-ons", () => {
    const plan: PlanDef = {
      slug: "pro",
      name: "Pro",
      is_default: false,
      is_public: true,
      type: "paid",
      status: "active",
      prices: [{ amount: 2900, currency: "USD", billing_interval: "monthly" }],
      features: { seats: { value_limit: 5, is_hard_limit: true } },
    };

    const addon: AddonDef = {
      slug: "extra_seats",
      name: "Extra Seats",
      type: "recurring",
      price: { amount: 500, currency: "USD", billing_interval: "monthly" },
      features: { seats: { value_limit: 3, is_hard_limit: true } },
    };

    const engine = new EntitlementEngine(plan, [addon]);
    const result = engine.check("seats", 6);

    expect(result.allowed).toBe(true);
    expect(result.reason).toBe("included");
    expect(result.remaining).toBe(2);
    expect(result.granted_by).toBe("extra_seats");
  });

  it("allows boolean access from add-on even if plan lacks feature", () => {
    const plan: PlanDef = {
      slug: "starter",
      name: "Starter",
      is_default: false,
      is_public: true,
      type: "paid",
      status: "active",
      prices: [{ amount: 900, currency: "USD", billing_interval: "monthly" }],
      features: {},
    };

    const addon: AddonDef = {
      slug: "sso_module",
      name: "SSO Module",
      type: "recurring",
      price: { amount: 1000, currency: "USD", billing_interval: "monthly" },
      features: { sso: { value_bool: true } },
    };

    const engine = new EntitlementEngine(plan, [addon]);
    const result = engine.check("sso");

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(Infinity);
    expect(result.granted_by).toBe("sso_module");
  });
});
