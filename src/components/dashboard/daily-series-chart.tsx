"use client";

import { useState } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
  type TooltipValueType,
} from "recharts";
import { ChartKindToggle, type ChartKind } from "@/components/dashboard/chart-kind";
import { InfoPopover } from "@/components/dashboard/info-popover";
import type { MetricId } from "@/components/dashboard/metric-catalog";
import type { RangeSelect, ValueFormat } from "@/components/dashboard/perf-chart";
import { Card, CardTitle } from "@/components/dashboard/ui";
import type { DateTimeRange } from "@/lib/datetime-range";

// Buckets are UTC-aligned (epoch floor) and day strings parse as UTC midnight, so format in UTC to
// keep labels on the bucket boundary (no off-by-one from the local offset).
const TIME_FMT = new Intl.DateTimeFormat("es-AR", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
});
const DAY_FMT = new Intl.DateTimeFormat("es-AR", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});
const FULL_FMT = new Intl.DateTimeFormat("es-AR", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
});

const HOUR_SECONDS = 3600;
const DAY_SECONDS = 86400;
const SIX_HOURS = 6 * HOUR_SECONDS;
const THREE_DAYS = 3 * DAY_SECONDS;
/** Above this many buckets we stop zero-filling (keeps a huge all-time range from exploding). */
const MAX_FILLED_POINTS = 1500;

/** One series point. `t` is the bucket's start instant (ISO-8601) or a `YYYY-MM-DD` day. */
type Point = { t: string; value: number };
type Datum = { label: string; epoch: number; value: number | null; prev?: number | null };

/**
 * Bucket size (seconds) for a window, matching how the API buckets the series: minute if the span is
 * ≤ 6 h, hour if ≤ 3 d, else day. Used to lay out the whole period on the x axis — including buckets
 * with no data — so the axis unit follows the period and no empty stretches are hidden.
 */
function bucketSecondsFor(fromMs: number, toMs: number): number {
  const span = Math.max(0, (toMs - fromMs) / 1000);
  if (span <= SIX_HOURS) return 60;
  if (span <= THREE_DAYS) return HOUR_SECONDS;
  return DAY_SECONDS;
}

/**
 * Smallest positive gap (seconds) between consecutive points = the series' bucket size. Falls back to
 * day resolution for a single point or an all-equal series. Used only when no explicit range is given.
 */
function inferBucketSeconds(epochsMs: number[]): number {
  let min = Infinity;
  for (let i = 1; i < epochsMs.length; i++) {
    const gap = epochsMs[i]! - epochsMs[i - 1]!;
    if (gap > 0 && gap < min) min = gap;
  }
  return Number.isFinite(min) ? Math.round(min / 1000) : DAY_SECONDS;
}

function makeTooltip(format: ValueFormat, fullTime: boolean) {
  return function SeriesTooltip({
    active,
    payload,
  }: TooltipContentProps<TooltipValueType, string | number>) {
    const point = payload?.[0]?.payload as Datum | undefined;
    if (!active || !point) return null;
    const fmt = fullTime ? FULL_FMT : DAY_FMT;
    return (
      <div className="border-border bg-surface rounded-xl border px-3 py-2 text-[13px] shadow-lg">
        <p className="text-text-muted font-bold">{fmt.format(new Date(point.epoch))}</p>
        <p className="font-extrabold">{point.value == null ? "Sin datos" : format(point.value)}</p>
        {point.prev !== undefined ? (
          <p className="text-text-muted">
            Período anterior: {point.prev == null ? "sin datos" : format(point.prev)}
          </p>
        ) : null}
      </div>
    );
  };
}

/** "— Activos  - - Período anterior": the legend under a chart's title. */
export function SeriesLegend({
  items,
}: {
  items: { label: string; color: string; dashed?: boolean }[];
}) {
  return (
    <div className="text-text-muted mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px]">
      {items.map((item) => (
        <span key={item.label} className="inline-flex items-center gap-1.5">
          <svg width="14" height="4" aria-hidden="true">
            <line
              x1="0"
              y1="2"
              x2="14"
              y2="2"
              stroke={item.color}
              strokeWidth="2"
              strokeDasharray={item.dashed ? "3 3" : undefined}
            />
          </svg>
          {item.label}
        </span>
      ))}
    </div>
  );
}

/** Colour of the dashed "Período anterior" comparison line. */
export const PREVIOUS_COLOR = "var(--color-text-muted)";

/**
 * Generic time-series for a `{ t, value }` series (revenue, new users, …). When a `range` is given it
 * lays out **every** bucket of the period on the x axis (filling gaps with 0), so the axis shows the
 * whole window — not only the buckets that happened to have data — at a resolution (minute/hour/day)
 * that follows the period. The y axis is labelled with values. Each chart has its own line/bar switch.
 * Clicking a bar selects that bucket's window through `onSelectRange`. Self-documents via its popover.
 */
