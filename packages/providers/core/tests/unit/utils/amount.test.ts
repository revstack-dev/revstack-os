import { describe, it, expect } from "vitest";
import { toProviderAmount, fromProviderAmount } from "@/utils/amount";

describe("toProviderAmount", () => {
  it("converts decimal to smallest integer unit", () => {
    expect(toProviderAmount(19.99)).toBe(1999);
    expect(toProviderAmount(10.5)).toBe(1050);
    expect(toProviderAmount(0.99)).toBe(99);
    expect(toProviderAmount(0)).toBe(0);
  });
});

describe("fromProviderAmount", () => {
  it("converts integer unit back to float", () => {
    expect(fromProviderAmount(1999)).toBe(19.99);
    expect(fromProviderAmount(1050)).toBe(10.5);
    expect(fromProviderAmount(99)).toBe(0.99);
    expect(fromProviderAmount(0)).toBe(0);
  });
});
