"use client";

import { useState } from "react";
import {
  Bar,
  BarChart,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  type TooltipContentProps,
  type TooltipValueType,
} from "recharts";
import { Card, CardTitle, ErrorState, LoadingState, pillButton } from "@/components/dashboard/ui";
import type { OrganizationActivity } from "@/lib/api/types";
import {
  activityGranularity,
  ALL_TIME_LABEL,
  bucketActivity,
  formatRange,
  hasActivity,
  type ActivityBucket,
  type ActivityGranularity,
  type Period,
} from "@/lib/date-range";
import { cn } from "@/lib/utils";

type Metric = "attempts" | "correct" | "lessons";

const NUMBER = new Intl.NumberFormat("es-AR");
/** Above this many bars the values move from the bars to the tooltip. */
const MAX_LABELED_BARS = 14;

const METRICS: {
  key: Metric;
  label: string;
  column: string;
  value: (b: ActivityBucket) => number;
  text: (b: ActivityBucket) => string;
}[] = [
  {
    key: "attempts",
    label: "Ejercicios",
    column: "EJERCICIOS",
    value: (b) => b.exerciseAttempts,
    text: (b) => NUMBER.format(b.exerciseAttempts),
  },
  {
    key: "correct",
    label: "Correctas",
    column: "CORRECTAS",
    value: (b) => b.correctPercentage,
    text: (b) => (b.exerciseAttempts ? `${b.correctPercentage}%` : "—"),
  },
  {
    key: "lessons",
    label: "Lecciones",
    column: "LECCIONES",
    value: (b) => b.lessonsCompleted,
    text: (b) => NUMBER.format(b.lessonsCompleted),
  },
];

const CAPTIONS: Record<Metric, string> = {
  attempts: "Ejercicios realizados",
  correct: "Porcentaje de respuestas correctas",
  lessons: "Lecciones completadas",
};

const PER: Record<ActivityGranularity, { caption: string; column: string }> = {
  day: { caption: "por día", column: "DÍA" },
  week: { caption: "por semana", column: "SEMANA" },
  month: { caption: "por mes", column: "MES" },
};

type Point = { label: string; longLabel: string; value: number; text: string };

function ChartTooltip({ active, payload }: TooltipContentProps<TooltipValueType, string | number>) {
  const point = payload?.[0]?.payload as Point | undefined;
  if (!active || !point) return null;
  return (
    <div className="border-border bg-surface rounded-xl border px-3 py-2 text-[13px] shadow-lg">
      <p className="text-text-muted font-bold">{point.longLabel}</p>
      <p className="font-extrabold">{point.text}</p>
    </div>
  );
}

/**
 * Team activity in the dashboard's period: totals for the whole period, then a bar chart by day,
 * week or month (see {@link activityGranularity}) with a table alternative. The dates shown come
 * from the response, so the whole history reads as the days it actually covers.
 */
