import { appendQueryParam } from "@/utils/url";
import { describe, it, expect } from "vitest";

describe("appendQueryParam", () => {
  it("appends param with '?' if no query exists", () => {
    expect(
      appendQueryParam(
        "https://example.com/callback",
        "session_id={CHECKOUT_SESSION_ID}",
      ),
    ).toBe("https://example.com/callback?session_id={CHECKOUT_SESSION_ID}");
  });

  it("appends param with '&' if query already exists", () => {
    expect(
      appendQueryParam(
        "https://example.com/callback?foo=bar",
        "session_id={CHECKOUT_SESSION_ID}",
      ),
    ).toBe(
      "https://example.com/callback?foo=bar&session_id={CHECKOUT_SESSION_ID}",
    );
  });
});
