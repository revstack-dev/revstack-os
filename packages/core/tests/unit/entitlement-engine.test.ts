import { describe, it, expect } from "vitest";
import { EntitlementEngine } from "@/engine";
import type { PlanDef } from "@/types";

function createBasePlan(overrides: Partial<PlanDef> = {}): PlanDef {
  return {
    id: "pro",
    name: "Pro",
    description: "Base plan for tests",
    price: 2900,
    currency: "USD",
    interval: "month",
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
    const plan = createBasePlan({ features: { sso: true } });
    const engine = new EntitlementEngine(plan);
    const result = engine.check("sso");

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(Infinity);
  });

  it("allows numeric feature under limit", () => {
    const plan = createBasePlan({ features: { seats: 5 } });
    const engine = new EntitlementEngine(plan);
    const result = engine.check("seats", 3);

    expect(result.allowed).toBe(true);
    expect(result.reason).toBe("included");
    expect(result.remaining).toBe(2);
  });

  it("denies numeric feature at limit", () => {
    const plan = createBasePlan({ features: { seats: 5 } });
    const engine = new EntitlementEngine(plan);
    const result = engine.check("seats", 5);

    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("limit_reached");
    expect(result.remaining).toBe(0);
  });

  it("denies object entitlement when not included", () => {
    const plan = createBasePlan({
      features: {
        audit_logs: { included: false, limit: 10 },
      },
    });

    const engine = new EntitlementEngine(plan);
    const result = engine.check("audit_logs", 0);

    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("feature_missing");
  });

  it("allows overage for soft limit and estimates cost", () => {
    const plan = createBasePlan({
      features: {
        ai_tokens: {
          included: true,
          limit: 10,
          isHardLimit: false,
          unitPrice: 2,
        },
      },
    });

    const engine = new EntitlementEngine(plan);
    const result = engine.check("ai_tokens", 10);

    expect(result.allowed).toBe(true);
    expect(result.reason).toBe("overage_allowed");
    expect(result.remaining).toBe(0);
    expect(result.costEstimate).toBe(2);
  });
});
