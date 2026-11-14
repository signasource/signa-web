"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
  type TooltipValueType,
} from "recharts";
import { InfoPopover } from "@/components/dashboard/info-popover";
import type { MetricId } from "@/components/dashboard/metric-catalog";
import type { RangeSelect, ValueFormat } from "@/components/dashboard/perf-chart";
import { Card, CardTitle } from "@/components/dashboard/ui";
import type { DateTimeRange } from "@/lib/datetime-range";

const DAY_SECONDS = 86400;
const DAY_FMT = new Intl.DateTimeFormat("es-AR", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});
const TIME_FMT = new Intl.DateTimeFormat("es-AR", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
});

function bucketSecondsFor(fromMs: number, toMs: number): number {
  const span = Math.max(0, (toMs - fromMs) / 1000);
  if (span <= 6 * 3600) return 60;
  if (span <= 3 * DAY_SECONDS) return 3600;
  return DAY_SECONDS;
}

export type RevenueSource = {
  key: string;
  label: string;
  color: string;
  points: { t: string; amount: number }[];
};

type Datum = { epoch: number; label: string } & Record<string, number | string>;

function makeTooltip(sources: RevenueSource[], format: ValueFormat, fullTime: boolean) {
  return function StackTooltip({
    active,
    payload,
  }: TooltipContentProps<TooltipValueType, string | number>) {
    const point = payload?.[0]?.payload as Datum | undefined;
    if (!active || !point) return null;
    const total = sources.reduce((s, src) => s + (Number(point[src.key]) || 0), 0);
    return (
      <div className="border-border bg-surface rounded-xl border px-3 py-2 text-[13px] shadow-lg">
        <p className="text-text-muted font-bold">
          {(fullTime ? TIME_FMT : DAY_FMT).format(new Date(point.epoch))}
        </p>
        {sources.map((src) => (
          <p key={src.key} className="flex items-center gap-1.5">
            <span className="size-2 rounded-[3px]" style={{ background: src.color }} />
            {src.label}:{" "}
            <span className="font-extrabold">{format(Number(point[src.key]) || 0)}</span>
          </p>
        ))}
        <p className="border-fill mt-1 border-t pt-1 font-extrabold">Total: {format(total)}</p>
      </div>
    );
  };
}

/**
 * Stacked daily revenue split by source (organizaciones, gemas, cursos). Merges the per-source
 * `{t, amount}` series by bucket; clicking a bar selects that bucket's window. Consistent with the
 * app's other Recharts charts rather than the prototype's hand-drawn SVG.
 */
export function RevenueBySourceChart({
  title,
  subtitle,
  metric,
  sources,
  range,
  format,
  onSelectRange,
  className,
}: {
  title: string;
  subtitle?: string;
  metric: MetricId;
  sources: RevenueSource[];
  range: DateTimeRange;
  format: ValueFormat;
  onSelectRange?: RangeSelect;
  className?: string;
}) {
  const fromMs = new Date(range.from).getTime();
  const toMs = new Date(range.to).getTime();
  const haveRange = Number.isFinite(fromMs) && Number.isFinite(toMs) && toMs > fromMs;
  const bucketSeconds = haveRange ? bucketSecondsFor(fromMs, toMs) : DAY_SECONDS;
  const subDay = bucketSeconds < DAY_SECONDS;
  const tickFmt = subDay ? TIME_FMT : DAY_FMT;
  const bucketMs = bucketSeconds * 1000;

  const byEpoch = new Map<number, Datum>();
  for (const src of sources) {
    for (const p of src.points) {
      const raw = new Date(p.t).getTime();
      if (!Number.isFinite(raw)) continue;
      const epoch = Math.floor(raw / bucketMs) * bucketMs;
      const row =
        byEpoch.get(epoch) ?? ({ epoch, label: tickFmt.format(new Date(epoch)) } as Datum);
      row[src.key] = (Number(row[src.key]) || 0) + p.amount;
      byEpoch.set(epoch, row);
    }
  }
  // Lay out every bucket of the window (days without income read as an empty slot, not a gap).
  const bucketCount = haveRange ? Math.ceil((toMs - fromMs) / bucketMs) : 0;
  if (haveRange && bucketCount > 0 && bucketCount <= 400) {
    const start = Math.floor(fromMs / bucketMs) * bucketMs;
    for (let epoch = start; epoch < toMs; epoch += bucketMs) {
      if (!byEpoch.has(epoch))
        byEpoch.set(epoch, { epoch, label: tickFmt.format(new Date(epoch)) } as Datum);
    }
  }
  const data = [...byEpoch.values()].sort((a, b) => a.epoch - b.epoch);

  const totals = sources.map((src) => ({
    ...src,
    total: data.reduce((s, d) => s + (Number(d[src.key]) || 0), 0),
  }));
  const grandTotal = totals.reduce((s, t) => s + t.total, 0);

  const selectBucket = (d: Datum) => {
    if (!onSelectRange) return;
    const from = Math.floor(d.epoch / 1000);
    onSelectRange(from, from + bucketSeconds - 1);
  };

  return (
    <Card className={className ?? "flex min-w-0 flex-col gap-3"}>
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <CardTitle>{title}</CardTitle>
          {subtitle ? <p className="text-text-muted mt-0.5 text-[13px]">{subtitle}</p> : null}
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          {totals.map((t) => (
            <span key={t.key} className="inline-flex items-center gap-1.5 text-[13px]">
              <span className="size-2.5 rounded-[3px]" style={{ background: t.color }} />
              <span className="text-text-muted">{t.label}</span>
              <span className="font-extrabold">{format(t.total)}</span>
              <span className="text-text-muted">
                {grandTotal > 0 ? `${Math.round((t.total / grandTotal) * 100)}%` : "0%"}
              </span>
            </span>
          ))}
          <InfoPopover metric={metric} />
        </div>
      </div>
      {grandTotal === 0 ? (
        <p className="text-text-muted py-8 text-center text-sm">Sin ingresos en este período.</p>
      ) : (
        <div
          role="img"
          aria-label={totals.map((t) => `${t.label}: ${format(t.total)}`).join(". ")}
          className="h-[230px]"
        >
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
                tickFormatter={(v) => format(Number(v))}
                tick={{ fill: "var(--color-text-muted)", fontSize: 11 }}
              />
              <Tooltip
                content={makeTooltip(sources, format, subDay)}
                cursor={{ fill: "var(--color-fill)", radius: 8 }}
                isAnimationActive={false}
              />
              {sources.map((src, i) => (
                <Bar
                  key={src.key}
                  dataKey={src.key}
                  stackId="rev"
                  fill={src.color}
                  radius={i === sources.length - 1 ? [6, 6, 0, 0] : [0, 0, 0, 0]}
                  maxBarSize={44}
                  className={onSelectRange ? "cursor-pointer" : undefined}
                  onClick={(d) => selectBucket(d as unknown as Datum)}
                />
              ))}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}
