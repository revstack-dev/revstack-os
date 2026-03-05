import { describe, it, expect } from "vitest";
import { getTrialDays } from "@/utils/trial";

describe("getTrialDays", () => {
  it("converts trial interval to days correctly", () => {
    expect(getTrialDays("day", 14)).toBe(14);
    expect(getTrialDays("week", 2)).toBe(14);
    expect(getTrialDays("month", 1)).toBe(30);
    expect(getTrialDays("year", 1)).toBe(365);
  });

  it("returns undefined if interval count is not provided or 0", () => {
    expect(getTrialDays("day", 0)).toBeUndefined();
    expect(getTrialDays("month", undefined as any)).toBeUndefined();
  });
});
