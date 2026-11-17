import { describe, expect, it } from "vitest";
import type { SignMedia } from "@/lib/api/types";
import { chunk, courseFormat, courseSignList, showcaseSigns } from "@/lib/course-preview";

const media = (format: "glb" | "mp4"): SignMedia => ({
  meaning: "x",
  url: "u",
  format,
  lateralUrl: null,
});

describe("courseFormat", () => {
  it("classifies by the formats present", () => {
    expect(courseFormat([])).toBe("unknown");
    expect(courseFormat([media("mp4"), media("mp4")])).toBe("video");
    expect(courseFormat([media("glb")])).toBe("avatar");
    expect(courseFormat([media("glb"), media("mp4")])).toBe("mixed");
  });
});

describe("showcaseSigns", () => {
  const modules = [
    { title: "A", signs: ["a1", "a2", "a3"] },
    { title: "B", signs: ["b1", "b2"] },
  ];

  it("alternates modules and skips signs without media", () => {
    const all = new Set(["a1", "a2", "a3", "b1", "b2"]);
    expect(showcaseSigns(modules, all, 4)).toEqual(["a1", "b1", "a2", "b2"]);
    expect(showcaseSigns(modules, new Set(["a2", "b2"]), 6)).toEqual(["a2", "b2"]);
  });

  it("returns nothing when no sign has media", () => {
    expect(showcaseSigns(modules, new Set(), 3)).toEqual([]);
  });
});

describe("helpers", () => {
  it("lists distinct signs and chunks", () => {
    const modules = [
      { title: "A", signs: ["a", "b"] },
      { title: "B", signs: ["b", "c"] },
    ];
    expect(courseSignList(modules)).toEqual(["a", "b", "c"]);
    expect(chunk([1, 2, 3], 2)).toEqual([[1, 2], [3]]);
  });
});
