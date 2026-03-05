import {
  createError,
  isRevstackError,
  RevstackError,
  RevstackErrorCode,
} from "@/types/errors";
import { describe, it, expect } from "vitest";

describe("RevstackError", () => {
  it("creates a standardized error with correct status code", () => {
    const error = createError(
      RevstackErrorCode.ResourceNotFound,
      "User not found",
      "stripe",
    );

    expect(error.code).toBe(RevstackErrorCode.ResourceNotFound);
    expect(error.message).toBe("User not found");
    expect(error.provider).toBe("stripe");
    expect(error.statusCode).toBe(404);
    expect(error.name).toBe("RevstackError");
  });

  it("identifies a RevstackError correctly using isRevstackError", () => {
    const error = new RevstackError({
      code: RevstackErrorCode.InvalidInput,
      message: "Bad input",
    });

    expect(isRevstackError(error)).toBe(true);
    expect(isRevstackError(new Error("Generic"))).toBe(false);
  });

  it("serializes to JSON correctly", () => {
    const error = createError(
      RevstackErrorCode.PaymentFailed,
      "Card declined",
      "stripe",
    );
    const json = error.toJSON();

    expect(json.code).toBe(RevstackErrorCode.PaymentFailed);
    expect(json.statusCode).toBe(400); // PaymentFailed maps to 400
    expect(json.message).toBe("Card declined");
    expect(json.provider).toBe("stripe");
  });
});
