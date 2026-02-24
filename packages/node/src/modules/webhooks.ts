import { createHmac, timingSafeEqual } from "node:crypto";
import { SignatureVerificationError } from "@/errors";
import type { WebhookEvent } from "@/types";

/** Default maximum age for webhook timestamps (5 minutes). */
const DEFAULT_TOLERANCE_SECONDS = 300;

/**
 * Client for verifying inbound webhooks from Revstack Cloud.
 * Uses HMAC-SHA256 with constant-time comparison to prevent timing attacks,
 * plus timestamp validation for replay protection.
 *
 * @example
 * ```typescript
 * // Express.js webhook handler
 * app.post("/webhooks/revstack", express.raw({ type: "application/json" }), (req, res) => {
 *   try {
 *     const event = revstack.webhooks.constructEvent(
 *       req.body,
 *       req.headers["revstack-signature"] as string,
 *       process.env.REVSTACK_WEBHOOK_SECRET!
 *     );
 *     console.log(`Received event: ${event.type}`);
 *     res.sendStatus(200);
 *   } catch (error) {
 *     if (error instanceof SignatureVerificationError) {
 *       res.status(400).send("Invalid signature");
 *     }
 *   }
 * });
 * ```
 */
export class WebhooksClient {
  /**
   * Verify the signature of an incoming webhook and parse the event payload.
   *
   * @param payload - Raw request body (`Buffer` or `string`). **Must NOT be parsed JSON.**
   * @param signature - Value of the `revstack-signature` HTTP header.
   * @param secret - Webhook signing secret (from the Revstack Dashboard).
   * @param tolerance - Maximum age of the webhook in seconds. Defaults to `300` (5 min). Set to `0` to disable replay protection.
   * @returns The verified and parsed webhook event.
   *
   * @throws {SignatureVerificationError} If the signature is invalid, the header is malformed, or the timestamp exceeds the tolerance.
   */
  constructEvent(
    payload: string | Buffer,
    signature: string,
    secret: string,
    tolerance: number = DEFAULT_TOLERANCE_SECONDS
  ): WebhookEvent {
    const rawBody =
      typeof payload === "string" ? payload : payload.toString("utf8");
    const parts = this.parseSignatureHeader(signature);

    // Compute expected HMAC-SHA256 signature
    const expectedSignature = createHmac("sha256", secret)
      .update(`${parts.timestamp}.${rawBody}`)
      .digest("hex");

    // Constant-time comparison to prevent timing attacks
    const expectedBuffer = Buffer.from(expectedSignature, "utf8");
    const receivedBuffer = Buffer.from(parts.v1, "utf8");

    if (
      expectedBuffer.length !== receivedBuffer.length ||
      !timingSafeEqual(expectedBuffer, receivedBuffer)
    ) {
      throw new SignatureVerificationError(
        "Webhook signature does not match the expected signature"
      );
    }

    // Replay protection: reject stale timestamps
    if (tolerance > 0) {
      const timestampAge = Math.floor(Date.now() / 1000) - parts.timestamp;
      if (timestampAge > tolerance) {
        throw new SignatureVerificationError(
          `Webhook timestamp too old (${timestampAge}s > ${tolerance}s tolerance)`
        );
      }
    }

    return JSON.parse(rawBody) as WebhookEvent;
  }

  /**
   * Parse the `revstack-signature` header into its component parts.
   *
   * @param header - Raw header value in the format `t=<timestamp>,v1=<signature>`.
   * @returns Parsed timestamp and v1 signature.
   *
   * @throws {SignatureVerificationError} If the header format is invalid.
   * @internal
   */
  private parseSignatureHeader(header: string): {
    timestamp: number;
    v1: string;
  } {
    const pairs = header.split(",");
    let timestamp = 0;
    let v1 = "";

    for (const pair of pairs) {
      const [key, value] = pair.trim().split("=");
      if (key === "t") timestamp = parseInt(value!, 10);
      if (key === "v1") v1 = value!;
    }

    if (!timestamp || !v1) {
      throw new SignatureVerificationError(
        "Invalid signature header format. Expected: t=<timestamp>,v1=<signature>"
      );
    }

    return { timestamp, v1 };
  }
}
