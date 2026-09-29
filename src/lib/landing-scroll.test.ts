import { describe, expect, it } from "vitest";
import { elementProgress } from "@/lib/landing-scroll";

describe("elementProgress", () => {
  it("is 0 before the element reaches 85% of the viewport and 1 past 35%", () => {
    expect(elementProgress(1000, 1000)).toBe(0);
    expect(elementProgress(850, 1000)).toBe(0);
    expect(elementProgress(600, 1000)).toBeCloseTo(0.5);
    expect(elementProgress(350, 1000)).toBe(1);
    expect(elementProgress(-500, 1000)).toBe(1);
  });

  it("falls back to fully revealed for a degenerate viewport", () => {
    expect(elementProgress(100, 0)).toBe(1);
  });
});
