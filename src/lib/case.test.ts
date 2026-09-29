import { describe, expect, it } from "vitest";
import { keysToCamel, keysToSnake } from "@/lib/case";

describe("case conversion", () => {
  it("converts nested keys to snake_case", () => {
    expect(keysToSnake({ refreshToken: "x", nested: [{ maxUses: 1 }] })).toEqual({
      refresh_token: "x",
      nested: [{ max_uses: 1 }],
    });
  });

  it("converts nested keys to camelCase", () => {
    expect(keysToCamel({ access_token: "a", items: [{ last_activity_at: null }] })).toEqual({
      accessToken: "a",
      items: [{ lastActivityAt: null }],
    });
  });

  it("leaves primitives untouched", () => {
    expect(keysToCamel("some_value")).toBe("some_value");
    expect(keysToSnake(null)).toBeNull();
  });
});
