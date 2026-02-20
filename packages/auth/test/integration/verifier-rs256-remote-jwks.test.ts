import assert from "node:assert/strict";
import test from "node:test";

import { SignJWT, exportJWK, generateKeyPair } from "jose";

import { TokenVerifier } from "../../src/verifier";

test("TokenVerifier verifies RS256 JWTs using remote JWKS", async () => {
  if (typeof globalThis.fetch !== "function") {
    throw new Error(
      "Global fetch is required for remote JWKS verification tests",
    );
  }

  const { publicKey, privateKey } = await generateKeyPair("RS256");

  const publicJwk = await exportJWK(publicKey);
  publicJwk.kid = "test-kid";
  publicJwk.use = "sig";
  publicJwk.alg = "RS256";

  const jwks = { keys: [publicJwk] };
  const jwksUri = "https://jwks.example.test/.well-known/jwks.json";

  const issuer = "https://issuer.example.test/";
  const audience = "my-audience";

  const token = await new SignJWT({ scope: "read:all" })
    .setProtectedHeader({ alg: "RS256", kid: "test-kid" })
    .setSubject("user_rs256")
    .setIssuer(issuer)
    .setAudience(audience)
    .setIssuedAt()
    .setExpirationTime("2h")
    .sign(privateKey);

  const originalFetch = globalThis.fetch.bind(globalThis);
  globalThis.fetch = async (input: any, init?: any) => {
    const url =
      typeof input === "string" ? input : (input?.url ?? String(input));
    if (url === jwksUri) {
      return new Response(JSON.stringify(jwks), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }

    return originalFetch(input, init);
  };

  try {
    const verifier = new TokenVerifier({
      provider: "auth0",
      strategy: "RS256",
      jwksUri,
      issuer,
      audience,
      userIdClaim: "sub",
    });

    const session = await verifier.verify(token);
    assert.equal(session.isValid, true);
    assert.equal(session.userId, "user_rs256");
    assert.equal((session.claims as any).scope, "read:all");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
