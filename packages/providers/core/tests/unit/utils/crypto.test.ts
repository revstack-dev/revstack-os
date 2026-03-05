import { describe, it, expect } from "vitest";
import { verifyHmacSignature } from "@/utils/crypto";
import * as crypto from "crypto";

describe("verifyHmacSignature", () => {
  it("verifies a valid signature", () => {
    const hmac = crypto.createHmac("sha256", "secret_key");
    const validSignature = hmac.update("test_payload").digest("hex");

    expect(
      verifyHmacSignature("test_payload", "secret_key", validSignature),
    ).toBe(true);
  });

  it("rejects an invalid signature", () => {
    const invalidSignature =
      "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    expect(
      verifyHmacSignature("test_payload", "secret_key", invalidSignature),
    ).toBe(false);
  });

  it("rejects if arguments are missing", () => {
    expect(verifyHmacSignature("", "secret_key", "signature")).toBe(false);
    expect(verifyHmacSignature("payload", "", "signature")).toBe(false);
    expect(verifyHmacSignature("payload", "secret_key", "")).toBe(false);
  });
});
