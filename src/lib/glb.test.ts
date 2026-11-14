import { describe, expect, it } from "vitest";
import { isAllowedGlbSource, isSafeSign, R2_GLB_BASE, safeSignList } from "@/lib/glb";

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

describe("isAllowedGlbSource", () => {
  const api = "http://localhost:8090";

  it("accepts .glb files from the public bucket and the API media fallback", () => {
    expect(isAllowedGlbSource(`${R2_GLB_BASE}/hola.glb?v=3`, api)).toBe(true);
    expect(isAllowedGlbSource(`${api}/media/lsa/por%20favor.glb?v=1`, api)).toBe(true);
  });

  it("rejects other origins, paths, formats and garbage", () => {
    expect(isAllowedGlbSource("https://evil.example/hola.glb", api)).toBe(false);
    expect(isAllowedGlbSource(`${api}/admin/hola.glb`, api)).toBe(false);
    expect(isAllowedGlbSource(`${R2_GLB_BASE}/hola.mp4`, api)).toBe(false);
    expect(isAllowedGlbSource("javascript:alert(1)//.glb", api)).toBe(false);
    expect(isAllowedGlbSource("not a url", api)).toBe(false);
  });
});
