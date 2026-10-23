import type { ActivityFigures, DailyActivity } from "@/lib/api/types";

const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const DAY_MS = 86_400_000;

/** Longest custom period the dashboard endpoints accept (inclusive days). */
export const MAX_RANGE_DAYS = 366;
/** Up to this many days the chart shows one bar per day; longer periods group by week. */
export const MAX_DAILY_BARS = 31;
/** Past this many days weekly bars get too thin and the chart groups by month. */
export const MAX_WEEKLY_DAYS = 182;

export const ALL_TIME_LABEL = "Todo el historial";

/** Inclusive period as ISO dates (`YYYY-MM-DD`), in the local calendar. */
export type DateRange = { from: string; to: string };

/** The dashboard's period: a range, or `null` for the organization's whole history. */
export type Period = DateRange | null;

export type RangePreset = { key: string; label: string; range: (today: Date) => DateRange };

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function parseISODate(iso: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return null;
  const [, y, m, d] = match.map(Number) as [number, number, number, number];
  const date = new Date(y, m - 1, d);
  return date.getMonth() === m - 1 && date.getDate() === d ? date : null;
}

function addDays(d: Date, days: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + days);
}

/** Calendar days covered by the range, both ends included. */
export function rangeLength(range: DateRange): number {
  const from = parseISODate(range.from);
  const to = parseISODate(range.to);
  if (!from || !to) return 0;
  return Math.round((to.getTime() - from.getTime()) / DAY_MS) + 1;
}

function lastDays(days: number) {
  return (today: Date): DateRange => ({
    from: toISODate(addDays(today, -(days - 1))),
    to: toISODate(today),
  });
}

export const RANGE_PRESETS: RangePreset[] = [
  { key: "7d", label: "Últimos 7 días", range: lastDays(7) },
  { key: "30d", label: "Últimos 30 días", range: lastDays(30) },
  { key: "90d", label: "Últimos 90 días", range: lastDays(90) },
  { key: "12m", label: "Últimos 12 meses", range: lastDays(365) },
  {
    key: "month",
    label: "Este mes",
    range: (today) => ({
      from: toISODate(new Date(today.getFullYear(), today.getMonth(), 1)),
      to: toISODate(today),
    }),
  },
  {
    key: "lastMonth",
    label: "Mes anterior",
    range: (today) => ({
      from: toISODate(new Date(today.getFullYear(), today.getMonth() - 1, 1)),
      to: toISODate(new Date(today.getFullYear(), today.getMonth(), 0)),
    }),
  },
];

/** The preset the range equals today, if any — so a shared link still reads "Últimos 30 días". */
export function matchPreset(range: DateRange, today: Date = new Date()): RangePreset | null {
  return (
    RANGE_PRESETS.find((p) => {
      const r = p.range(today);
      return r.from === range.from && r.to === range.to;
    }) ?? null
  );
}

/** Chip text: "Todo el historial", a preset name, or the dates of a custom range. */
export function periodLabel(period: Period, today: Date = new Date()): string {
  if (!period) return ALL_TIME_LABEL;
  return matchPreset(period, today)?.label ?? formatRange(period);
}

/** Why a range cannot be requested, in UI copy; `null` when it is valid. */
export function validateRange(range: DateRange, today: Date = new Date()): string | null {
  const from = parseISODate(range.from);
  const to = parseISODate(range.to);
  if (!from || !to) return "Elegí una fecha de inicio y una de fin.";
  if (from > to) return "La fecha de inicio tiene que ser anterior a la de fin.";
  if (range.to > toISODate(today)) return "La fecha de fin no puede ser posterior a hoy.";
  if (rangeLength(range) > MAX_RANGE_DAYS)
    return `El período puede abarcar hasta ${MAX_RANGE_DAYS} días.`;
  return null;
}

