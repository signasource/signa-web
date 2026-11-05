"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
  type TooltipValueType,
} from "recharts";
import { Card, CardTitle, ErrorState, LoadingState } from "@/components/dashboard/ui";
import type { PerfMetrics, PerfSeries } from "@/lib/api/metrics";
import { cn } from "@/lib/utils";

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
  data,
  isPending,
  isError,
  isFetching = false,
  format = (v) => v.toLocaleString("es-AR"),
  delay,
}: {
  title: string;
  subtitle?: string;
  data: PerfMetrics | undefined;
  isPending: boolean;
  isError: boolean;
  isFetching?: boolean;
  format?: ValueFormat;
  delay?: number;
}) {
  const series = data?.series ?? [];
  const { rows, keys } = toRows(series);
  const names = series.map((s, i) => seriesName(s, `${title} ${i + 1}`));
  const multiDay = rows.length > 1 && rows[rows.length - 1]!.t - rows[0]!.t > 36 * 3600;
  const timeFmt = multiDay ? DATE_TIME_FMT : TIME_FMT;

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
      <div>
        <CardTitle>{title}</CardTitle>
        {subtitle ? <p className="text-text-muted mt-0.5 text-[13px]">{subtitle}</p> : null}
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
          className={cn("h-[220px] transition-opacity", isFetching && "opacity-60")}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rows} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
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
              {keys.map((key, i) => (
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
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : null}
    </Card>
  );
}
