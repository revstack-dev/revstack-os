import { RevstackConfig } from "@/types";
import { RevstackValidationError, validateConfig } from "@/validator";
import { describe, it, expect } from "vitest";

describe("validateConfig", () => {
  const validFeatures = {
    seats: {
      name: "Seats",
      type: "static" as const,
      unit_type: "count" as const,
    },
    api_requests: {
      name: "API Requests",
      type: "metered" as const,
      unit_type: "requests" as const,
    },
  };

  const validPlan = {
    name: "Pro",
    is_default: true,
    is_public: true,
    type: "paid" as const,
    features: { seats: { value_limit: 5 } },
  };

  it("passes for a valid config with one default plan", () => {
    const config: RevstackConfig = {
      features: validFeatures,
      plans: { default: validPlan },
    };

    expect(() => validateConfig(config)).not.toThrow();
  });

  it("throws if no default plan exists", () => {
    const config: RevstackConfig = {
      features: validFeatures,
      plans: {
        pro: { ...validPlan, is_default: false },
      },
    };

    expect(() => validateConfig(config)).toThrow(RevstackValidationError);
    try {
      validateConfig(config);
    } catch (e: any) {
      expect(e.errors).toContain(
        "No default plan found. Every project must have exactly one plan with is_default: true.",
      );
    }
  });

  it("throws if multiple default plans exist", () => {
    const config: RevstackConfig = {
      features: validFeatures,
      plans: {
        pro1: validPlan,
        pro2: { ...validPlan, name: "Pro 2" },
      },
    };

    expect(() => validateConfig(config)).toThrow(RevstackValidationError);
    try {
      validateConfig(config);
    } catch (e: any) {
      expect(e.errors[0]).toMatch(/Multiple default plans found/);
    }
  });

  it("throws if a plan references an undefined feature", () => {
    const config: RevstackConfig = {
      features: validFeatures,
      plans: {
        default: {
          ...validPlan,
          features: {
            seats: { value_limit: 5 },
            unknown: { value_limit: 10 },
          },
        },
      },
    };

    expect(() => validateConfig(config)).toThrow(RevstackValidationError);
    try {
      validateConfig(config);
    } catch (e: any) {
      expect(e.errors).toContain(
        'Plan "default" references undefined feature "unknown".',
      );
    }
  });

  it("throws if an addon references an undefined feature", () => {
    const config: RevstackConfig = {
      features: validFeatures,
      plans: { default: validPlan },
      addons: {
        extra: {
          name: "Extra",
          type: "recurring",
          amount: 1000,
          currency: "USD",
          billing_interval: "monthly",
          features: { unknown: { value_limit: 10 } },
        },
      },
    };

    expect(() => validateConfig(config)).toThrow(RevstackValidationError);
    try {
      validateConfig(config);
    } catch (e: any) {
      expect(e.errors).toContain(
        'Addon "extra" references undefined feature "unknown".',
      );
    }
  });

  it("throws if overage_configuration references non-metered feature", () => {
    const config: RevstackConfig = {
      features: validFeatures,
      plans: {
        default: {
          ...validPlan,
          prices: [
            {
              amount: 1000,
              currency: "USD",
              billing_interval: "monthly",
              overage_configuration: {
                seats: { overage_amount: 10, overage_unit: 1 },
              },
            },
          ],
        },
      },
    };

    expect(() => validateConfig(config)).toThrow(RevstackValidationError);
    try {
      validateConfig(config);
    } catch (e: any) {
      expect(e.errors).toContain(
        'Plan "default" configures overage for feature "seats", which is not of type \'metered\'.',
      );
    }
  });

  it("throws if overage_configuration references undefined feature", () => {
    const config: RevstackConfig = {
      features: validFeatures,
      plans: {
        default: {
          ...validPlan,
          prices: [
            {
              amount: 1000,
              currency: "USD",
              billing_interval: "monthly",
              overage_configuration: {
                unknown: { overage_amount: 10, overage_unit: 1 },
              },
            },
          ],
        },
      },
    };

    expect(() => validateConfig(config)).toThrow(RevstackValidationError);
    try {
      validateConfig(config);
    } catch (e: any) {
      expect(e.errors).toContain(
        'Plan "default" overage_configuration references undefined feature "unknown".',
      );
    }
  });

  it("collects multiple errors across the config", () => {
    const config: RevstackConfig = {
      features: validFeatures,
      plans: {
        pro: {
          ...validPlan,
          is_default: false,
          prices: [
            { amount: 10, currency: "USD", billing_interval: "monthly" },
          ],
        },
      },
      addons: {
        extra: {
          name: "Extra",
          type: "recurring",
          amount: 1000,
          currency: "USD",
          billing_interval: "monthly",
          features: {
            unknown: { value_limit: 10 },
          },
        },
      },
    };

    expect(() => validateConfig(config)).toThrow(RevstackValidationError);
    try {
      validateConfig(config);
    } catch (e: any) {
      expect(e.errors.length).toBe(2);
      expect(e.errors).toContain(
        "No default plan found. Every project must have exactly one plan with is_default: true.",
      );
      expect(e.errors).toContain(
        'Addon "extra" references undefined feature "unknown".',
      );
    }
  });
  it("Should Pass: A monthly price with a monthly addon", () => {
    const config: RevstackConfig = {
      features: validFeatures,
      plans: {
        default: {
          ...validPlan,
          prices: [
            {
              amount: 1000,
              currency: "USD",
              billing_interval: "monthly",
              available_addons: ["monthly_addon"],
            },
          ],
        },
      },
      addons: {
        monthly_addon: {
          name: "Monthly",
          type: "recurring",
          amount: 100,
          currency: "USD",
          billing_interval: "monthly",
          features: {},
        },
      },
    };
    expect(() => validateConfig(config)).not.toThrow();
  });

  it("Should Pass: A monthly price with a one-time addon", () => {
    const config: RevstackConfig = {
      features: validFeatures,
      plans: {
        default: {
          ...validPlan,
          prices: [
            {
              amount: 1000,
              currency: "USD",
              billing_interval: "monthly",
              available_addons: ["onetime_addon"],
            },
          ],
        },
      },
      addons: {
        onetime_addon: {
          name: "One Time",
          type: "one_time",
          amount: 100,
          currency: "USD",
          features: {},
        },
      },
    };
    expect(() => validateConfig(config)).not.toThrow();
  });

  it("Should Fail: A monthly price with a yearly addon", () => {
    const config: RevstackConfig = {
      features: validFeatures,
      plans: {
        default: {
          ...validPlan,
          prices: [
            {
              amount: 1000,
              currency: "USD",
              billing_interval: "monthly",
              available_addons: ["yearly_addon"],
            },
          ],
        },
      },
      addons: {
        yearly_addon: {
          name: "Yearly",
          type: "recurring",
          amount: 1000,
          currency: "USD",
          billing_interval: "yearly",
          features: {},
        },
      },
    };
    expect(() => validateConfig(config)).toThrow(RevstackValidationError);
    try {
      validateConfig(config);
    } catch (e: any) {
      expect(e.errors).toContain(
        "Interval Mismatch: Plan 'default' price is 'monthly', but Addon 'yearly_addon' is 'yearly'. Recurring addons must match the price's billing interval.",
      );
    }
  });

  it("Should Fail: An addon referenced in available_addons that doesn't exist", () => {
    const config: RevstackConfig = {
      features: validFeatures,
      plans: {
        default: {
          ...validPlan,
          prices: [
            {
              amount: 1000,
              currency: "USD",
              billing_interval: "monthly",
              available_addons: ["ghost_addon"],
            },
          ],
        },
      },
    };
    expect(() => validateConfig(config)).toThrow(RevstackValidationError);
    try {
      validateConfig(config);
    } catch (e: any) {
      expect(e.errors).toContain(
        'Plan "default" price references undefined addon "ghost_addon".',
      );
    }
  });
});
