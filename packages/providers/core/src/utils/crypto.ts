import * as crypto from "crypto";

/**
 * Generic HMAC signature verification.
 * usable by ~80% of providers (Shopify, MercadoPago, PayPal, etc.)
 */
export function verifyHmacSignature(
  payload: string,
  secret: string,
  signature: string,
  algorithm: "sha256" | "sha1" = "sha256",
  encoding: "hex" | "base64" = "hex",
): boolean {
  if (!payload || !secret || !signature) return false;

  const hmac = crypto.createHmac(algorithm, secret);
  const digest = hmac.update(payload).digest(encoding);

  // TimingSafeEqual prevents timing attacks
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}
