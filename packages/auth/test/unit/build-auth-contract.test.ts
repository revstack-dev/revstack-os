import assert from "node:assert/strict";
import test from "node:test";

import { buildAuthContract } from "../../src/index";

test("buildAuthContract(auth0) produces RS256 contract", () => {
  const contract = buildAuthContract("auth0", {
    domain: "my-tenant.us.auth0.com",
    audience: "https://api.example.com",
  });

  assert.equal(contract.provider, "auth0");
  assert.equal(contract.strategy, "RS256");
  assert.equal(contract.jwksUri, "https://my-tenant.us.auth0.com/.well-known/jwks.json");
  assert.equal(contract.issuer, "https://my-tenant.us.auth0.com/");
  assert.equal(contract.audience, "https://api.example.com");
});

test("buildAuthContract(clerk) produces RS256 contract", () => {
  const contract = buildAuthContract("clerk", {
    issuerUrl: "https://clerk.example.com",
  });

  assert.equal(contract.provider, "clerk");
  assert.equal(contract.strategy, "RS256");
  assert.equal(contract.jwksUri, "https://clerk.example.com/.well-known/jwks.json");
  assert.equal(contract.issuer, "https://clerk.example.com");
});

test("buildAuthContract(supabase) produces RS256 contract when secret is missing", () => {
  const contract = buildAuthContract("supabase", {
    projectUrl: "https://xyzcompany.supabase.co",
  });

  assert.equal(contract.provider, "supabase");
  assert.equal(contract.strategy, "RS256");
  assert.equal(contract.jwksUri, "https://xyzcompany.supabase.co/rest/v1/auth/jwks");
  assert.equal(contract.issuer, "https://xyzcompany.supabase.co/auth/v1");
});

test("buildAuthContract(supabase) produces HS256 contract when secret is provided", () => {
  const contract = buildAuthContract("supabase", {
    projectUrl: "https://xyzcompany.supabase.co",
    signingSecret: "super-secret",
  });

  assert.equal(contract.provider, "supabase");
  assert.equal(contract.strategy, "HS256");
  assert.equal(contract.signingSecret, "super-secret");
  assert.equal(contract.issuer, "https://xyzcompany.supabase.co/auth/v1");
});

test("buildAuthContract(cognito) produces RS256 contract", () => {
  const contract = buildAuthContract("cognito", {
    region: "us-east-1",
    userPoolId: "us-east-1_Abc123",
    clientId: "client_123",
  });

  assert.equal(contract.provider, "cognito");
  assert.equal(contract.strategy, "RS256");
  assert.equal(
    contract.jwksUri,
    "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_Abc123/.well-known/jwks.json",
  );
  assert.equal(contract.issuer, "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_Abc123");
  assert.equal(contract.audience, "client_123");
});

test("buildAuthContract(firebase) produces RS256 contract", () => {
  const contract = buildAuthContract("firebase", {
    projectId: "my-firebase-project",
  });

  assert.equal(contract.provider, "firebase");
  assert.equal(contract.strategy, "RS256");
  assert.equal(
    contract.jwksUri,
    "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com",
  );
  assert.equal(contract.issuer, "https://securetoken.google.com/my-firebase-project");
  assert.equal(contract.audience, "my-firebase-project");
});

test("buildAuthContract(custom) produces HS256 contract", () => {
  const contract = buildAuthContract("custom", {
    signingSecret: "custom-secret",
    issuer: "https://issuer.example.com/",
    audience: "my-audience",
  });

  assert.equal(contract.provider, "custom");
  assert.equal(contract.strategy, "HS256");
  assert.equal(contract.signingSecret, "custom-secret");
  assert.equal(contract.issuer, "https://issuer.example.com/");
  assert.equal(contract.audience, "my-audience");
});
