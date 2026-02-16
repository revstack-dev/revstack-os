import { createRemoteJWKSet, jwtVerify } from "jose";
import { AuthConfig, RevstackSession } from "@/types";

export class TokenVerifier {
  private JWKS: ReturnType<typeof createRemoteJWKSet>;

  constructor(private config: AuthConfig) {
    this.JWKS = createRemoteJWKSet(new URL(this.config.jwksUri));
  }

  /**
   * Validates a Bearer token string against the provider's JWKS.
   */
  async verify(token: string): Promise<RevstackSession> {
    try {
      const { payload } = await jwtVerify(token, this.JWKS, {
        issuer: this.config.issuer,
        audience: this.config.audience,
      });

      const claimKey = this.config.userIdClaim || "sub";
      const userId = payload[claimKey] as string;

      if (!userId) {
        throw new Error(`Claim '${claimKey}' not found in token.`);
      }

      return {
        isValid: true,
        userId,
        claims: payload as unknown as Record<string, any>,
      };
    } catch (err: any) {
      return {
        isValid: false,
        userId: "",
        claims: {},
        error: err?.message || "Token validation failed",
      };
    }
  }
}