export function PeriodActivity({
  period,
  data,
  isPending,
  isError,
  isFetching = false,
  delay,
}: {
  period: Period;
  data: OrganizationActivity | undefined;
  isPending: boolean;
  isError: boolean;
  isFetching?: boolean;
  delay?: number;
}) {
  const [metric, setMetric] = useState<Metric>("attempts");
  const [asTable, setAsTable] = useState(false);
  const current = METRICS.find((m) => m.key === metric)!;

  const buckets = data ? bucketActivity(data.days) : [];
  const per = PER[activityGranularity(data?.days.length ?? 0)];
  const dates = data ? formatRange(data) : period ? formatRange(period) : "";
  const points: Point[] = buckets.map((b) => ({
    label: b.label,
    longLabel: b.longLabel,
    value: current.value(b),
    text: current.text(b),
  }));
  const summary = points.map((p) => `${p.longLabel}: ${p.text}`).join(". ");

  return (
    <Card delay={delay} className="flex min-w-0 flex-col gap-4">
      <div>
        <CardTitle>Actividad del período</CardTitle>
        <p className="text-text-muted mt-0.5 text-[13px]">
          {period ? dates : `${ALL_TIME_LABEL}${dates ? ` · ${dates}` : ""}`}
        </p>
      </div>

      {isPending ? <LoadingState>Cargando actividad…</LoadingState> : null}
      {isError && !data ? <ErrorState>No pudimos cargar la actividad.</ErrorState> : null}

      {data ? (
        <div
          aria-busy={isFetching}
          className={cn("flex flex-col gap-4 transition-opacity", isFetching && "opacity-60")}
        >
          <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { label: "Personas activas", value: NUMBER.format(data.totals.activeParticipants) },
              { label: "Ejercicios", value: NUMBER.format(data.totals.exerciseAttempts) },
              {
                label: "Respuestas correctas",
                value: data.totals.exerciseAttempts ? `${data.totals.correctPercentage}%` : "—",
              },
              {
                label: "Lecciones completadas",
                value: NUMBER.format(data.totals.lessonsCompleted),
              },
            ].map((t) => (
              <div key={t.label} className="bg-fill flex flex-col gap-0.5 rounded-xl px-3.5 py-2.5">
                <dt className="text-text-muted text-xs font-bold">{t.label}</dt>
                <dd className="font-display text-xl font-extrabold tracking-tight">{t.value}</dd>
              </div>
            ))}
          </dl>

          {!hasActivity(data.totals) ? (
            <p className="text-text-muted py-6 text-center text-sm">
              No hubo actividad en este período. Probá con un rango más amplio.
            </p>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-text-muted text-[13px]">{`${CAPTIONS[metric]} ${per.caption}`}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <div
                    role="group"
                    aria-label="Métrica"
                    className="bg-fill flex rounded-full p-[3px]"
                  >
                    {METRICS.map((m) => (
                      <button
                        key={m.key}
                        type="button"
                        aria-pressed={metric === m.key}
                        onClick={() => setMetric(m.key)}
                        className={cn(
                          "cursor-pointer rounded-full px-3 py-1.5 text-[13px] font-bold whitespace-nowrap transition-all duration-200",
                          metric === m.key
                            ? "bg-surface text-text shadow-sm"
                            : "text-text-muted hover:text-text",
                        )}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setAsTable((v) => !v)}
                    className={cn(pillButton, "px-3 py-1.5")}
                  >
                    {asTable ? "Ver gráfico" : "Ver tabla"}
                  </button>
                </div>
              </div>

              {asTable ? (
                <div className="max-h-[320px] overflow-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead className="bg-surface sticky top-0">
                      <tr className="text-text-muted text-xs font-extrabold tracking-wider">
                        <th scope="col" className="border-border border-b py-2 text-left">
                          {per.column}
                        </th>
                        {METRICS.map((m) => (
                          <th
                            key={m.key}
                            scope="col"
                            className="border-border border-b py-2 pl-3 text-right"
                          >
                            {m.column}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {buckets.map((b) => (
                        <tr key={b.start}>
                          <td className="border-fill border-b py-2">{b.longLabel}</td>
                          {METRICS.map((m) => (
                            <td
                              key={m.key}
                              className="border-fill border-b py-2 pl-3 text-right font-bold"
                            >
                              {m.text(b)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div role="img" aria-label={summary} className="h-[210px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={points} margin={{ top: 20, right: 4, left: 4, bottom: 0 }}>
                      <XAxis
                        dataKey="label"
                        axisLine={false}
                        tickLine={false}
                        interval="preserveStartEnd"
                        minTickGap={16}
                        tick={{ fill: "var(--color-text-muted)", fontSize: 12 }}
                      />
                      <Tooltip
                        content={ChartTooltip}
                        cursor={{ fill: "var(--color-fill)", radius: 8 }}
                        isAnimationActive={false}
                      />
                      <Bar
                        dataKey="value"
                        fill="var(--color-primary)"
                        radius={[8, 8, 4, 4]}
                        maxBarSize={44}
                        isAnimationActive
                        animationDuration={700}
                        animationEasing="ease-out"
                      >
                        {points.length <= MAX_LABELED_BARS ? (
                          <LabelList
                            dataKey="text"
                            position="top"
                            fill="var(--color-text)"
                            fontSize={12}
                            fontWeight={800}
                          />
                        ) : null}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </>
          )}
        </div>
      ) : null}
    </Card>
  );
}
