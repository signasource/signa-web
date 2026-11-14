/**
 * Pure helpers for the usage dashboard: Argentine number formatting, rates, and reductions over
 * Prometheus series (average, peak, totals from a per-second rate). Kept free of React so they are
 * unit-tested on their own.
 */
import type {
  CohortRetention,
  GrowthMetrics,
  PerfMetrics,
  PerfSeries,
  SeriesAmount,
} from "@/lib/api/metrics";
import type { DateTimeRange } from "@/lib/datetime-range";

/** One decimal with an Argentine comma and a trailing "%": `pct1(5.8)` → "5,8%". */
export function pct1(value: number): string {
  return `${value.toLocaleString("es-AR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
}

/** A whole percentage: `pct0(68.4)` → "68%". */
export function pct0(value: number): string {
  return `${Math.round(value).toLocaleString("es-AR")}%`;
}

/** `part / whole` as a percentage with one decimal (0 when the whole is 0). */
export function rate1(part: number, whole: number): number {
  return whole > 0 ? Math.round((part / whole) * 1000) / 10 : 0;
}

/** `part / whole` as a percentage with one decimal, or `null` when not computable. */
export function rateOrNull(part: number | null | undefined, whole: number | null | undefined) {
  return part == null || whole == null || whole <= 0 ? null : rate1(part, whole);
}

/** Seconds → "7m 42s" / "45s" ("—" for zero/absent). */
export function fmtDuration(seconds: number | null | undefined): string {
  if (!seconds) return "—";
  const s = Math.round(seconds);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

/** A duration difference that always shows minutes: 18 → "0m 18s". */
export function fmtDurationDiff(seconds: number): string {
  const s = Math.round(Math.abs(seconds));
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

/** Days spanned by the range (fractional), 0 when unparseable. */
export function rangeDays(range: DateTimeRange): number {
  const from = Date.parse(range.from);
  const to = Date.parse(range.to);
  if (Number.isNaN(from) || Number.isNaN(to) || to <= from) return 0;
  return (to - from) / 86_400_000;
}

/** "43 por día en promedio" for a count over the range; `null` for windows under a day. */
export function perDayHint(count: number, range: DateTimeRange): string | null {
  const days = rangeDays(range);
  if (days < 1) return null;
  return `${Math.round(count / days).toLocaleString("es-AR")} por día en promedio`;
}

/** Non-null values of a series, in time order. */
export function seriesValues(series: PerfSeries | undefined): number[] {
  return (series?.points ?? []).flatMap((p) => (p.v == null ? [] : [p.v]));
}

/** Mean of the first series' points (the "typical" value over the window), or `null`. */
export function perfAverage(data: PerfMetrics | undefined): number | null {
  if (!data?.available) return null;
  const values = seriesValues(data.series[0]);
  return values.length ? values.reduce((s, v) => s + v, 0) / values.length : null;
}

/** Highest point of the first series, or `null`. */
export function perfPeak(data: PerfMetrics | undefined): number | null {
  if (!data?.available) return null;
  const values = seriesValues(data.series[0]);
  return values.length ? Math.max(...values) : null;
}

/** The last non-null point of a series, or `null`. */
export function seriesLatest(series: PerfSeries | undefined): number | null {
  const values = seriesValues(series);
  return values.length ? values[values.length - 1]! : null;
}

/**
 * Total events over the window from a per-second rate series (e.g. email failures): each point is
 * the rate over one step, so the total is Σ rate × step. The step is read from the point spacing.
 */
export function perfTotal(data: PerfMetrics | undefined): number | null {
  if (!data?.available) return null;
  let total = 0;
  for (const series of data.series) {
    const points = series.points;
    for (let i = 0; i < points.length; i += 1) {
      const v = points[i]!.v;
      if (v == null) continue;
      const next = points[i + 1]?.t ?? null;
      const prev = points[i - 1]?.t ?? null;
      const step = next != null ? next - points[i]!.t : prev != null ? points[i]!.t - prev : 60;
      total += v * step;
    }
  }
  return Math.round(total);
}

/**
 * Seven-day retention of the people who signed up in the window: the cohorts whose day-7 mark is
 * already observable, weighted by cohort size. `null` when no cohort is observable yet.
 */
export function retention7(cohorts: CohortRetention[]): number | null {
  let users = 0;
  let retained = 0;
  for (const c of cohorts) {
    if (c.d7 == null || c.cohortSize <= 0) continue;
    users += c.cohortSize;
    retained += c.d7;
  }
  return users > 0 ? rate1(retained, users) : null;
}

/** Money in and out over the window, split between organizations and end users (gems + courses). */
export function revenueTotals(g: GrowthMetrics) {
  const orgPaid = g.revenue.paidAmount;
  const orgRefunded = g.revenue.refundedAmount;
  const usersPaid = g.gems.paidAmount + g.courseSales.paidAmount;
  const usersRefunded = g.gems.refundedAmount + g.courseSales.refundedAmount;
  const gross = orgPaid + usersPaid;
  const refunded = orgRefunded + usersRefunded;
  return {
    orgPaid,
    orgRefunded,
    usersPaid,
    usersRefunded,
    orgNet: orgPaid - orgRefunded,
    usersNet: usersPaid - usersRefunded,
    gross,
    refunded,
    net: gross - refunded,
    refundRate: rate1(refunded, gross),
  };
}

/** Gross income per bucket across every source (organizations, gems, paid courses), in time order. */
export function dailyRevenue(g: GrowthMetrics): number[] {
  const byT = new Map<string, number>();
  const add = (series: SeriesAmount[]) => {
    for (const p of series) byT.set(p.t, (byT.get(p.t) ?? 0) + p.amount);
  };
  add(g.revenue.daily);
  add(g.gems.daily);
  add(g.courseSales.daily);
  return [...byT.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => v);
}

/** Paying end users over all accounts, as a percentage (one decimal). */
export function paymentConversion(g: GrowthMetrics): number {
  return rate1(g.endUsers.payingUsers, g.users.total);
}
