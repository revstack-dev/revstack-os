import { AuthConfig } from "@/types";
import { TokenVerifier } from "@/verifier";

export * from "@/types";
export * from "@/verifier";

export class RevstackAuth {
  private verifier: TokenVerifier;

  constructor(config: AuthConfig) {
    this.verifier = new TokenVerifier(config);
  }

  /**
   * Main method to validate an incoming request header or token string.
   */
  async validate(token: string) {
    const cleanToken = token.replace("Bearer ", "");
    return this.verifier.verify(cleanToken);
  }

  static auth0(domain: string, audience?: string): AuthConfig {
    const baseUrl = domain.startsWith("http") ? domain : `https://${domain}`;
    return {
      provider: "auth0",
      jwksUri: `${baseUrl}/.well-known/jwks.json`,
      issuer: `${baseUrl}/`,
      audience,
      userIdClaim: "sub",
    };
  }

  static clerk(issuerUrl: string): AuthConfig {
    return {
      provider: "clerk",
      jwksUri: `${issuerUrl}/.well-known/jwks.json`,
      issuer: issuerUrl,
      userIdClaim: "sub",
    };
  }

  static supabase(projectUrl: string): AuthConfig {
    return {
      provider: "supabase",
      jwksUri: `${projectUrl}/rest/v1/auth/jwks`,
      issuer: `${projectUrl}/auth/v1`,
      userIdClaim: "sub",
    };
  }
}
