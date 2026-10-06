import { describe, expect, it } from "vitest";
import { isSafeSign, safeSignList } from "@/lib/glb";

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

describe("safeSignList", () => {
  it("keeps the safe names once, in order", () => {
    expect(safeSignList(["A", "T", "A", "por favor"])).toEqual(["A", "T", "por favor"]);
  });

  it("drops anything that is not a safe name", () => {
    expect(safeSignList(["A", "<b>", 3, null, "../x"])).toEqual(["A"]);
  });

  it("is empty for something that is not a list, and capped in length", () => {
    expect(safeSignList("A")).toEqual([]);
    expect(safeSignList(Array.from({ length: 50 }, (_, i) => `s${i}`))).toHaveLength(32);
  });
});
