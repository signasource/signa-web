import { describe, expect, it } from "vitest";
import {
  formatRange,
  matchPreset,
  periodFromParams,
  periodLabel,
  rangeLength,
  RANGE_PRESETS,
  validateRange,
} from "@/lib/date-range";

const TODAY = new Date(2026, 9, 18, 15, 0); // Sunday 18 oct 2026

describe("date range", () => {
  it("builds presets from today", () => {
    const ranges = Object.fromEntries(RANGE_PRESETS.map((p) => [p.key, p.range(TODAY)]));
    expect(ranges["7d"]).toEqual({ from: "2026-10-12", to: "2026-10-18" });
    expect(ranges["30d"]).toEqual({ from: "2026-09-19", to: "2026-10-18" });
    expect(ranges.month).toEqual({ from: "2026-10-01", to: "2026-10-18" });
    expect(ranges.lastMonth).toEqual({ from: "2026-09-01", to: "2026-09-30" });
    expect(rangeLength(ranges["90d"]!)).toBe(90);
    expect(ranges["12m"]).toEqual({ from: "2025-10-19", to: "2026-10-18" });
  });

  it("recognizes a preset and falls back to the whole history for bad params", () => {
    expect(matchPreset({ from: "2026-10-12", to: "2026-10-18" }, TODAY)?.label).toBe(
      "Últimos 7 días",
    );
    expect(matchPreset({ from: "2026-10-11", to: "2026-10-18" }, TODAY)).toBeNull();
    expect(periodFromParams("2026-10-01", "2026-10-05", TODAY)).toEqual({
      from: "2026-10-01",
      to: "2026-10-05",
    });
    expect(periodFromParams("2026-10-05", "2026-10-01", TODAY)).toBeNull();
    expect(periodFromParams("ayer", null, TODAY)).toBeNull();
    expect(periodFromParams(null, null, TODAY)).toBeNull();
  });

  it("labels the period for the chip", () => {
    expect(periodLabel(null, TODAY)).toBe("Todo el historial");
    expect(periodLabel({ from: "2026-09-19", to: "2026-10-18" }, TODAY)).toBe("Últimos 30 días");
    expect(periodLabel({ from: "2026-10-03", to: "2026-10-09" }, TODAY)).toBe("3 – 9 oct 2026");
  });

  it("validates order, future dates and length", () => {
    expect(validateRange({ from: "2026-10-01", to: "2026-10-18" }, TODAY)).toBeNull();
    expect(validateRange({ from: "", to: "2026-10-18" }, TODAY)).toMatch(/Elegí/);
    expect(validateRange({ from: "2026-10-10", to: "2026-10-01" }, TODAY)).toMatch(/anterior/);
    expect(validateRange({ from: "2026-10-10", to: "2026-10-19" }, TODAY)).toMatch(/hoy/);
    expect(validateRange({ from: "2025-10-17", to: "2026-10-18" }, TODAY)).toMatch(/366 días/);
    expect(validateRange({ from: "2025-10-18", to: "2026-10-18" }, TODAY)).toBeNull();
  });

  it("formats ranges compactly", () => {
    expect(formatRange({ from: "2026-10-03", to: "2026-10-09" })).toBe("3 – 9 oct 2026");
    expect(formatRange({ from: "2026-09-28", to: "2026-10-04" })).toBe("28 sep – 4 oct 2026");
    expect(formatRange({ from: "2025-12-20", to: "2026-01-05" })).toBe("20 dic 2025 – 5 ene 2026");
    expect(formatRange({ from: "2026-10-09", to: "2026-10-09" })).toBe("9 oct 2026");
  });
});
