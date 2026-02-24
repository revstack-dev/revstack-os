import { describe, it, expect } from "vitest";
import { buildAuthContract } from "@/index";

describe("buildAuthContract", () => {
  it("auth0 produces RS256 contract", () => {
    const contract = buildAuthContract("auth0", {
      domain: "my-tenant.us.auth0.com",
      audience: "https://api.example.com",
    });

    expect(contract.provider).toBe("auth0");
    expect(contract.strategy).toBe("RS256");
    if (contract.strategy !== "RS256") throw new Error("Expected RS256");
    expect(contract.jwksUri).toBe(
      "https://my-tenant.us.auth0.com/.well-known/jwks.json"
    );
    expect(contract.issuer).toBe("https://my-tenant.us.auth0.com/");
    expect(contract.audience).toBe("https://api.example.com");
  });

  it("clerk produces RS256 contract", () => {
    const contract = buildAuthContract("clerk", {
      issuerUrl: "https://clerk.example.com",
    });

    expect(contract.provider).toBe("clerk");
    expect(contract.strategy).toBe("RS256");
    if (contract.strategy !== "RS256") throw new Error("Expected RS256");
    expect(contract.jwksUri).toBe(
      "https://clerk.example.com/.well-known/jwks.json"
    );
    expect(contract.issuer).toBe("https://clerk.example.com");
  });

  it("supabase produces RS256 contract when secret is missing", () => {
    const contract = buildAuthContract("supabase", {
      projectUrl: "https://xyzcompany.supabase.co",
    });

    expect(contract.provider).toBe("supabase");
    expect(contract.strategy).toBe("RS256");
    if (contract.strategy !== "RS256") throw new Error("Expected RS256");
    expect(contract.jwksUri).toBe(
      "https://xyzcompany.supabase.co/rest/v1/auth/jwks"
    );
    expect(contract.issuer).toBe("https://xyzcompany.supabase.co/auth/v1");
  });

  it("supabase produces HS256 contract when secret is provided", () => {
    const contract = buildAuthContract("supabase", {
      projectUrl: "https://xyzcompany.supabase.co",
      signingSecret: "super-secret",
    });

    expect(contract.provider).toBe("supabase");
    expect(contract.strategy).toBe("HS256");
    if (contract.strategy !== "HS256") throw new Error("Expected HS256");
    expect(contract.signingSecret).toBe("super-secret");
    expect(contract.issuer).toBe("https://xyzcompany.supabase.co/auth/v1");
  });

  it("cognito produces RS256 contract", () => {
    const contract = buildAuthContract("cognito", {
      region: "us-east-1",
      userPoolId: "us-east-1_Abc123",
      clientId: "client_123",
    });

    expect(contract.provider).toBe("cognito");
    expect(contract.strategy).toBe("RS256");
    if (contract.strategy !== "RS256") throw new Error("Expected RS256");
    expect(contract.jwksUri).toBe(
      "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_Abc123/.well-known/jwks.json"
    );
    expect(contract.issuer).toBe(
      "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_Abc123"
    );
    expect(contract.audience).toBe("client_123");
  });

  it("firebase produces RS256 contract", () => {
    const contract = buildAuthContract("firebase", {
      projectId: "my-firebase-project",
    });

    expect(contract.provider).toBe("firebase");
    expect(contract.strategy).toBe("RS256");
    if (contract.strategy !== "RS256") throw new Error("Expected RS256");
    expect(contract.jwksUri).toBe(
      "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"
    );
    expect(contract.issuer).toBe(
      "https://securetoken.google.com/my-firebase-project"
    );
    expect(contract.audience).toBe("my-firebase-project");
  });

  it("custom produces HS256 contract", () => {
    const contract = buildAuthContract("custom", {
      signingSecret: "custom-secret",
      issuer: "https://issuer.example.com/",
      audience: "my-audience",
    });

    expect(contract.provider).toBe("custom");
    expect(contract.strategy).toBe("HS256");
    if (contract.strategy !== "HS256") throw new Error("Expected HS256");
    expect(contract.signingSecret).toBe("custom-secret");
    expect(contract.issuer).toBe("https://issuer.example.com/");
    expect(contract.audience).toBe("my-audience");
  });
});
