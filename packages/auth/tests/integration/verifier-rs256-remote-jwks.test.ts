import { describe, it, expect, afterEach, vi } from "vitest";
import { SignJWT, exportJWK, generateKeyPair } from "jose";
import { TokenVerifier } from "@/verifier";

describe("TokenVerifier — RS256 Remote JWKS", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("verifies RS256 JWTs using remote JWKS", async () => {
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

    // Mock fetch to return our test JWKS
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

    const verifier = new TokenVerifier({
      provider: "auth0",
      strategy: "RS256",
      jwksUri,
      issuer,
      audience,
      userIdClaim: "sub",
    });

    const session = await verifier.verify(token);
    expect(session.isValid).toBe(true);
    expect(session.userId).toBe("user_rs256");
    expect((session.claims as any).scope).toBe("read:all");
  });
});
