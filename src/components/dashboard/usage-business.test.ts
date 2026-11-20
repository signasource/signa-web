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
  it("spans a full Argentine day (end inclusive), whatever the browser's timezone", () => {
    const { from, to } = dayRangeSeconds("2026-11-05");
    // Midnight in Argentina is 03:00 UTC.
    expect(new Date(from * 1000).toISOString()).toBe("2026-11-05T03:00:00.000Z");
    expect(to - from).toBe(24 * 3600 - 1);
  });
});
