"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  type TooltipContentProps,
  type TooltipValueType,
} from "recharts";
import { useChartKind } from "@/components/dashboard/chart-kind";
import { InfoPopover } from "@/components/dashboard/info-popover";
import type { MetricId } from "@/components/dashboard/metric-catalog";
import type { RangeSelect, ValueFormat } from "@/components/dashboard/perf-chart";
import { Card, CardTitle } from "@/components/dashboard/ui";

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

const DAY_SECONDS = 86400;

/** One series point. `t` is the bucket's start instant (ISO-8601) or a `YYYY-MM-DD` day. */
type Point = { t: string; value: number };
type Datum = { label: string; epoch: number; value: number };

/**
 * Smallest positive gap (seconds) between consecutive points = the series' bucket size, so the chart
 * labels minute/hour buckets as a time and day buckets as a date without the caller passing a unit.
 * Falls back to day resolution for a single point or an all-equal series.
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
        <p className="font-extrabold">{format(point.value)}</p>
      </div>
    );
  };
}

/**
 * Generic time-series for a `{ t, value }` series (new users, revenue, …) at whatever resolution the
 * API bucketed it to: minute/hour buckets are labelled as a time, day buckets as a date. Renders as
 * bars or a line per the page-level chart kind. Clicking a bar selects that bucket's window through
 * `onSelectRange`, driving the global filter. Self-documents via the metric's InfoPopover.
 */
export function DailySeriesChart({
  title,
  subtitle,
  metric,
  points,
  format = (v) => v.toLocaleString("es-AR"),
  onSelectRange,
  className,
}: {
  title: string;
  subtitle?: string;
  metric: MetricId;
  points: Point[];
  format?: ValueFormat;
  onSelectRange?: RangeSelect;
  className?: string;
}) {
  const kind = useChartKind();
  const data: Datum[] = points.map((p) => ({
    label: p.t,
    epoch: new Date(p.t).getTime(),
    value: p.value,
  }));
  const bucketSeconds = inferBucketSeconds(data.map((d) => d.epoch));
  const subDay = bucketSeconds < DAY_SECONDS;
  const tickFmt = subDay ? TIME_FMT : DAY_FMT;
  for (const d of data) d.label = tickFmt.format(new Date(d.epoch));

  const summary = data
    .map((d) => `${(subDay ? FULL_FMT : DAY_FMT).format(new Date(d.epoch))}: ${format(d.value)}`)
    .join(". ");

  const selectBucket = (d: Datum) => {
    if (!onSelectRange) return;
    const from = Math.floor(d.epoch / 1000);
    onSelectRange(from, from + bucketSeconds - 1);
  };

  return (
    <Card className={className ?? "flex min-w-0 flex-col gap-3"}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <CardTitle>{title}</CardTitle>
          {subtitle ? <p className="text-text-muted mt-0.5 text-[13px]">{subtitle}</p> : null}
        </div>
        <InfoPopover metric={metric} className="mt-0.5" />
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
                minTickGap={16}
                tick={{ fill: "var(--color-text-muted)", fontSize: 12 }}
              />
              <Tooltip
                content={makeTooltip(format, subDay)}
                cursor={{ fill: "var(--color-fill)", radius: 8 }}
                isAnimationActive={false}
              />
              {kind === "line" ? (
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="var(--color-primary)"
                  strokeWidth={2}
                  dot={false}
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
