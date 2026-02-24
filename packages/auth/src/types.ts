/**
 * @file types.ts
 * @description Types for the Revstack Auth bridge contracts.
 */

export type SigningStrategy = "RS256" | "HS256";

export type AuthProviderSlug =
  | "auth0"
  | "clerk"
  | "supabase"
  | "cognito"
  | "firebase"
  | "custom";

export interface AuthProviderManifest {
  /** Stable identifier used for configuration and routing. */
  slug: AuthProviderSlug;

  /** Human-friendly provider name. */
  name: string;

  /** Public logo URL for UI rendering. */
  logoUrl: string;

  /** Short description for UI/marketing. */
  description?: string;

  /** Which signing strategies this provider supports. */
  supportedStrategies: SigningStrategy[];
}

export interface RS256AuthContract {
  /** Which provider produced this contract. */
  provider: AuthProviderSlug;

  /** Discriminator for RS256 verification via remote JWKS. */
  strategy: "RS256";

  /** The JSON Web Key Set URI to verify signatures. */
  jwksUri: string;

  /** Expected issuer (iss). */
  issuer: string;

  /** Expected audience (aud). */
  audience?: string;

  /** Claim holding the unique user id. Defaults to "sub". */
  userIdClaim?: string;
}

export interface HS256AuthContract {
  /** Which provider produced this contract. */
  provider: AuthProviderSlug;

  /** Discriminator for HS256 verification via shared secret. */
  strategy: "HS256";

  /** Shared signing secret used to verify signatures. */
  signingSecret: string;

  /** Expected issuer (iss), if enforced by your deployment. */
  issuer?: string;

  /** Expected audience (aud), if enforced by your deployment. */
  audience?: string;

  /** Claim holding the unique user id. Defaults to "sub". */
  userIdClaim?: string;
}

export type RevstackAuthContract = RS256AuthContract | HS256AuthContract;

export interface Auth0Input {
  /** Auth0 domain, with or without protocol (e.g., "my-tenant.us.auth0.com"). */
  domain: string;
  /** Expected audience (aud). */
  audience?: string;
  /** Optional override for user id claim. */
  userIdClaim?: string;
}

export interface ClerkInput {
  /** Clerk issuer URL (e.g., "https://clerk.your-domain.com"). */
  issuerUrl: string;
  /** Optional override for user id claim. */
  userIdClaim?: string;
}

export interface SupabaseInput {
  /** Supabase project URL (e.g., "https://xyzcompany.supabase.co"). */
  projectUrl: string;
  /**
   * Optional JWT signing secret for HS256 verification.
   * If provided, the contract becomes HS256.
   */
  signingSecret?: string;
  /** Optional expected audience (aud). */
  audience?: string;
  /** Optional override for user id claim. */
  userIdClaim?: string;
}

export interface FirebaseInput {
  /** Firebase project id (e.g., "my-firebase-project"). */
  projectId: string;
  /** Optional override for user id claim. */
  userIdClaim?: string;
}

export interface CognitoInput {
  /** AWS region, e.g. "us-east-1". */
  region: string;
  /** Cognito User Pool id, e.g. "us-east-1_Abc123". */
  userPoolId: string;
  /** Cognito App Client id (aud). */
  clientId?: string;
  /** Optional override for user id claim. */
  userIdClaim?: string;
}

export interface CustomJwtInput {
  /** HS256 signing secret. */
  signingSecret: string;
  /** Optional expected issuer (iss). */
  issuer?: string;
  /** Optional expected audience (aud). */
  audience?: string;
  /** Optional override for user id claim. */
  userIdClaim?: string;
}

export type AuthProviderInputBySlug = {
  auth0: Auth0Input;
  clerk: ClerkInput;
  supabase: SupabaseInput;
  cognito: CognitoInput;
  firebase: FirebaseInput;
  custom: CustomJwtInput;
};

export enum AuthErrorCode {
  TOKEN_EXPIRED = "TOKEN_EXPIRED",
  INVALID_SIGNATURE = "INVALID_SIGNATURE",
  ISSUER_MISMATCH = "ISSUER_MISMATCH",
  NETWORK_ERROR = "NETWORK_ERROR",
  MISSING_CLAIM = "MISSING_CLAIM",
  INVALID_FORMAT = "INVALID_FORMAT",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

export interface RevstackSession<
  T extends Record<string, unknown> = Record<string, any>,
> {
  /** The authentic provider ID (e.g., "user_2xM...") */
  userId: string;

  /** The raw decoded token payload */
  claims: T;

  /** Is the token valid? */
  isValid: boolean;

  /** Human-readable error message if isValid is false */
  error?: string;

  /** Specific error code if isValid is false */
  errorCode?: AuthErrorCode;
}
