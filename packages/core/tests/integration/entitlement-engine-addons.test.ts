import { describe, it, expect } from "vitest";
import { EntitlementEngine } from "../../src/engine";
import type { AddonDef, PlanDef } from "../../src/types";

describe("EntitlementEngine — Add-ons", () => {
  it("aggregates limits from plan and add-ons", () => {
    const plan: PlanDef = {
      id: "pro",
      name: "Pro",
      price: 2900,
      currency: "USD",
      interval: "month",
      features: { seats: 5 },
    };

    const addon: AddonDef = {
      id: "extra_seats",
      name: "Extra Seats",
      price: 500,
      currency: "USD",
      interval: "month",
      features: { seats: 3 },
    };

    const engine = new EntitlementEngine(plan, [addon]);
    const result = engine.check("seats", 6);

    expect(result.allowed).toBe(true);
    expect(result.reason).toBe("included");
    expect(result.remaining).toBe(2);
    expect(result.grantedBy).toBe("extra_seats");
  });

  it("allows boolean access from add-on even if plan disables", () => {
    const plan: PlanDef = {
      id: "starter",
      name: "Starter",
      price: 900,
      currency: "USD",
      interval: "month",
      features: { sso: false },
    };

    const addon: AddonDef = {
      id: "sso_module",
      name: "SSO Module",
      price: 1000,
      currency: "USD",
      interval: "month",
      features: { sso: true },
    };

    const engine = new EntitlementEngine(plan, [addon]);
    const result = engine.check("sso");

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(Infinity);
    expect(result.grantedBy).toBe("sso_module");
  });
});
