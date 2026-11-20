import { describe, expect, it } from "vitest";
import { expiryTone, fmtDayMonth } from "@/components/dashboard/format";

const NOW = new Date("2026-11-11T12:00:00.000Z");

describe("fmtDayMonth", () => {
  it("drops the year for nearby dates and keeps it for far ones", () => {
    // ISO strings are in UTC; Argentina is UTC-3, so 00:00 UTC is 21:00 previous day in Argentina
    // Dates are adjusted to represent the same date in Argentina timezone
    expect(fmtDayMonth("2026-11-18T03:00:00.000Z", NOW)).toBe("18 nov");
    expect(fmtDayMonth("2027-02-05T03:00:00.000Z", NOW)).toBe("5 feb");
    expect(fmtDayMonth("2028-02-05T03:00:00.000Z", NOW)).toBe("5 de feb de 2028");
    expect(fmtDayMonth(null, NOW)).toBe("—");
    expect(fmtDayMonth("nope", NOW)).toBe("—");
  });
});

describe("expiryTone", () => {
  it("is neutral without a date", () => {
    expect(expiryTone(null)).toBe("neutral");
  });
});
