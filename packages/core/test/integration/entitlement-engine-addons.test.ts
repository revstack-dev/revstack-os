import assert from "node:assert/strict";
import test from "node:test";

import { EntitlementEngine } from "../../src/engine";
import { AddonDef, PlanDef } from "../../src/types";

test("EntitlementEngine: aggregates limits from plan and add-ons", () => {
  const plan: PlanDef = {
    id: "pro",
    name: "Pro",
    price: 2900,
    currency: "USD",
    interval: "month",
    features: {
      seats: 5,
    },
  };

  const addon: AddonDef = {
    id: "extra_seats",
    name: "Extra Seats",
    price: 500,
    currency: "USD",
    interval: "month",
    features: {
      seats: 3,
    },
  };

  const engine = new EntitlementEngine(plan, [addon]);
  const result = engine.check("seats", 6);

  assert.equal(result.allowed, true);
  assert.equal(result.reason, "included");
  assert.equal(result.remaining, 2);
  assert.equal(result.grantedBy, "extra_seats");
});

test("EntitlementEngine: allows boolean access from add-on even if plan disables", () => {
  const plan: PlanDef = {
    id: "starter",
    name: "Starter",
    price: 900,
    currency: "USD",
    interval: "month",
    features: {
      sso: false,
    },
  };

  const addon: AddonDef = {
    id: "sso_module",
    name: "SSO Module",
    price: 1000,
    currency: "USD",
    interval: "month",
    features: {
      sso: true,
    },
  };

  const engine = new EntitlementEngine(plan, [addon]);
  const result = engine.check("sso");

  assert.equal(result.allowed, true);
  assert.equal(result.remaining, Infinity);
  assert.equal(result.grantedBy, "sso_module");
});
