import { describe, expect, it } from "vitest";
import { isSafeSign } from "@/lib/glb";

describe("isSafeSign", () => {
  it("accepts plain sign names, with accents and spaces", () => {
    expect(isSafeSign("hola")).toBe(true);
    expect(isSafeSign("perdón")).toBe(true);
    expect(isSafeSign("por favor")).toBe(true);
  });

  it("rejects empty, overlong, or markup-bearing names", () => {
    expect(isSafeSign("")).toBe(false);
    expect(isSafeSign("a".repeat(41))).toBe(false);
    expect(isSafeSign("hola</script>")).toBe(false);
    expect(isSafeSign("../secret")).toBe(false);
    expect(isSafeSign('hola"')).toBe(false);
  });
});
