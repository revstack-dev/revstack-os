import assert from "node:assert/strict";
import test from "node:test";

import { EntitlementEngine } from "../../src/engine";
import { PlanDef } from "../../src/types";

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

test("EntitlementEngine: denies missing feature", () => {
  const plan = createBasePlan({
    features: {},
  });

  const engine = new EntitlementEngine(plan);
  const result = engine.check("sso");

  assert.equal(result.allowed, false);
  assert.equal(result.reason, "feature_missing");
});

test("EntitlementEngine: allows boolean feature with infinite remaining", () => {
  const plan = createBasePlan({
    features: { sso: true },
  });

  const engine = new EntitlementEngine(plan);
  const result = engine.check("sso");

  assert.equal(result.allowed, true);
  assert.equal(result.remaining, Infinity);
});

test("EntitlementEngine: allows numeric feature under limit", () => {
  const plan = createBasePlan({
    features: { seats: 5 },
  });

  const engine = new EntitlementEngine(plan);
  const result = engine.check("seats", 3);

  assert.equal(result.allowed, true);
  assert.equal(result.reason, "included");
  assert.equal(result.remaining, 2);
});

test("EntitlementEngine: denies numeric feature at limit", () => {
  const plan = createBasePlan({
    features: { seats: 5 },
  });

  const engine = new EntitlementEngine(plan);
  const result = engine.check("seats", 5);

  assert.equal(result.allowed, false);
  assert.equal(result.reason, "limit_reached");
  assert.equal(result.remaining, 0);
});

test("EntitlementEngine: denies object entitlement when not included", () => {
  const plan = createBasePlan({
    features: {
      audit_logs: { included: false, limit: 10 },
    },
  });

  const engine = new EntitlementEngine(plan);
  const result = engine.check("audit_logs", 0);

  assert.equal(result.allowed, false);
  assert.equal(result.reason, "feature_missing");
});

test("EntitlementEngine: allows overage for soft limit and estimates cost", () => {
  const plan = createBasePlan({
    features: {
      ai_tokens: { included: true, limit: 10, isHardLimit: false, unitPrice: 2 },
    },
  });

  const engine = new EntitlementEngine(plan);
  const result = engine.check("ai_tokens", 10);

  assert.equal(result.allowed, true);
  assert.equal(result.reason, "overage_allowed");
  assert.equal(result.remaining, 0);
  assert.equal(result.costEstimate, 2);
});
