import { describe, it, expect } from "vitest";
import { EntitlementEngine } from "../../src/engine";
import type { AddonDef, PlanDef } from "../../src/types";

describe("EntitlementEngine — Add-ons", () => {
  const basePlan: PlanDef = {
    slug: "pro",
    name: "Pro",
    is_default: false,
    is_public: true,
    type: "paid",
    status: "active",
    prices: [{ amount: 2900, currency: "USD", billing_interval: "monthly" }],
    features: { seats: { value_limit: 5, is_hard_limit: true } },
  };

  it("aggregates limits from plan and add-ons using default increment", () => {
    const addon: AddonDef = {
      slug: "extra_seats",
      name: "Extra Seats",
      type: "recurring",
      amount: 500,
      currency: "USD",
      billing_interval: "monthly",
      features: { seats: { value_limit: 3, type: "increment" } },
    };

    const engine = new EntitlementEngine(basePlan, [addon]);
    const result = engine.check("seats", 6);

    expect(result.allowed).toBe(true);
    expect(result.reason).toBe("included");
    expect(result.remaining).toBe(2); // 5 + 3 = 8 - 6 = 2
    expect(result.granted_by).toEqual(["pro", "extra_seats"]);
  });

  it("overrides plan limit when add-on type is 'set'", () => {
    const addon: AddonDef = {
      slug: "enterprise_seats",
      name: "Enterprise Seats",
      type: "recurring",
      amount: 50000,
      currency: "USD",
      billing_interval: "monthly",
      features: { seats: { value_limit: 100, type: "set" } },
    };

    const engine = new EntitlementEngine(basePlan, [addon]);
    const result = engine.check("seats", 6);

    expect(result.allowed).toBe(true);
    expect(result.reason).toBe("included");
    expect(result.remaining).toBe(94); // 100 - 6 = 94
    expect(result.granted_by).toEqual(["enterprise_seats"]);
  });

  it("allows boolean access from add-on even if plan lacks feature", () => {
    const addon: AddonDef = {
      slug: "sso_module",
      name: "SSO Module",
      type: "recurring",
      amount: 1000,
      currency: "USD",
      billing_interval: "monthly",
      features: { sso: { has_access: true } },
    };

    const engine = new EntitlementEngine(basePlan, [addon]);
    const result = engine.check("sso");

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(Infinity);
    expect(result.granted_by).toEqual(["sso_module"]);
  });

  it("processes add-ons deterministically by evaluating 'set' before 'increment' regardless of input array order", () => {
    const addonIncrement: AddonDef = {
      slug: "addon_inc",
      name: "Inc",
      type: "recurring",
      amount: 0,
      currency: "USD",
      billing_interval: "monthly",
      features: { seats: { value_limit: 2, type: "increment" } },
    };
    const addonSet: AddonDef = {
      slug: "addon_set",
      name: "Set",
      type: "recurring",
      amount: 0,
      currency: "USD",
      billing_interval: "monthly",
      features: { seats: { value_limit: 20, type: "set" } },
    };

    // Passing [addonIncrement, addonSet] out-of-order,
    // the engine MUST evaluate set(20) first, then inc(+2) = 22.
    const engine = new EntitlementEngine(basePlan, [addonIncrement, addonSet]);
    const result = engine.check("seats", 19);

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(3); // 20 (set) + 2 (inc) = 22. 22 - 19 = 3
    expect(result.granted_by).toEqual(["addon_set", "addon_inc"]);
  });

  it("allows overage when an add-on specifies is_hard_limit: false, even if the base plan is strictly limited", () => {
    const addonOverage: AddonDef = {
      slug: "soft_seats",
      name: "Soft Seats",
      type: "recurring",
      amount: 0,
      currency: "USD",
      billing_interval: "monthly",
      features: {
        seats: { value_limit: 0, type: "increment", is_hard_limit: false },
      },
    };

    const engine = new EntitlementEngine(basePlan, [addonOverage]);
    // Plan gives 5 seats strictly. Addon adds 0 seats but makes it soft.
    const result = engine.check("seats", 6);

    expect(result.allowed).toBe(true);
    expect(result.reason).toBe("overage_allowed");
    expect(result.granted_by).toEqual(["pro", "soft_seats"]);
  });

  it("blocks all addon access if subscription is past_due", () => {
    const addon: AddonDef = {
      slug: "extra_seats",
      name: "Extra Seats",
      type: "recurring",
      amount: 0,
      currency: "USD",
      billing_interval: "monthly",
      features: { seats: { value_limit: 100, type: "increment" } },
    };

    const engine = new EntitlementEngine(basePlan, [addon], "past_due");
    const result = engine.check("seats", 1);

    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("past_due");
    expect(result.remaining).toBe(0);
  });
});
