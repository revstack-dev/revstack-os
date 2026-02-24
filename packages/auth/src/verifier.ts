import {
  createRemoteJWKSet,
  jwtVerify,
  RemoteJWKSetOptions,
  errors as JoseErrors,
} from "jose";
import { RevstackAuthContract, RevstackSession, AuthErrorCode } from "@/types";

export interface TokenVerifierOptions {
  /** Options passed directly to underlying jose createRemoteJWKSet for cache control and timeouts */
  jwksCache?: RemoteJWKSetOptions;
}

export class TokenVerifier {
  private JWKS?: ReturnType<typeof createRemoteJWKSet>;

  constructor(
    private contract: RevstackAuthContract,
    private options?: TokenVerifierOptions
  ) {
    if (this.contract.strategy === "RS256") {
      this.JWKS = createRemoteJWKSet(
        new URL(this.contract.jwksUri),
        this.options?.jwksCache
      );
    }
  }

  /**
   * Validates a raw JWT string against a stored RevstackAuthContract.
   */
  async verify<T extends Record<string, unknown> = Record<string, any>>(
    token: string
  ): Promise<RevstackSession<T>> {
    try {
      if (!token || typeof token !== "string") {
        return this.buildErrorResponse<T>(
          AuthErrorCode.INVALID_FORMAT,
          "Token string is required"
        );
      }

      if (token.split(".").length !== 3) {
        return this.buildErrorResponse<T>(
          AuthErrorCode.INVALID_FORMAT,
          "Malformed JWT structure"
        );
      }

      const options: { issuer?: string; audience?: string } = {};
      let payload: any;

      if (this.contract.strategy === "RS256") {
        options.issuer = this.contract.issuer;
        if (this.contract.audience) options.audience = this.contract.audience;

        const result = await jwtVerify(token, this.JWKS!, options);
        payload = result.payload;
      } else {
        if (this.contract.issuer) options.issuer = this.contract.issuer;
        if (this.contract.audience) options.audience = this.contract.audience;

        const secret = new TextEncoder().encode(this.contract.signingSecret);
        const result = await jwtVerify(token, secret, options);
        payload = result.payload;
      }

      return this.buildSessionFromPayload<T>(payload);
    } catch (err: any) {
      return this.mapJoseError<T>(err);
    }
  }

  private mapJoseError<T extends Record<string, unknown>>(
    err: any
  ): RevstackSession<T> {
    if (err instanceof JoseErrors.JWTExpired) {
      return this.buildErrorResponse<T>(
        AuthErrorCode.TOKEN_EXPIRED,
        err.message
      );
    }
    if (err instanceof JoseErrors.JWTClaimValidationFailed) {
      if (err.claim === "iss") {
        return this.buildErrorResponse<T>(
          AuthErrorCode.ISSUER_MISMATCH,
          err.message
        );
      }
      return this.buildErrorResponse<T>(
        AuthErrorCode.INVALID_FORMAT,
        err.message
      );
    }
    if (err instanceof JoseErrors.JWSSignatureVerificationFailed) {
      return this.buildErrorResponse<T>(
        AuthErrorCode.INVALID_SIGNATURE,
        err.message
      );
    }
    if (
      err.code === "ERR_JOSE_GENERIC" ||
      err.message?.includes("fetch") ||
      err.name === "FetchError" ||
      err.name === "TypeError" ||
      err instanceof JoseErrors.JWKSTimeout
    ) {
      return this.buildErrorResponse<T>(
        AuthErrorCode.NETWORK_ERROR,
        err.message || "Network error fetching JWKS"
      );
    }

    return this.buildErrorResponse<T>(
      AuthErrorCode.UNKNOWN_ERROR,
      err?.message || "Token validation failed"
    );
  }

  private buildErrorResponse<T extends Record<string, unknown>>(
    code: AuthErrorCode,
    message: string
  ): RevstackSession<T> {
    return {
      isValid: false,
      userId: "",
      claims: {} as T,
      error: message,
      errorCode: code,
    };
  }

  private buildSessionFromPayload<T extends Record<string, unknown>>(
    payload: any
  ): RevstackSession<T> {
    const claimKey = this.contract.userIdClaim || "sub";
    const userId = payload?.[claimKey] as string;

    if (!userId) {
      return this.buildErrorResponse<T>(
        AuthErrorCode.MISSING_CLAIM,
        `Claim '${claimKey}' not found in token.`
      );
    }

    return {
      isValid: true,
      userId,
      claims: payload as T,
    };
  }
}