/** Period from URL values: the whole history when they are missing or invalid. */
export function periodFromParams(
  from: string | null,
  to: string | null,
  today: Date = new Date(),
): Period {
  if (from && to && validateRange({ from, to }, today) === null) return { from, to };
  return null;
}

/** "3 – 9 oct 2026", "28 sep – 4 oct 2026", "20 dic 2025 – 5 ene 2026", "9 oct 2026". */
export function formatRange(range: DateRange): string {
  const from = parseISODate(range.from);
  const to = parseISODate(range.to);
  if (!from || !to) return "";
  const full = (d: Date) => `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  if (range.from === range.to) return full(to);
  if (from.getFullYear() !== to.getFullYear()) return `${full(from)} – ${full(to)}`;
  if (from.getMonth() !== to.getMonth())
    return `${from.getDate()} ${MONTHS[from.getMonth()]} – ${full(to)}`;
  return `${from.getDate()} – ${full(to)}`;
}

export type ActivityGranularity = "day" | "week" | "month";

/** How the chart groups a period of `days` days. */
export function activityGranularity(days: number): ActivityGranularity {
  if (days <= MAX_DAILY_BARS) return "day";
  if (days <= MAX_WEEKLY_DAYS) return "week";
  return "month";
}

export type ActivityBucket = {
  /** First day of the bucket (ISO date). */
  start: string;
  /** Axis label: "9 oct", or "oct" for a month. */
  label: string;
  /** Text-alternative label: "9 oct", "Semana del 6 oct" or "oct 2026". */
  longLabel: string;
  exerciseAttempts: number;
  correctPercentage: number;
  lessonsCompleted: number;
};

function shortDate(d: Date): string {
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/**
 * Groups the API's day-by-day figures into chart bars: one per day for short periods, one per
 * week (Monday start, clipped to the period) for longer ones, one per calendar month past
 * {@link MAX_WEEKLY_DAYS} days. Correct % is recomputed from the summed answers, never averaged.
 */
export function bucketActivity(days: DailyActivity[]): ActivityBucket[] {
  const granularity = activityGranularity(days.length);
  const firstDate = days[0] ? parseISODate(days[0].date) : null;
  const lastDate = days.at(-1) ? parseISODate(days.at(-1)!.date) : null;
  const severalYears = firstDate?.getFullYear() !== lastDate?.getFullYear();
  const buckets: (ActivityBucket & { correctAnswers: number })[] = [];
  for (const day of days) {
    const date = parseISODate(day.date);
    if (!date) continue;
    const opensBucket =
      buckets.length === 0 ||
      granularity === "day" ||
      (granularity === "week" && date.getDay() === 1) ||
      (granularity === "month" && date.getDate() === 1);
    if (opensBucket) {
      const month = MONTHS[date.getMonth()]!;
      buckets.push({
        start: day.date,
        label:
          granularity === "month"
            ? severalYears
              ? `${month} ${String(date.getFullYear()).slice(2)}`
              : month
            : shortDate(date),
        longLabel:
          granularity === "month"
            ? `${month} ${date.getFullYear()}`
            : granularity === "week"
              ? `Semana del ${shortDate(date)}`
              : shortDate(date),
        exerciseAttempts: 0,
        correctAnswers: 0,
        correctPercentage: 0,
        lessonsCompleted: 0,
      });
    }
    const bucket = buckets[buckets.length - 1]!;
    bucket.exerciseAttempts += day.figures.exerciseAttempts;
    bucket.correctAnswers += day.figures.correctAnswers;
    bucket.lessonsCompleted += day.figures.lessonsCompleted;
  }
  return buckets.map(({ correctAnswers, ...b }) => ({
    ...b,
    correctPercentage: b.exerciseAttempts
      ? Math.round((correctAnswers / b.exerciseAttempts) * 100)
      : 0,
  }));
}

export function hasActivity(totals: ActivityFigures): boolean {
  return (
    totals.activeParticipants > 0 || totals.exerciseAttempts > 0 || totals.lessonsCompleted > 0
  );
}
