import assert from "node:assert/strict";
import test from "node:test";

import { SignJWT } from "jose";

import { RevstackAuth } from "../../src/index";
import { TokenVerifier } from "../../src/verifier";

test("TokenVerifier verifies HS256 JWTs", async () => {
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
  assert.equal(session.isValid, true);
  assert.equal(session.userId, "user_123");
  assert.equal((session.claims as any).role, "admin");
});

test("RevstackAuth.validate accepts Authorization headers", async () => {
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
  assert.equal(session.isValid, true);
  assert.equal(session.userId, "user_456");
});

test("TokenVerifier rejects HS256 JWTs with wrong secret", async () => {
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
  assert.equal(session.isValid, false);
});
