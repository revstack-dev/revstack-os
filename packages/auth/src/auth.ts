import { RevstackAuthContract, RevstackSession } from "@/types";
import { TokenVerifier, TokenVerifierOptions } from "@/verifier";

/**
 * Runtime helper for token validation using a stored RevstackAuthContract.
 */
export class RevstackAuth {
  private verifier: TokenVerifier;

  constructor(
    private contract: RevstackAuthContract,
    options?: TokenVerifierOptions
  ) {
    this.verifier = new TokenVerifier(contract, options);
  }

  /**
   * Validates a raw Authorization header value or a raw token.
   */
  async validate<T extends Record<string, unknown> = Record<string, any>>(
    tokenOrHeader: string
  ): Promise<RevstackSession<T>> {
    const cleanToken = tokenOrHeader.replace(/^Bearer\s+/i, "");
    return this.verifier.verify<T>(cleanToken);
  }
}
