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
import { dayRangeSeconds } from "@/components/dashboard/usage-business";

const DAY_FMT = new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short" });

type Point = { day: string; value: number };
type Datum = { label: string; dayIso: string; value: number };

function makeTooltip(format: ValueFormat) {
  return function SeriesTooltip({
    active,
    payload,
  }: TooltipContentProps<TooltipValueType, string | number>) {
    const point = payload?.[0]?.payload as Datum | undefined;
    if (!active || !point) return null;
    return (
      <div className="border-border bg-surface rounded-xl border px-3 py-2 text-[13px] shadow-lg">
        <p className="text-text-muted font-bold">{point.label}</p>
        <p className="font-extrabold">{format(point.value)}</p>
      </div>
    );
  };
}

/**
 * Generic day-resolution time-series for a `{ day, value }` series (new users, revenue, …). Renders
 * as bars or a line per the page-level chart kind. Clicking a day selects it through `onSelectRange`,
 * driving the global filter. Self-documents via the metric's InfoPopover.
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
    label: DAY_FMT.format(new Date(`${p.day}T00:00:00`)),
    dayIso: p.day,
    value: p.value,
  }));
  const summary = data.map((d) => `${d.label}: ${format(d.value)}`).join(". ");

  const selectDay = (d: Datum) => {
    if (!onSelectRange) return;
    const { from, to } = dayRangeSeconds(d.dayIso);
    onSelectRange(from, to);
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
                content={makeTooltip(format)}
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
                  onClick={(d) => selectDay(d as unknown as Datum)}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}
