import { describe, it, expect } from "vitest";
import { SignJWT } from "jose";
import { RevstackAuth } from "@/index";
import { TokenVerifier } from "@/verifier";

describe("TokenVerifier — HS256", () => {
  it("verifies HS256 JWTs", async () => {
    const signingSecret = "hs256-secret";
    const issuer = "https://issuer.example.com/";
    const audience = "my-audience";

    const token = await new SignJWT({ role: "admin" })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("user_123")
      .setIssuer(issuer)
      .setAudience(audience)
      .setIssuedAt()
      .setExpirationTime("2h")
      .sign(new TextEncoder().encode(signingSecret));

    const verifier = new TokenVerifier({
      provider: "custom",
      strategy: "HS256",
      signingSecret,
      issuer,
      audience,
      userIdClaim: "sub",
    });

    const session = await verifier.verify(token);
    expect(session.isValid).toBe(true);
    expect(session.userId).toBe("user_123");
    expect((session.claims as any).role).toBe("admin");
  });

  it("RevstackAuth.validate accepts Authorization headers", async () => {
    const signingSecret = "hs256-secret-2";

    const token = await new SignJWT({})
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("user_456")
      .setIssuedAt()
      .setExpirationTime("2h")
      .sign(new TextEncoder().encode(signingSecret));

    const auth = new RevstackAuth({
      provider: "custom",
      strategy: "HS256",
      signingSecret,
      userIdClaim: "sub",
    });

    const session = await auth.validate(`Bearer ${token}`);
    expect(session.isValid).toBe(true);
    expect(session.userId).toBe("user_456");
  });

  it("rejects HS256 JWTs with wrong secret", async () => {
    const token = await new SignJWT({})
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("user_789")
      .setIssuedAt()
      .setExpirationTime("2h")
      .sign(new TextEncoder().encode("right-secret"));

    const verifier = new TokenVerifier({
      provider: "custom",
      strategy: "HS256",
      signingSecret: "wrong-secret",
      userIdClaim: "sub",
    });

    const session = await verifier.verify(token);
    expect(session.isValid).toBe(false);
  });
});
