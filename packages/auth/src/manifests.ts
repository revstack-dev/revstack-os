import { AuthProviderManifest, AuthProviderSlug } from "@/types";

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
    description:
      "Authentication and user management platform with OIDC and JWKS.",
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
