import { describe, expect, it } from "vitest";
import type { DailyActivity } from "@/lib/api/types";
import {
  bucketActivity,
  formatRange,
  matchPreset,
  rangeFromParams,
  rangeLength,
  RANGE_PRESETS,
  validateRange,
} from "@/lib/date-range";

const TODAY = new Date(2026, 9, 18, 15, 0); // Sunday 18 oct 2026

function day(date: string, exerciseAttempts: number, correctAnswers: number, lessons = 0) {
  return {
    date,
    figures: {
      activeParticipants: exerciseAttempts ? 1 : 0,
      exerciseAttempts,
      correctAnswers,
      correctPercentage: 0,
      lessonsCompleted: lessons,
      learningMinutes: 0,
    },
  } satisfies DailyActivity;
}

describe("date range", () => {
  it("builds presets from today", () => {
    const ranges = Object.fromEntries(RANGE_PRESETS.map((p) => [p.key, p.range(TODAY)]));
    expect(ranges["7d"]).toEqual({ from: "2026-10-12", to: "2026-10-18" });
    expect(ranges["30d"]).toEqual({ from: "2026-09-19", to: "2026-10-18" });
    expect(ranges.month).toEqual({ from: "2026-10-01", to: "2026-10-18" });
    expect(ranges.lastMonth).toEqual({ from: "2026-09-01", to: "2026-09-30" });
    expect(rangeLength(ranges["90d"]!)).toBe(90);
  });

  it("recognizes a preset and falls back to the default for bad params", () => {
    expect(matchPreset({ from: "2026-10-12", to: "2026-10-18" }, TODAY)?.label).toBe(
      "Últimos 7 días",
    );
    expect(matchPreset({ from: "2026-10-11", to: "2026-10-18" }, TODAY)).toBeNull();
    expect(rangeFromParams("2026-10-01", "2026-10-05", TODAY)).toEqual({
      from: "2026-10-01",
      to: "2026-10-05",
    });
    expect(rangeFromParams("2026-10-05", "2026-10-01", TODAY)).toEqual({
      from: "2026-09-19",
      to: "2026-10-18",
    });
    expect(rangeFromParams("ayer", null, TODAY).to).toBe("2026-10-18");
  });

  it("validates order, future dates and length", () => {
    expect(validateRange({ from: "2026-10-01", to: "2026-10-18" }, TODAY)).toBeNull();
    expect(validateRange({ from: "", to: "2026-10-18" }, TODAY)).toMatch(/Elegí/);
    expect(validateRange({ from: "2026-10-10", to: "2026-10-01" }, TODAY)).toMatch(/anterior/);
    expect(validateRange({ from: "2026-10-10", to: "2026-10-19" }, TODAY)).toMatch(/hoy/);
    expect(validateRange({ from: "2026-07-17", to: "2026-10-18" }, TODAY)).toMatch(/93 días/);
    expect(validateRange({ from: "2026-07-18", to: "2026-10-18" }, TODAY)).toBeNull();
  });

  it("formats ranges compactly", () => {
    expect(formatRange({ from: "2026-10-03", to: "2026-10-09" })).toBe("3 – 9 oct 2026");
    expect(formatRange({ from: "2026-09-28", to: "2026-10-04" })).toBe("28 sep – 4 oct 2026");
    expect(formatRange({ from: "2025-12-20", to: "2026-01-05" })).toBe("20 dic 2025 – 5 ene 2026");
    expect(formatRange({ from: "2026-10-09", to: "2026-10-09" })).toBe("9 oct 2026");
  });

  it("keeps one bar per day for short periods", () => {
    const buckets = bucketActivity([day("2026-10-01", 4, 3), day("2026-10-02", 0, 0, 2)]);
    expect(buckets).toHaveLength(2);
    expect(buckets[0]).toMatchObject({
      label: "1 oct",
      exerciseAttempts: 4,
      correctPercentage: 75,
    });
    expect(buckets[1]).toMatchObject({ lessonsCompleted: 2, correctPercentage: 0 });
  });

  it("groups long periods by Monday-started week", () => {
    // 40 days from Wednesday 2 sep: the first week is clipped to Wed–Sun.
    const days = Array.from({ length: 40 }, (_, i) => {
      const d = new Date(2026, 8, 2 + i);
      const iso = `2026-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      return day(iso, 2, 1);
    });
    const buckets = bucketActivity(days);
    expect(buckets[0]).toMatchObject({
      start: "2026-09-02",
      longLabel: "Semana del 2 sep",
      exerciseAttempts: 10,
      correctPercentage: 50,
    });
    expect(buckets[1]).toMatchObject({ start: "2026-09-07", exerciseAttempts: 14 });
    expect(buckets.reduce((n, b) => n + b.exerciseAttempts, 0)).toBe(80);
  });
});
