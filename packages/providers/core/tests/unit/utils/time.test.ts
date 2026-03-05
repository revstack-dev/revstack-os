import { describe, it, expect } from "vitest";
import { calculateCycleProgress } from "@/utils/time";

describe("calculateCycleProgress", () => {
  it("returns progress as a float between 0 and 1", () => {
    const start = new Date("2026-03-01T00:00:00Z");
    const end = new Date("2026-03-31T00:00:00Z");

    // Exactly halfway point (15 days out of 30)
    const mid = new Date("2026-03-16T00:00:00Z");
    const progress = calculateCycleProgress(start, end, mid);

    expect(progress).toBe(0.5);
  });

  it("returns 0 if current date is before start date", () => {
    const start = new Date("2026-03-01T00:00:00Z");
    const end = new Date("2026-03-31T00:00:00Z");
    const before = new Date("2026-02-01T00:00:00Z");

    expect(calculateCycleProgress(start, end, before)).toBe(0);
  });

  it("returns 1 if current date is after end date", () => {
    const start = new Date("2026-03-01T00:00:00Z");
    const end = new Date("2026-03-31T00:00:00Z");
    const after = new Date("2026-04-01T00:00:00Z");

    expect(calculateCycleProgress(start, end, after)).toBe(1);
  });
});
