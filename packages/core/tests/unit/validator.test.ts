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

  it("throws if plan pricing is negative", () => {
    const config: RevstackConfig = {
      features: validFeatures,
      plans: {
        default: {
          ...validPlan,
          prices: [
            { amount: -500, currency: "USD", billing_interval: "monthly" },
          ],
        },
      },
    };

    expect(() => validateConfig(config)).toThrow(RevstackValidationError);
    try {
      validateConfig(config);
    } catch (e: any) {
      expect(e.errors).toContain(
        'Plan "default" has a negative price amount (-500).',
      );
    }
  });

  it("throws if addon pricing is negative", () => {
    const config: RevstackConfig = {
      features: validFeatures,
      plans: { default: validPlan },
      addons: {
        extra: {
          name: "Extra",
          type: "recurring",
          prices: [
            { amount: -100, currency: "USD", billing_interval: "monthly" },
          ],
          features: {},
        },
      },
    };

    expect(() => validateConfig(config)).toThrow(RevstackValidationError);
    try {
      validateConfig(config);
    } catch (e: any) {
      expect(e.errors).toContain(
        'Addon "extra" has a negative price amount (-100).',
      );
    }
  });

  it("throws if a discount percentage is invalid", () => {
    const config: RevstackConfig = {
      features: validFeatures,
      plans: { default: validPlan },
      coupons: [
        {
          code: "TEST150",
          type: "percent",
          value: 150,
          duration: "once",
        },
        {
          code: "TESTMINUS",
          type: "percent",
          value: -10,
          duration: "once",
        },
      ],
    };

    expect(() => validateConfig(config)).toThrow(RevstackValidationError);
    try {
      validateConfig(config);
    } catch (e: any) {
      expect(e.errors.length).toBe(2);
      expect(e.errors[0]).toMatch(/has an invalid percentage value \(150\)/);
      expect(e.errors[1]).toMatch(/has an invalid percentage value \(-10\)/);
    }
  });

  it("throws if a discount amount is negative", () => {
    const config: RevstackConfig = {
      features: validFeatures,
      plans: { default: validPlan },
      coupons: [
        {
          code: "TESTAMOUNT",
          type: "amount",
          value: -500,
          duration: "once",
        },
      ],
    };

    expect(() => validateConfig(config)).toThrow(RevstackValidationError);
    try {
      validateConfig(config);
    } catch (e: any) {
      expect(e.errors).toContain(
        'Discount "TESTAMOUNT" has a negative amount value (-500).',
      );
    }
  });

  it("throws if feature value limit is negative in plan", () => {
    const config: RevstackConfig = {
      features: validFeatures,
      plans: {
        default: {
          ...validPlan,
          features: {
            seats: { value_limit: -5 },
          },
        },
      },
    };

    expect(() => validateConfig(config)).toThrow(RevstackValidationError);
    try {
      validateConfig(config);
    } catch (e: any) {
      expect(e.errors).toContain(
        'Plan "default" → feature "seats" has a negative value_limit (-5).',
      );
    }
  });

  it("throws if feature value limit is negative in addon", () => {
    const config: RevstackConfig = {
      features: validFeatures,
      plans: { default: validPlan },
      addons: {
        extra: {
          name: "Extra",
          type: "recurring",
          features: {
            seats: { value_limit: -5 },
          },
        },
      },
    };

    expect(() => validateConfig(config)).toThrow(RevstackValidationError);
    try {
      validateConfig(config);
    } catch (e: any) {
      expect(e.errors).toContain(
        'Addon "extra" → feature "seats" has a negative value_limit (-5).',
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

  it("throws if overage_amount is negative or overage_unit is zero", () => {
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
                api_requests: { overage_amount: -10, overage_unit: 0 },
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
        'Plan "default" overage_amount for feature "api_requests" must be >= 0.',
      );
      expect(e.errors).toContain(
        'Plan "default" overage_unit for feature "api_requests" must be > 0.',
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
            { amount: -10, currency: "USD", billing_interval: "monthly" },
          ],
        },
      },
      addons: {
        extra: {
          name: "Extra",
          type: "recurring",
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
      expect(e.errors.length).toBe(3);
      expect(e.errors).toContain(
        "No default plan found. Every project must have exactly one plan with is_default: true.",
      );
      expect(e.errors).toContain(
        'Plan "pro" has a negative price amount (-10).',
      );
      expect(e.errors).toContain(
        'Addon "extra" references undefined feature "unknown".',
      );
    }
  });
});
