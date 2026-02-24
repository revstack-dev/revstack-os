import { createRemoteJWKSet, jwtVerify } from "jose";
import { RevstackAuthContract, RevstackSession } from "@/types";

export class TokenVerifier {
  private JWKS?: ReturnType<typeof createRemoteJWKSet>;

  constructor(private contract: RevstackAuthContract) {
    if (this.contract.strategy === "RS256") {
      this.JWKS = createRemoteJWKSet(new URL(this.contract.jwksUri));
    }
  }

  /**
   * Validates a raw JWT string against a stored RevstackAuthContract.
   */
  async verify(token: string): Promise<RevstackSession> {
    try {
      if (!token || typeof token !== "string") {
        throw new Error("Token is required");
      }

      const options: { issuer?: string; audience?: string } = {};

      if (this.contract.strategy === "RS256") {
        options.issuer = this.contract.issuer;
        if (this.contract.audience) options.audience = this.contract.audience;

        const { payload } = await jwtVerify(token, this.JWKS!, options);
        return this.buildSessionFromPayload(payload);
      }

      if (this.contract.issuer) options.issuer = this.contract.issuer;
      if (this.contract.audience) options.audience = this.contract.audience;

      const secret = new TextEncoder().encode(this.contract.signingSecret);
      const { payload } = await jwtVerify(token, secret, options);
      return this.buildSessionFromPayload(payload);
    } catch (err: any) {
      return {
        isValid: false,
        userId: "",
        claims: {},
        error: err?.message || "Token validation failed",
      };
    }
  }

  private buildSessionFromPayload(payload: any): RevstackSession {
    const claimKey = this.contract.userIdClaim || "sub";
    const userId = payload?.[claimKey] as string;

    if (!userId) {
      return {
        isValid: false,
        userId: "",
        claims: payload ?? {},
        error: `Claim '${claimKey}' not found in token.`,
      };
    }

    return {
      isValid: true,
      userId,
      claims: payload as unknown as Record<string, any>,
    };
  }
}
