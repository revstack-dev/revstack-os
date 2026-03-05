import { describe, it, expect } from "vitest";
import { serializeMetadata } from "@/utils/metadata";

describe("serializeMetadata", () => {
  it("serializes complex metadata to flat string record", () => {
    const data = { userId: 123, preferences: { theme: "dark" } };
    const serialized = serializeMetadata(data);

    expect(serialized).toEqual({
      userId: "123",
      preferences: '{"theme":"dark"}',
    });
  });

  it("truncates long strings to fit value length limits", () => {
    const longString = "a".repeat(10);
    const serialized = serializeMetadata({ text: longString }, 50, 8);

    // Limits the length to 8: 'aaaaa...' (last 3 are ...)
    expect(serialized.text).toBe("aaaaa...");
    expect((serialized as any).text.length).toBe(8);
  });

  it("limits number of keys", () => {
    const data = { a: 1, b: 2, c: 3 };
    const serialized = serializeMetadata(data, 2, 500);
    expect(Object.keys(serialized).length).toBe(2);
    expect(serialized.a).toBe("1");
    expect(serialized.b).toBe("2");
    expect(serialized.c).toBeUndefined();
  });
});
