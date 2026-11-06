"use client";

import { useState } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
  type TooltipValueType,
} from "recharts";
import { useChartKind } from "@/components/dashboard/chart-kind";
import { InfoPopover } from "@/components/dashboard/info-popover";
import type { MetricId } from "@/components/dashboard/metric-catalog";
import { Card, CardTitle, ErrorState, LoadingState } from "@/components/dashboard/ui";
import type { PerfMetrics, PerfSeries } from "@/lib/api/metrics";
import { cn } from "@/lib/utils";

/** A time range picked by dragging across a chart (instant seconds). */
export type RangeSelect = (fromSeconds: number, toSeconds: number) => void;

/** Palette for overlaid series; tokens only, never Recharts defaults. */
const COLORS = [
  "var(--color-primary)",
  "var(--color-accent-teal)",
  "var(--color-streak-orange)",
  "var(--color-accent-violet)",
  "var(--color-success)",
  "var(--color-danger)",
];

const TIME_FMT = new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit" });
const DATE_TIME_FMT = new Intl.DateTimeFormat("es-AR", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export type ValueFormat = (value: number) => string;

const HIDDEN_LABELS = ["le", "__name__", "job", "instance"];

/** A label for a series, derived from its Prometheus labels (falls back to the widget name). */
function seriesName(series: PerfSeries, fallback: string): string {
  const { uri, name, result, status } = series.labels;
  const extra = Object.entries(series.labels).find(([k]) => !HIDDEN_LABELS.includes(k));
  return uri ?? name ?? result ?? status ?? extra?.[1] ?? fallback;
}

type Row = { t: number } & Record<string, number | null>;

/** Merges the series' points into Recharts rows keyed by timestamp. */
function toRows(series: PerfSeries[]): { rows: Row[]; keys: string[] } {
  const byT = new Map<number, Row>();
  const keys: string[] = [];
  series.forEach((s, i) => {
    const key = `s${i}`;
    keys.push(key);
    for (const p of s.points) {
      const row = byT.get(p.t) ?? ({ t: p.t } as Row);
      row[key] = p.v;
      byT.set(p.t, row);
    }
  });
  return { rows: [...byT.values()].sort((a, b) => a.t - b.t), keys };
}

export function PerfChart({
  title,
  subtitle,
  metric,
  data,
  isPending,
  isError,
  isFetching = false,
  format = (v) => v.toLocaleString("es-AR"),
  delay,
  onSelectRange,
}: {
  title: string;
  subtitle?: string;
  /** Catalog id; when set, the header shows the "what is this" popover. */
  metric?: MetricId;
  data: PerfMetrics | undefined;
  isPending: boolean;
  isError: boolean;
  isFetching?: boolean;
  format?: ValueFormat;
  delay?: number;
  /** When set, dragging across the chart selects a time window (drives the global filter). */
  onSelectRange?: RangeSelect;
}) {
  const series = data?.series ?? [];
  const { rows, keys } = toRows(series);
  const names = series.map((s, i) => seriesName(s, `${title} ${i + 1}`));
  const multiDay = rows.length > 1 && rows[rows.length - 1]!.t - rows[0]!.t > 36 * 3600;
  const timeFmt = multiDay ? DATE_TIME_FMT : TIME_FMT;

  const kind = useChartKind();

  // Drag-to-select: track the two edges (unix seconds from the x axis) while the mouse is down.
  const [selStart, setSelStart] = useState<number | null>(null);
  const [selEnd, setSelEnd] = useState<number | null>(null);

  type ChartMouse = { activeLabel?: string | number } | null;
  const labelAt = (e: ChartMouse): number | null => {
    const v = e?.activeLabel;
    return v == null ? null : Number(v);
  };
  const beginSelect = (e: ChartMouse) => {
    if (!onSelectRange) return;
    const t = labelAt(e);
    if (t == null) return;
    setSelStart(t);
    setSelEnd(t);
  };
  const extendSelect = (e: ChartMouse) => {
    if (!onSelectRange || selStart == null) return;
    const t = labelAt(e);
    if (t != null) setSelEnd(t);
  };
  const commitSelect = () => {
    if (onSelectRange && selStart != null && selEnd != null && selStart !== selEnd) {
      const from = Math.min(selStart, selEnd);
      const to = Math.max(selStart, selEnd);
      onSelectRange(from, to);
    }
    setSelStart(null);
    setSelEnd(null);
  };

  const summary = series
    .map((s, i) => {
      const last = [...s.points].reverse().find((p) => p.v != null);
      return `${names[i]}: ${last?.v != null ? format(last.v) : "—"}`;
    })
    .join(". ");

  function ChartTooltip({
    active,
    payload,
    label,
  }: TooltipContentProps<TooltipValueType, string | number>) {
    if (!active || !payload?.length) return null;
    return (
      <div className="border-border bg-surface rounded-xl border px-3 py-2 text-[13px] shadow-lg">
        <p className="text-text-muted font-bold">
          {timeFmt.format(new Date(Number(label) * 1000))}
        </p>
        {payload.map((entry, i) => (
          <p
            key={entry.dataKey as string}
            className="font-extrabold"
            style={{ color: entry.color }}
          >
            {names[keys.indexOf(entry.dataKey as string)] ?? names[i]}:{" "}
            {typeof entry.value === "number" ? format(entry.value) : "—"}
          </p>
        ))}
      </div>
    );
  }

  return (
    <Card delay={delay} className="flex min-w-0 flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <CardTitle>{title}</CardTitle>
          {subtitle ? <p className="text-text-muted mt-0.5 text-[13px]">{subtitle}</p> : null}
        </div>
        {metric ? <InfoPopover metric={metric} className="mt-0.5" /> : null}
      </div>

      {isPending ? <LoadingState>Cargando métricas…</LoadingState> : null}
      {isError && !data ? <ErrorState>No pudimos cargar la métrica.</ErrorState> : null}
      {data && !data.available ? (
        <p className="text-text-muted py-8 text-center text-sm">
          Sin datos: falta configurar el acceso de lectura a Grafana Cloud.
        </p>
      ) : null}
      {data && data.available && rows.length === 0 ? (
        <p className="text-text-muted py-8 text-center text-sm">Sin datos en este período.</p>
      ) : null}

      {data && data.available && rows.length > 0 ? (
        <div
          role="img"
          aria-label={summary}
          aria-busy={isFetching}
          className={cn(
            "h-[220px] transition-opacity",
            isFetching && "opacity-60",
            onSelectRange && "cursor-crosshair select-none",
          )}
        >
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={rows}
              margin={{ top: 8, right: 8, left: 4, bottom: 0 }}
              onMouseDown={onSelectRange ? beginSelect : undefined}
              onMouseMove={onSelectRange ? extendSelect : undefined}
              onMouseUp={onSelectRange ? commitSelect : undefined}
              onMouseLeave={onSelectRange ? commitSelect : undefined}
            >
              <CartesianGrid stroke="var(--color-fill)" vertical={false} />
              <XAxis
                dataKey="t"
                type="number"
                domain={["dataMin", "dataMax"]}
                scale="time"
                axisLine={false}
                tickLine={false}
                minTickGap={40}
                tickFormatter={(t) => timeFmt.format(new Date(Number(t) * 1000))}
                tick={{ fill: "var(--color-text-muted)", fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                width={44}
                tickFormatter={(v) => format(Number(v))}
                tick={{ fill: "var(--color-text-muted)", fontSize: 12 }}
              />
              <Tooltip content={ChartTooltip} isAnimationActive={false} />
              {keys.map((key, i) =>
                kind === "bar" ? (
                  <Bar
                    key={key}
                    dataKey={key}
                    fill={COLORS[i % COLORS.length]}
                    isAnimationActive={false}
                  />
                ) : (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={COLORS[i % COLORS.length]}
                    strokeWidth={2}
                    dot={false}
                    connectNulls
                    isAnimationActive={false}
                  />
                ),
              )}
              {selStart != null && selEnd != null && selStart !== selEnd ? (
                <ReferenceArea
                  x1={selStart}
                  x2={selEnd}
                  strokeOpacity={0}
                  fill="var(--color-primary)"
                  fillOpacity={0.12}
                />
              ) : null}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      ) : null}
    </Card>
  );
}
