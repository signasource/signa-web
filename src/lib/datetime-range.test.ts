import { describe, expect, it } from "vitest";
import {
  deriveStepSeconds,
  isoToLocalInput,
  localInputToIso,
  presetRange,
  resolveRange,
  selectionLabel,
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
