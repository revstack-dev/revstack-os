import { RevstackErrorCode } from "@/types/errors";
import { validateTrialConfig } from "@/utils/validators";
import { describe, it, expect } from "vitest";

describe("validateTrialConfig", () => {
  it("validates valid trial config without throwing", () => {
    expect(() =>
      validateTrialConfig("month", 1, { allowedIntervals: ["month"] }),
    ).not.toThrow();
  });

  it("throws RevstackError for invalid min count", () => {
    try {
      validateTrialConfig("day", 3, { minCount: 7 });
      expect.fail("Should have thrown");
    } catch (e: any) {
      expect(e.code).toBe(RevstackErrorCode.InvalidTrial);
      expect(e.message).toBe("Trial count cannot be less than 7.");
    }
  });

  it("throws RevstackError for unsupported interval", () => {
    try {
      validateTrialConfig("day", 14, { allowedIntervals: ["month", "year"] });
      expect.fail("Should have thrown");
    } catch (e: any) {
      expect(e.code).toBe(RevstackErrorCode.UnsupportedInterval);
      expect(e.message).toContain("Interval 'day' is not supported.");
    }
  });
});
