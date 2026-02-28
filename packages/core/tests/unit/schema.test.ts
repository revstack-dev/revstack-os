import { describe, it, expect } from "vitest";
import {
  AddonDefInputSchema,
  PriceDefSchema,
  PlanDefInputSchema,
} from "../../src/schema";

describe("Zod Schemas", () => {
  describe("AddonDefInputSchema", () => {
    it("validates a recurring addon correctly", () => {
      const addon = {
        name: "Premium Support",
        type: "recurring" as const,
        amount: 5000,
        currency: "USD",
        billing_interval: "monthly" as const,
        features: {},
      };

      const result = AddonDefInputSchema.safeParse(addon);
      expect(result.success).toBe(true);
    });

    it("requires billing_interval for recurring addons", () => {
      const addon = {
        name: "Premium Support",
        type: "recurring" as const,
        amount: 5000,
        currency: "USD",
        features: {},
      };

      const result = AddonDefInputSchema.safeParse(addon);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result?.error?.issues?.[0]?.message).toMatch(/Invalid option/i);
      }
    });

    it("validates a one_time addon correctly without billing_interval", () => {
      const addon = {
        name: "Setup Fee",
        type: "one_time" as const,
        amount: 25000,
        currency: "USD",
        features: {},
      };

      const result = AddonDefInputSchema.safeParse(addon);
      expect(result.success).toBe(true);
    });

    it("ignores/omits billing_interval if provided playfully for one_time addons", () => {
      const addon = {
        name: "Setup Fee",
        type: "one_time" as const,
        amount: 25000,
        currency: "USD",
        billing_interval: "monthly",
        features: {},
      };

      const result = AddonDefInputSchema.safeParse(addon);
      expect(result.success).toBe(true);
    });

    it("rejects negative amounts", () => {
      const addon = {
        name: "Setup Fee",
        type: "one_time" as const,
        amount: -500,
        currency: "USD",
        features: {},
      };

      const result = AddonDefInputSchema.safeParse(addon);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error?.issues?.[0]?.message).toMatch(/Too small/i);
      }
    });
  });

  describe("PriceDefSchema", () => {
    it("allows available_addons arrays", () => {
      const price = {
        amount: 1000,
        currency: "USD",
        billing_interval: "monthly" as const,
        available_addons: ["addon_1", "addon_2"],
      };

      const result = PriceDefSchema.safeParse(price);
      expect(result.success).toBe(true);
    });

    it("rejects negative amounts", () => {
      const price = {
        amount: -10,
        currency: "USD",
        billing_interval: "monthly" as const,
      };

      const result = PriceDefSchema.safeParse(price);
      expect(result.success).toBe(false);
    });
  });

  describe("PlanDefInputSchema", () => {
    it("validates a plan without available_addons inside the root", () => {
      const plan = {
        name: "Pro",
        is_default: false,
        is_public: true,
        type: "paid" as const,
        features: {},
        prices: [
          {
            amount: 1000,
            currency: "USD",
            billing_interval: "monthly" as const,
            available_addons: ["my_addon"],
          },
        ],
      };

      const result = PlanDefInputSchema.safeParse(plan);
      expect(result.success).toBe(true);
    });
  });
});
