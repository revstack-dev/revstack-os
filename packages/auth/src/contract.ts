import {
  AuthProviderInputBySlug,
  AuthProviderSlug,
  RevstackAuthContract,
} from "@/types";

export function assertNonEmptyString(
  value: unknown,
  message: string
): asserts value is string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(message);
  }
}

export function normalizeBaseUrl(maybeUrlOrDomain: string): string {
  return maybeUrlOrDomain.startsWith("http")
    ? maybeUrlOrDomain
    : `https://${maybeUrlOrDomain}`;
}

type ProviderBuilder<S extends AuthProviderSlug> = (
  input: AuthProviderInputBySlug[S]
) => RevstackAuthContract;

const BUILDERS: {
  [K in AuthProviderSlug]: ProviderBuilder<K>;
} = {
  auth0: (input) => {
    assertNonEmptyString(input.domain, "Auth0 domain is required");
    const baseUrl = normalizeBaseUrl(input.domain);
    return {
      provider: "auth0",
      strategy: "RS256",
      jwksUri: `${baseUrl}/.well-known/jwks.json`,
      issuer: `${baseUrl}/`,
      audience: input.audience,
    };
  },
  clerk: (input) => {
    assertNonEmptyString(input.issuerUrl, "Clerk issuerUrl is required");
    const issuer = input.issuerUrl;
    return {
      provider: "clerk",
      strategy: "RS256",
      jwksUri: `${issuer}/.well-known/jwks.json`,
      issuer,
    };
  },
  supabase: (input) => {
    assertNonEmptyString(input.projectUrl, "Supabase projectUrl is required");
    const projectUrl = input.projectUrl;

    if (
      typeof input.signingSecret === "string" &&
      input.signingSecret.length > 0
    ) {
      return {
        provider: "supabase",
        strategy: "HS256",
        signingSecret: input.signingSecret,
        issuer: `${projectUrl}/auth/v1`,
        audience: input.audience,
      };
    }

    return {
      provider: "supabase",
      strategy: "RS256",
      jwksUri: `${projectUrl}/rest/v1/auth/jwks`,
      issuer: `${projectUrl}/auth/v1`,
      audience: input.audience,
    };
  },
  cognito: (input) => {
    assertNonEmptyString(input.region, "Cognito region is required");
    assertNonEmptyString(input.userPoolId, "Cognito userPoolId is required");

    const issuer = `https://cognito-idp.${input.region}.amazonaws.com/${input.userPoolId}`;
    return {
      provider: "cognito",
      strategy: "RS256",
      jwksUri: `${issuer}/.well-known/jwks.json`,
      issuer,
      audience: input.clientId,
    };
  },
  firebase: (input) => {
    assertNonEmptyString(input.projectId, "Firebase projectId is required");
    const projectId = input.projectId;
    return {
      provider: "firebase",
      strategy: "RS256",
      jwksUri:
        "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com",
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
    };
  },
  custom: (input) => {
    assertNonEmptyString(
      input.signingSecret,
      "Custom signingSecret is required"
    );
    return {
      provider: "custom",
      strategy: "HS256",
      signingSecret: input.signingSecret,
      issuer: input.issuer,
      audience: input.audience,
    };
  },
};

/**
 * Builds the persisted Revstack auth contract from provider slug + provider-specific input.
 * This method does not "connect" to the provider; it only standardizes configuration.
 */
export function buildAuthContract<S extends AuthProviderSlug>(
  slug: S,
  input: AuthProviderInputBySlug[S]
): RevstackAuthContract {
  const builder = BUILDERS[slug] as ProviderBuilder<S>;
  const baseContract = builder(input);

  // Centralized default for userIdClaim
  baseContract.userIdClaim = (input as any).userIdClaim ?? "sub";

  return baseContract;
}
