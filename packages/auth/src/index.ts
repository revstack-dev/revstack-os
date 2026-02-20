import {
  AuthProviderInputBySlug,
  AuthProviderManifest,
  AuthProviderSlug,
  RevstackAuthContract,
} from "./types";
import { TokenVerifier } from "./verifier";

export * from "./types";
export * from "./verifier";

const PROVIDERS: Record<AuthProviderSlug, AuthProviderManifest> = {
  auth0: {
    slug: "auth0",
    name: "Auth0",
    description: "Enterprise identity provider with OIDC and JWKS.",
    logoUrl: "https://cdn.simpleicons.org/auth0/ffffff",
    supportedStrategies: ["RS256"],
  },
  clerk: {
    slug: "clerk",
    name: "Clerk",
    description: "Authentication and user management platform with OIDC and JWKS.",
    logoUrl: "https://cdn.simpleicons.org/clerk/ffffff",
    supportedStrategies: ["RS256"],
  },
  supabase: {
    slug: "supabase",
    name: "Supabase",
    description: "Supabase Auth with OIDC (RS256) or JWT secret (HS256).",
    logoUrl: "https://cdn.simpleicons.org/supabase/ffffff",
    supportedStrategies: ["RS256", "HS256"],
  },
  cognito: {
    slug: "cognito",
    name: "Amazon Cognito",
    description: "AWS Cognito User Pools with OIDC and JWKS.",
    logoUrl: "https://cdn.simpleicons.org/amazoncognito/ffffff",
    supportedStrategies: ["RS256"],
  },
  firebase: {
    slug: "firebase",
    name: "Firebase",
    description: "Firebase Auth tokens verified via Google's SecureToken JWKS.",
    logoUrl: "https://cdn.simpleicons.org/firebase/ffffff",
    supportedStrategies: ["RS256"],
  },
  custom: {
    slug: "custom",
    name: "Custom JWT",
    description: "Bring-your-own JWT verified with a shared secret (HS256).",
    logoUrl: "https://cdn.simpleicons.org/jsonwebtokens/ffffff",
    supportedStrategies: ["HS256"],
  },
};

function assertNonEmptyString(
  value: unknown,
  message: string,
): asserts value is string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(message);
  }
}

function normalizeBaseUrl(maybeUrlOrDomain: string): string {
  return maybeUrlOrDomain.startsWith("http")
    ? maybeUrlOrDomain
    : `https://${maybeUrlOrDomain}`;
}

/**
 * Returns all supported auth providers with UI metadata.
 */
export function getAuthProviders(): AuthProviderManifest[] {
  return Object.values(PROVIDERS);
}

/**
 * Returns a single provider manifest by slug.
 */
export function getAuthProvider(slug: AuthProviderSlug): AuthProviderManifest {
  return PROVIDERS[slug];
}

/**
 * Builds the persisted Revstack auth contract from provider slug + provider-specific input.
 * This method does not "connect" to the provider; it only standardizes configuration.
 */
export function buildAuthContract<S extends AuthProviderSlug>(
  slug: S,
  input: AuthProviderInputBySlug[S],
): RevstackAuthContract {
  switch (slug) {
    case "auth0": {
      const typed = input as AuthProviderInputBySlug["auth0"];
      assertNonEmptyString(typed.domain, "Auth0 domain is required");
      const baseUrl = normalizeBaseUrl(typed.domain);
      return {
        provider: "auth0",
        strategy: "RS256",
        jwksUri: `${baseUrl}/.well-known/jwks.json`,
        issuer: `${baseUrl}/`,
        audience: typed.audience,
        userIdClaim: typed.userIdClaim ?? "sub",
      };
    }

    case "clerk": {
      const typed = input as AuthProviderInputBySlug["clerk"];
      assertNonEmptyString(typed.issuerUrl, "Clerk issuerUrl is required");
      const issuer = typed.issuerUrl;
      return {
        provider: "clerk",
        strategy: "RS256",
        jwksUri: `${issuer}/.well-known/jwks.json`,
        issuer,
        userIdClaim: typed.userIdClaim ?? "sub",
      };
    }

    case "supabase": {
      const typed = input as AuthProviderInputBySlug["supabase"];
      assertNonEmptyString(typed.projectUrl, "Supabase projectUrl is required");

      const projectUrl = typed.projectUrl;

      if (
        typeof typed.signingSecret === "string" &&
        typed.signingSecret.length > 0
      ) {
        return {
          provider: "supabase",
          strategy: "HS256",
          signingSecret: typed.signingSecret,
          issuer: `${projectUrl}/auth/v1`,
          audience: typed.audience,
          userIdClaim: typed.userIdClaim ?? "sub",
        };
      }

      return {
        provider: "supabase",
        strategy: "RS256",
        jwksUri: `${projectUrl}/rest/v1/auth/jwks`,
        issuer: `${projectUrl}/auth/v1`,
        audience: typed.audience,
        userIdClaim: typed.userIdClaim ?? "sub",
      };
    }

    case "cognito": {
      const typed = input as AuthProviderInputBySlug["cognito"];
      assertNonEmptyString(typed.region, "Cognito region is required");
      assertNonEmptyString(typed.userPoolId, "Cognito userPoolId is required");

      const issuer = `https://cognito-idp.${typed.region}.amazonaws.com/${typed.userPoolId}`;
      return {
        provider: "cognito",
        strategy: "RS256",
        jwksUri: `${issuer}/.well-known/jwks.json`,
        issuer,
        audience: typed.clientId,
        userIdClaim: typed.userIdClaim ?? "sub",
      };
    }

    case "firebase": {
      const typed = input as AuthProviderInputBySlug["firebase"];
      assertNonEmptyString(typed.projectId, "Firebase projectId is required");
      const projectId = typed.projectId;
      return {
        provider: "firebase",
        strategy: "RS256",
        jwksUri:
          "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com",
        issuer: `https://securetoken.google.com/${projectId}`,
        audience: projectId,
        userIdClaim: typed.userIdClaim ?? "sub",
      };
    }

    case "custom": {
      const typed = input as AuthProviderInputBySlug["custom"];
      assertNonEmptyString(
        typed.signingSecret,
        "Custom signingSecret is required",
      );
      return {
        provider: "custom",
        strategy: "HS256",
        signingSecret: typed.signingSecret,
        issuer: typed.issuer,
        audience: typed.audience,
        userIdClaim: typed.userIdClaim ?? "sub",
      };
    }
  }
}

/**
 * Runtime helper for token validation using a stored RevstackAuthContract.
 */
export class RevstackAuth {
  private verifier: TokenVerifier;

  constructor(private contract: RevstackAuthContract) {
    this.verifier = new TokenVerifier(contract);
  }

  /**
   * Validates a raw Authorization header value or a raw token.
   */
  async validate(tokenOrHeader: string) {
    const cleanToken = tokenOrHeader.replace(/^Bearer\s+/i, "");
    return this.verifier.verify(cleanToken);
  }
}
