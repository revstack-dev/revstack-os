import { describe, it, expect } from "vitest";
import { EntitlementEngine } from "../../src/engine";
import type { PlanDef } from "../../src/types";

function createBasePlan(overrides: Partial<PlanDef> = {}): PlanDef {
  return {
    slug: "pro",
    name: "Pro",
    description: "Base plan for tests",
    is_default: false,
    is_public: true,
    type: "paid",
    status: "active",
    prices: [{ amount: 2900, currency: "USD", billing_interval: "monthly" }],
    features: {},
    ...overrides,
  };
}

describe("EntitlementEngine", () => {
  it("denies missing feature", () => {
    const plan = createBasePlan({ features: {} });
    const engine = new EntitlementEngine(plan);
    const result = engine.check("sso");

    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("feature_missing");
  });

  it("allows boolean feature with infinite remaining", () => {
    const plan = createBasePlan({
      features: { sso: { value_bool: true } },
    });
    const engine = new EntitlementEngine(plan);
    const result = engine.check("sso");

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(Infinity);
  });

  it("allows numeric feature under limit", () => {
    const plan = createBasePlan({
      features: { seats: { value_limit: 5, is_hard_limit: true } },
    });
    const engine = new EntitlementEngine(plan);
    const result = engine.check("seats", 3);

    expect(result.allowed).toBe(true);
    expect(result.reason).toBe("included");
    expect(result.remaining).toBe(2);
  });

  it("denies numeric feature at limit", () => {
    const plan = createBasePlan({
      features: { seats: { value_limit: 5, is_hard_limit: true } },
    });
    const engine = new EntitlementEngine(plan);
    const result = engine.check("seats", 5);

    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("limit_reached");
    expect(result.remaining).toBe(0);
  });

  it("denies feature when value_bool is false", () => {
    const plan = createBasePlan({
      features: { audit_logs: { value_bool: false } },
    });

    const engine = new EntitlementEngine(plan);
    const result = engine.check("audit_logs", 0);

    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("feature_missing");
  });

  it("allows overage for soft limit", () => {
    const plan = createBasePlan({
      features: {
        ai_tokens: {
          value_limit: 10,
          is_hard_limit: false,
        },
      },
    });

    const engine = new EntitlementEngine(plan);
    const result = engine.check("ai_tokens", 10);

    expect(result.allowed).toBe(true);
    expect(result.reason).toBe("overage_allowed");
    expect(result.remaining).toBe(0);
  });
});