export function DailySeriesChart({
  title,
  subtitle,
  metric,
  points,
  range,
  dayResolution = false,
  emptyAsNull = false,
  format = (v) => v.toLocaleString("es-AR"),
  onSelectRange,
  className,
  previous,
  seriesLabel,
  showKindToggle = true,
}: {
  title: string;
  subtitle?: string;
  metric: MetricId;
  points: Point[];
  /**
   * The same series over the previous equal-length window. It is shifted forward by the window's
   * span and drawn as a dashed "Período anterior" line, so the change reads straight off the chart.
   */
  previous?: Point[];
  /** Legend name of the main series (shown when a previous series is drawn). */
  seriesLabel?: string;
  /** Show the per-chart "Línea / Barras" switch (default on). */
  showKindToggle?: boolean;
  /** The active window; when set, the x axis spans the whole period (gaps filled with 0). */
  range?: DateTimeRange;
  /** This series is always day-resolution (not adaptive) — fill the window day by day. */
  dayResolution?: boolean;
  /** Treat buckets with no data as "sin datos" (null) instead of 0 — for rates/percentages. */
  emptyAsNull?: boolean;
  format?: ValueFormat;
  onSelectRange?: RangeSelect;
  className?: string;
}) {
  const [kind, setKind] = useState<ChartKind>("line");

  // Drop points with an unparseable `t`: a single bad timestamp would otherwise make `Intl.format`
  // throw ("Invalid time value") and take down the whole dashboard page, not just this widget.
  const valid = points
    .map((p) => ({ epoch: new Date(p.t).getTime(), value: p.value }))
    .filter((d) => Number.isFinite(d.epoch));

  const fromMs = range ? new Date(range.from).getTime() : NaN;
  const toMs = range ? new Date(range.to).getTime() : NaN;
  const haveRange = Number.isFinite(fromMs) && Number.isFinite(toMs) && toMs > fromMs;

  const bucketSeconds = haveRange
    ? dayResolution
      ? DAY_SECONDS
      : bucketSecondsFor(fromMs, toMs)
    : inferBucketSeconds(valid.map((d) => d.epoch));
  const subDay = bucketSeconds < DAY_SECONDS;
  const tickFmt = subDay ? TIME_FMT : DAY_FMT;

  // The previous window's points, moved forward by the span so they line up with this window.
  const spanMs = haveRange ? toMs - fromMs : 0;
  const prevValid = (previous ?? [])
    .map((p) => ({ epoch: new Date(p.t).getTime() + spanMs, value: p.value }))
    .filter((d) => Number.isFinite(d.epoch));
  const withPrevious = previous !== undefined && haveRange;

  let data: Datum[];
  const bucketMs = bucketSeconds * 1000;
  const bucketCount = haveRange ? Math.ceil((toMs - fromMs) / bucketMs) : 0;
  if (haveRange && bucketCount > 0 && bucketCount <= MAX_FILLED_POINTS) {
    // Lay out every bucket of the window, filling the ones without data with 0.
    const valueByEpoch = new Map<number, number>();
    for (const d of valid) valueByEpoch.set(Math.floor(d.epoch / bucketMs) * bucketMs, d.value);
    const prevByEpoch = new Map<number, number>();
    for (const d of prevValid) prevByEpoch.set(Math.floor(d.epoch / bucketMs) * bucketMs, d.value);
    const start = Math.floor(fromMs / bucketMs) * bucketMs;
    data = [];
    for (let epoch = start; epoch < toMs; epoch += bucketMs) {
      const has = valueByEpoch.has(epoch);
      const datum: Datum = {
        epoch,
        value: has ? valueByEpoch.get(epoch)! : emptyAsNull ? null : 0,
        label: tickFmt.format(new Date(epoch)),
      };
      if (withPrevious) {
        datum.prev = prevByEpoch.has(epoch)
          ? prevByEpoch.get(epoch)!
          : emptyAsNull || prevValid.length === 0
            ? null
            : 0;
      }
      data.push(datum);
    }
  } else {
    data = valid.map((d) => ({ ...d, label: tickFmt.format(new Date(d.epoch)) }));
  }

  const summary = data
    .map(
      (d) =>
        `${(subDay ? FULL_FMT : DAY_FMT).format(new Date(d.epoch))}: ${
          d.value == null ? "sin datos" : format(d.value)
        }`,
    )
    .join(". ");

  const selectBucket = (d: Datum) => {
    if (!onSelectRange) return;
    const from = Math.floor(d.epoch / 1000);
    onSelectRange(from, from + bucketSeconds - 1);
  };

  return (
    <Card className={className ?? "flex min-w-0 flex-col gap-3"}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <CardTitle>{title}</CardTitle>
          {subtitle ? <p className="text-text-muted mt-0.5 text-[13px]">{subtitle}</p> : null}
          {withPrevious ? (
            <SeriesLegend
              items={[
                { label: seriesLabel ?? title, color: "var(--color-primary)" },
                { label: "Período anterior", color: PREVIOUS_COLOR, dashed: true },
              ]}
            />
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {showKindToggle ? <ChartKindToggle kind={kind} onChange={setKind} /> : null}
          <InfoPopover metric={metric} />
        </div>
      </div>
      {data.length === 0 ? (
        <p className="text-text-muted py-8 text-center text-sm">Sin datos en este período.</p>
      ) : (
        <div role="img" aria-label={summary} className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 16, right: 4, left: 4, bottom: 0 }}>
              <CartesianGrid stroke="var(--color-fill)" vertical={false} />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
                minTickGap={28}
                tick={{ fill: "var(--color-text-muted)", fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                width={52}
                allowDecimals={false}
                tickFormatter={(v) => format(Number(v))}
                tick={{ fill: "var(--color-text-muted)", fontSize: 11 }}
              />
              <Tooltip
                content={makeTooltip(format, subDay)}
                cursor={{ fill: "var(--color-fill)", radius: 8 }}
                isAnimationActive={false}
              />
              {withPrevious ? (
                <Line
                  type="monotone"
                  dataKey="prev"
                  stroke={PREVIOUS_COLOR}
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={false}
                  connectNulls
                  isAnimationActive={false}
                />
              ) : null}
              {kind === "line" ? (
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="var(--color-primary)"
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                  isAnimationActive={false}
                />
              ) : (
                <Bar
                  dataKey="value"
                  fill="var(--color-primary)"
                  radius={[8, 8, 4, 4]}
                  maxBarSize={40}
                  className={onSelectRange ? "cursor-pointer" : undefined}
                  onClick={(d) => selectBucket(d as unknown as Datum)}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}
