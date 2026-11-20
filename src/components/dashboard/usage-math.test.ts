import { describe, expect, it } from "vitest";
import {
  fmtDuration,
  fmtDurationDiff,
  pct0,
  pct1,
  perDayHint,
  perfAverage,
  perfPeak,
  perfTotal,
  rate1,
  rateOrNull,
  retention7,
  revenueTotals,
} from "@/components/dashboard/usage-math";
import type { GrowthMetrics, PerfMetrics } from "@/lib/api/metrics";

const perf = (values: (number | null)[], step = 60): PerfMetrics => ({
  widget: "w",
  available: true,
  series: [{ labels: {}, points: values.map((v, i) => ({ t: 1000 + i * step, v })) }],
});

describe("formatting", () => {
  it("uses the Argentine comma", () => {
    expect(pct1(5.8)).toBe("5,8%");
    expect(pct1(4)).toBe("4,0%");
    expect(pct0(68.4)).toBe("68%");
  });

  it("formats durations and duration differences", () => {
    expect(fmtDuration(462)).toBe("7m 42s");
    expect(fmtDuration(45)).toBe("45s");
    expect(fmtDuration(0)).toBe("—");
    expect(fmtDurationDiff(-18)).toBe("0m 18s");
  });

  it("averages per day only for windows of a day or more", () => {
    const month = { from: "2026-10-10T00:00:00.000Z", to: "2026-11-09T00:00:00.000Z" };
    expect(perDayHint(1284, month)).toBe("43 por día en promedio");
    expect(
      perDayHint(10, { from: "2026-11-09T00:00:00.000Z", to: "2026-11-09T04:00:00.000Z" }),
    ).toBeNull();
  });
});

describe("rates", () => {
  it("rounds to one decimal and guards a zero whole", () => {
    expect(rate1(612, 14390)).toBe(4.3);
    expect(rate1(1, 0)).toBe(0);
    expect(rateOrNull(1, 0)).toBeNull();
    expect(rateOrNull(null, 10)).toBeNull();
  });
});

describe("perf reductions", () => {
  it("averages, peaks and ignores gaps", () => {
    const data = perf([10, null, 30, 20]);
    expect(perfAverage(data)).toBe(20);
    expect(perfPeak(data)).toBe(30);
  });

  it("integrates a per-second rate into a total", () => {
    // 0.01 events/s over three 100 s steps = 3 events.
    expect(perfTotal(perf([0.01, 0.01, 0.01], 100))).toBe(3);
  });

  it("is null when Grafana is not available", () => {
    const unavailable = { widget: "w", available: false, series: [] };
    expect(perfAverage(unavailable)).toBeNull();
    expect(perfTotal(unavailable)).toBeNull();
  });
});

describe("retention7", () => {
  it("weights the observable cohorts by size", () => {
    const cohort = (size: number, d7: number | null) => ({
      weekStart: "2026-10-05",
      cohortSize: size,
      d1: null,
      d1Percent: null,
      d7,
      d7Percent: d7 == null ? null : rate1(d7, size),
      d30: null,
      d30Percent: null,
    });
    expect(retention7([cohort(100, 40), cohort(300, 110), cohort(50, null)])).toBe(37.5);
    expect(retention7([cohort(50, null)])).toBeNull();
  });
});

describe("revenueTotals", () => {
  // Paid in the window (gross, refunded ones included) vs. net (not refunded), per source.
  const growth = (over: {
    org: [number, number, number];
    gems: [number, number, number];
    courses: [number, number, number];
  }) =>
    ({
      revenue: { paidAmount: over.org[0], netAmount: over.org[1], refundedAmount: over.org[2] },
      gems: { paidAmount: over.gems[0], netAmount: over.gems[1], refundedAmount: over.gems[2] },
      courseSales: {
        paidAmount: over.courses[0],
        netAmount: over.courses[1],
        refundedAmount: over.courses[2],
      },
    }) as unknown as GrowthMetrics;

  it("nets out the refunded purchases of the window, like the revenue chart", () => {
    const m = revenueTotals(
      growth({ org: [0, 0, 0], gems: [20_500, 20_500, 0], courses: [11_000, 5_500, 5_500] }),
    );
    expect(m.net).toBe(26_000);
    expect(m.gross).toBe(31_500);
    expect(m.refunded).toBe(5_500);
    expect(m.usersNet).toBe(26_000);
    expect(m.refundRate).toBe(17.5);
  });

  it("ignores refunds made in the window for purchases paid before it", () => {
    // Nothing sold to organizations this window, but an older purchase was refunded in it.
    const m = revenueTotals(
      growth({ org: [0, 0, 17_600], gems: [10_500, 10_500, 1_500], courses: [0, 0, 0] }),
    );
    expect(m.net).toBe(10_500);
    expect(m.orgNet).toBe(0);
    expect(m.refunded).toBe(0);
    expect(m.refundRate).toBe(0);
  });
});
