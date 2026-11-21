import { describe, expect, it } from "vitest";
import { validatePhone } from "@/lib/phone";

describe("validatePhone", () => {
  it.each([
    "+54 11 1234-5678",
    "+54 9 11 1234-5678",
    "11 1234-5678",
    "(011) 4123.4567",
    "1112345678",
  ])("accepts %s", (value) => {
    expect(validatePhone(value)).toBe(true);
  });

  it.each(["", "   ", "1234567", "abc12345678", "+54 11 1234 5678 9999 9", "11+12345678"])(
    "rejects %s",
    (value) => {
      expect(validatePhone(value)).toBe(false);
    },
  );
});
