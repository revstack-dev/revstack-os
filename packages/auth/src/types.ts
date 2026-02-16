export type AuthProviderType =
  | "auth0"
  | "clerk"
  | "supabase"
  | "cognito"
  | "firebase"
  | "custom";

export interface AuthConfig {
  /** The provider being used */
  provider: AuthProviderType;

  /**
   * The JSON Web Key Set URI to verify signatures.
   * e.g., "https://your-domain.us.auth0.com/.well-known/jwks.json"
   */
  jwksUri: string;

  /**
   * The expected Issuer of the token.
   * e.g., "https://your-domain.us.auth0.com/"
   */
  issuer: string;

  /**
   * The expected Audience (optional but recommended).
   * e.g., "https://api.myapp.com"
   */
  audience?: string;

  /**
   * Which claim holds the unique User ID?
   * @default "sub"
   */
  userIdClaim?: string;
}

export interface RevstackSession {
  /** The authentic provider ID (e.g., "user_2xM...") */
  userId: string;

  /** The raw decoded token payload */
  claims: Record<string, any>;

  /** Is the token valid? */
  isValid: boolean;

  error?: string;
}
