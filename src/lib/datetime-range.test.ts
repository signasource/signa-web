import { describe, expect, it } from "vitest";
import {
  ALL_TIME_LABEL,
  ALL_TIME_RANGE,
  isAllTimeRange,
  previousRange,
  deriveStepSeconds,
  isoToLocalInput,
  localInputToIso,
  presetRange,
  resolveRange,
  selectionLabel,
  selectionWindow,
  spanSeconds,
  validateRange,
} from "./datetime-range";

const NOW = new Date("2026-11-05T12:00:00.000Z");

describe("presetRange", () => {
  it("ends at now and spans the requested minutes", () => {
    const range = presetRange(60, NOW);
    expect(range.to).toBe("2026-11-05T12:00:00.000Z");
    expect(range.from).toBe("2026-11-05T11:00:00.000Z");
  });
});

describe("resolveRange", () => {
  it("anchors a preset to now", () => {
    const range = resolveRange({ kind: "preset", key: "1h" }, NOW);
    expect(spanSeconds(range)).toBe(3600);
  });

  it("returns a custom window unchanged", () => {
    const range = resolveRange(
      { kind: "custom", from: "2026-11-01T00:00:00.000Z", to: "2026-11-02T00:00:00.000Z" },
      NOW,
    );
    expect(range.from).toBe("2026-11-01T00:00:00.000Z");
    expect(spanSeconds(range)).toBe(86400);
  });

  it("resolves all to the all-time sentinel", () => {
    const range = resolveRange({ kind: "all" }, NOW);
    expect(range).toBe(ALL_TIME_RANGE);
    expect(isAllTimeRange(range)).toBe(true);
  });
});

describe("deriveStepSeconds", () => {
  it("keeps a coarse enough step for a 1h window", () => {
    expect(deriveStepSeconds(presetRange(60, NOW))).toBe(30);
  });

  it("never goes below 15s", () => {
    expect(deriveStepSeconds(presetRange(15, NOW))).toBe(15);
  });

  it("snaps a day-long window to a nice step", () => {
    expect(deriveStepSeconds(presetRange(24 * 60, NOW))).toBe(900);
  });
});

describe("validateRange", () => {
  it("accepts a valid window", () => {
    expect(validateRange(presetRange(60, NOW), NOW)).toBeNull();
  });

  it("rejects reversed bounds", () => {
    const range = { from: "2026-11-05T12:00:00.000Z", to: "2026-11-05T11:00:00.000Z" };
    expect(validateRange(range, NOW)).toMatch(/anterior/);
  });

  it("rejects a future end", () => {
    const range = { from: "2026-11-05T11:00:00.000Z", to: "2026-11-06T12:00:00.000Z" };
    expect(validateRange(range, NOW)).toMatch(/posterior/);
  });

  it("rejects an over-long window", () => {
    const range = { from: "2020-01-01T00:00:00.000Z", to: "2026-11-05T12:00:00.000Z" };
    expect(validateRange(range, NOW)).toMatch(/366/);
  });

  it("rejects unparseable input", () => {
    expect(validateRange({ from: "nope", to: "also" }, NOW)).toMatch(/Elegí/);
  });
});

describe("datetime-local conversions round-trip", () => {
  it("iso ⇄ local input", () => {
    const iso = "2026-11-05T12:30:00.000Z";
    const local = isoToLocalInput(iso);
    expect(localInputToIso(local)).toBe(iso);
  });

  it("returns empty for invalid input", () => {
    expect(isoToLocalInput("nope")).toBe("");
    expect(localInputToIso("nope")).toBe("");
  });
});

describe("selectionLabel", () => {
  it("names the all-time selection", () => {
    expect(selectionLabel({ kind: "all" })).toBe(ALL_TIME_LABEL);
  });

  it("names a preset", () => {
    expect(selectionLabel({ kind: "preset", key: "24h" })).toBe("Últimas 24 horas");
  });

  it("formats a custom range", () => {
    const label = selectionLabel({
      kind: "custom",
      from: "2026-11-01T00:00:00.000Z",
      to: "2026-11-02T00:00:00.000Z",
    });
    expect(label).toContain("–");
  });
});

describe("previousRange", () => {
  it("returns the equal-length window that ends where the range starts", () => {
    expect(
      previousRange({ from: "2026-11-10T00:00:00.000Z", to: "2026-11-11T12:00:00.000Z" }),
    ).toEqual({ from: "2026-11-08T12:00:00.000Z", to: "2026-11-10T00:00:00.000Z" });
  });

  it("returns null for an empty or unparseable range", () => {
    expect(previousRange({ from: "", to: "" })).toBeNull();
    expect(
      previousRange({ from: "2026-11-10T00:00:00.000Z", to: "2026-11-10T00:00:00.000Z" }),
    ).toBeNull();
  });
});

describe("selectionWindow", () => {
  const NOW = 10_000;
  it("cuts the bucket in progress at now without moving its start", () => {
    // 10:00–11:00 clicked at 10:31 → 10:00–10:31, not 9:31–10:31.
    expect(selectionWindow(7_000, 10_599, NOW, 300)).toEqual({ from: 7_000, to: NOW });
  });
  it("keeps a past window as it is, in either order", () => {
    expect(selectionWindow(2_000, 1_000, NOW, 300)).toEqual({ from: 1_000, to: 2_000 });
  });
  it("widens a tiny window around its middle", () => {
    expect(selectionWindow(5_000, 5_060, NOW, 300)).toEqual({ from: 4_880, to: 5_180 });
  });
  it("widens a tiny window at now backwards, never into the future", () => {
    expect(selectionWindow(9_950, 10_050, NOW, 300)).toEqual({ from: 9_700, to: NOW });
  });
});
