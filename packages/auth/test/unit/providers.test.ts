import assert from "node:assert/strict";
import test from "node:test";

import { getAuthProvider, getAuthProviders } from "../../src/index";

test("getAuthProviders returns all provider manifests", () => {
  const providers = getAuthProviders();

  assert.ok(Array.isArray(providers));
  assert.equal(providers.length, 6);

  const slugs = new Set(providers.map((p) => p.slug));
  assert.deepEqual(
    slugs,
    new Set(["auth0", "clerk", "supabase", "cognito", "firebase", "custom"]),
  );
});

test("getAuthProvider returns a single manifest by slug", () => {
  const provider = getAuthProvider("supabase");

  assert.equal(provider.slug, "supabase");
  assert.equal(provider.name, "Supabase");
  assert.ok(provider.logoUrl.length > 0);
  assert.ok(provider.supportedStrategies.includes("RS256"));
});
