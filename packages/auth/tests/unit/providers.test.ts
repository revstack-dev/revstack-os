import { describe, it, expect } from "vitest";
import { getAuthProvider, getAuthProviders } from "@/index";

describe("Auth Providers", () => {
  it("getAuthProviders returns all provider manifests", () => {
    const providers = getAuthProviders();

    expect(Array.isArray(providers)).toBe(true);
    expect(providers.length).toBe(6);

    const slugs = new Set(providers.map((p) => p.slug));
    expect(slugs).toEqual(
      new Set(["auth0", "clerk", "supabase", "cognito", "firebase", "custom"])
    );
  });

  it("getAuthProvider returns a single manifest by slug", () => {
    const provider = getAuthProvider("supabase");

    expect(provider.slug).toBe("supabase");
    expect(provider.name).toBe("Supabase");
    expect(provider.logoUrl.length).toBeGreaterThan(0);
    expect(provider.supportedStrategies).toContain("RS256");
  });
});
