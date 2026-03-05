import { describe, it, expect } from "vitest";
import { normalizeCurrency, normalizeCountry } from "@/utils/normalization";

describe("normalizeCurrency", () => {
  it("converts currency to uppercase by default", () => {
    expect(normalizeCurrency("usd")).toBe("USD");
    expect(normalizeCurrency("eur")).toBe("EUR");
    expect(normalizeCurrency(" GBP ")).toBe("GBP");
  });

  it("converts currency to lowercase when specified", () => {
    expect(normalizeCurrency("USD", "lowercase")).toBe("usd");
    expect(normalizeCurrency("EUR", "lowercase")).toBe("eur");
  });

  it("handles empty strings", () => {
    expect(normalizeCurrency("")).toBe("");
  });
});

describe("normalizeCountry", () => {
  it("returns iso 3166-1 alpha-2 standard country codes", () => {
    expect(normalizeCountry("us ")).toBe("US");
    expect(normalizeCountry("AR")).toBe("AR");
  });

  it("handles aliases correctly", () => {
    expect(normalizeCountry("uk")).toBe("GB");
    expect(normalizeCountry("UK")).toBe("GB");
  });

  it("handles empty strings", () => {
    expect(normalizeCountry("")).toBe("");
  });
});
