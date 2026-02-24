import { describe, it, expect } from "vitest";
import { SignJWT, generateKeyPair } from "jose";
import { TokenVerifier } from "@/verifier";
import { AuthErrorCode } from "@/types";

describe("TokenVerifier — Edge Cases", () => {
  const secret = new TextEncoder().encode("super-secret");

  const verifierHS256 = new TokenVerifier({
    provider: "custom",
    strategy: "HS256",
    signingSecret: "super-secret",
    userIdClaim: "sub",
  });

  it("handles empty or non-string tokens", async () => {
    const session1 = await verifierHS256.verify("");
    expect(session1.isValid).toBe(false);
    expect(session1.errorCode).toBe(AuthErrorCode.INVALID_FORMAT);

    const session2 = await verifierHS256.verify(null as any);
    expect(session2.isValid).toBe(false);
    expect(session2.errorCode).toBe(AuthErrorCode.INVALID_FORMAT);
  });

  it("handles malformed tokens", async () => {
    const session = await verifierHS256.verify("not.a.jwt");
    expect(session.isValid).toBe(false);
    expect(session.errorCode).toBe(AuthErrorCode.UNKNOWN_ERROR);
  });

  it("handles expired tokens", async () => {
    const expiredToken = await new SignJWT({ sub: "user_1" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt(Date.now() / 1000 - 3600)
      .setExpirationTime(Date.now() / 1000 - 1800) // Expired 30 mins ago
      .sign(secret);

    const session = await verifierHS256.verify(expiredToken);
    expect(session.isValid).toBe(false);
    expect(session.errorCode).toBe(AuthErrorCode.TOKEN_EXPIRED);
  });

  it("handles tokens missing the required user claim", async () => {
    // missing 'sub'
    const tokenWithoutSub = await new SignJWT({ role: "admin" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(secret);

    const session = await verifierHS256.verify(tokenWithoutSub);
    expect(session.isValid).toBe(false);
    expect(session.errorCode).toBe(AuthErrorCode.MISSING_CLAIM);
  });

  it("handles algorithm mismatch (e.g. RS256 token sent to HS256 verifier)", async () => {
    const { privateKey } = await generateKeyPair("RS256");
    const rs256Token = await new SignJWT({ sub: "user_1" })
      .setProtectedHeader({ alg: "RS256" })
      .setExpirationTime("1h")
      .sign(privateKey);

    const session = await verifierHS256.verify(rs256Token);
    expect(session.isValid).toBe(false);
    expect(session.errorCode).toBe(AuthErrorCode.NETWORK_ERROR);
  });
});
