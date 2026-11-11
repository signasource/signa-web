"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  type TooltipContentProps,
  type TooltipValueType,
} from "recharts";
import { InfoPopover } from "@/components/dashboard/info-popover";
import { Card, CardTitle } from "@/components/dashboard/ui";
import type { RangeSelect } from "@/components/dashboard/perf-chart";
import { REFRESH_MS } from "@/components/dashboard/perf-panel";
import { metricsApi, type CountItem } from "@/lib/api/metrics";
import type { DateTimeRange } from "@/lib/datetime-range";

export const NUMBER = new Intl.NumberFormat("es-AR");

export const VERSION_STATUS: Record<string, string> = {
  DRAFT: "Borrador",
  PUBLISHED: "Publicada",
  ARCHIVED: "Archivada",
};
export const ENROLLMENT_STATUS: Record<string, string> = {
  ENROLLED: "En curso",
  IN_PROGRESS: "En progreso",
  COMPLETED: "Completado",
  DROPPED: "Abandonado",
};
export const REPORT_STATUS: Record<string, string> = {
  PENDING: "Pendientes",
  REVIEWED: "Revisados",
  RESOLVED: "Resueltos",
  REJECTED: "Rechazados",
};

const DAY_FMT = new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short" });

export function countOf(items: CountItem[], key: string): number {
  return items.find((i) => i.key === key)?.count ?? 0;
}

/** The [start, end] unix-seconds bounds of a local calendar day (`YYYY-MM-DD`), end inclusive. */
export function dayRangeSeconds(dayIso: string): { from: number; to: number } {
  const from = Math.floor(new Date(`${dayIso}T00:00:00`).getTime() / 1000);
  return { from, to: from + 24 * 3600 - 1 };
}

/** Shared business-metrics query; both the Negocio and Aprendizaje tabs read from this cache. */
export function useBusinessMetrics(range: DateTimeRange, live: boolean) {
  return useQuery({
    queryKey: ["admin", "metrics", "business", range.from, range.to],
    queryFn: () => metricsApi.business({ from: range.from, to: range.to }),
    enabled: Boolean(range.from && range.to),
    placeholderData: keepPreviousData,
    refetchInterval: live ? REFRESH_MS : false,
  });
}

function ActivityTooltip({
  active,
  payload,
}: TooltipContentProps<TooltipValueType, string | number>) {
  const point = payload?.[0]?.payload as
    { label: string; attempts: number; lessons: number } | undefined;
  if (!active || !point) return null;
  return (
    <div className="border-border bg-surface rounded-xl border px-3 py-2 text-[13px] shadow-lg">
      <p className="text-text-muted font-bold">{point.label}</p>
      <p className="font-extrabold">{NUMBER.format(point.attempts)} ejercicios</p>
      <p className="text-text-muted">{NUMBER.format(point.lessons)} lecciones</p>
    </div>
  );
}

type ActivityBar = { label: string; dayIso: string; attempts: number; lessons: number };

/**
 * Daily exercises bar chart. Clicking a bar selects that whole day via `onSelectRange`, so it drives
 * the global from/to filter just like dragging a line chart does.
 */
export function DailyActivityChart({
  activity,
  onSelectRange,
}: {
  activity: { day: string; attempts: number; correct: number; lessonsCompleted: number }[];
  onSelectRange?: RangeSelect;
}) {
  const bars: ActivityBar[] = activity.map((a) => ({
    label: DAY_FMT.format(new Date(`${a.day}T00:00:00`)),
    dayIso: a.day,
    attempts: a.attempts,
    lessons: a.lessonsCompleted,
  }));
  const summary = bars.map((b) => `${b.label}: ${b.attempts}`).join(". ");

  const selectDay = (bar: ActivityBar) => {
    if (!onSelectRange) return;
    const { from, to } = dayRangeSeconds(bar.dayIso);
    onSelectRange(from, to);
  };

  return (
    <Card className="flex min-w-0 flex-col gap-3 lg:col-span-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <CardTitle>Actividad diaria</CardTitle>
          <p className="text-text-muted mt-0.5 text-[13px]">
            Ejercicios por día (resolución diaria)
            {onSelectRange ? " · clic en un día para filtrar" : ""}
          </p>
        </div>
        <InfoPopover metric="daily_activity" className="mt-0.5" />
      </div>
      {bars.length === 0 ? (
        <p className="text-text-muted py-8 text-center text-sm">Sin actividad en este período.</p>
      ) : (
        <div role="img" aria-label={summary} className="h-[210px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={bars} margin={{ top: 16, right: 4, left: 4, bottom: 0 }}>
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
                minTickGap={16}
                tick={{ fill: "var(--color-text-muted)", fontSize: 12 }}
              />
              <Tooltip
                content={ActivityTooltip}
                cursor={{ fill: "var(--color-fill)", radius: 8 }}
                isAnimationActive={false}
              />
              <Bar
                dataKey="attempts"
                fill="var(--color-primary)"
                radius={[8, 8, 4, 4]}
                maxBarSize={40}
                className={onSelectRange ? "cursor-pointer" : undefined}
                onClick={(data) => selectDay(data as unknown as ActivityBar)}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}

export function Breakdown({
  items,
  labels,
}: {
  items: CountItem[];
  labels: Record<string, string>;
}) {
  if (items.length === 0) return <p className="text-text-muted text-sm">Sin datos.</p>;
  return (
    <dl className="flex flex-col">
      {items.map((item) => (
        <div
          key={item.key}
          className="border-fill flex justify-between gap-3 border-b py-2 text-sm last:border-b-0"
        >
          <dt className="text-text-muted">{labels[item.key] ?? item.key}</dt>
          <dd className="font-extrabold">{NUMBER.format(item.count)}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Row({ label, value, danger }: { label: string; value: number; danger?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-text-muted">{label}</dt>
      <dd className={value > 0 && danger ? "text-danger font-extrabold" : "font-extrabold"}>
        {NUMBER.format(value)}
      </dd>
    </div>
  );
}
