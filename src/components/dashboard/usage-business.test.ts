import { describe, expect, it } from "vitest";
import { countOf, dayRangeSeconds } from "@/components/dashboard/usage-business";

describe("countOf", () => {
  it("reads the count for a key, defaulting to zero", () => {
    const items = [
      { key: "ENROLLED", count: 5 },
      { key: "COMPLETED", count: 3 },
    ];
    expect(countOf(items, "ENROLLED")).toBe(5);
    expect(countOf(items, "DROPPED")).toBe(0);
  });
});

describe("dayRangeSeconds", () => {
  it("spans a full local day (end inclusive)", () => {
    const { from, to } = dayRangeSeconds("2026-11-05");
    expect(new Date(from * 1000).getFullYear()).toBe(2026);
    expect(to - from).toBe(24 * 3600 - 1);
    // Midnight local time → seconds divisible by 60.
    expect(from % 60).toBe(0);
  });
});
