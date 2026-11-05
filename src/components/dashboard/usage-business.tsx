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
import {
  Card,
  CardTitle,
  ErrorState,
  LoadingState,
  ProgressBar,
  StatCard,
} from "@/components/dashboard/ui";
import { metricsApi, type CountItem } from "@/lib/api/metrics";
import type { DateTimeRange } from "@/lib/datetime-range";

const NUMBER = new Intl.NumberFormat("es-AR");
const REFRESH_MS = 30_000;

const VERSION_STATUS: Record<string, string> = {
  DRAFT: "Borrador",
  PUBLISHED: "Publicada",
  ARCHIVED: "Archivada",
};
const ENROLLMENT_STATUS: Record<string, string> = {
  ENROLLED: "En curso",
  COMPLETED: "Completado",
  DROPPED: "Abandonado",
};
const REPORT_STATUS: Record<string, string> = {
  PENDING: "Pendientes",
  REVIEWED: "Revisados",
  RESOLVED: "Resueltos",
  REJECTED: "Rechazados",
};
const DAY_FMT = new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short" });

function count(items: CountItem[], key: string): number {
  return items.find((i) => i.key === key)?.count ?? 0;
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

export function BusinessSection({ range, live }: { range: DateTimeRange; live: boolean }) {
  const query = useQuery({
    queryKey: ["admin", "metrics", "business", range.from, range.to],
    queryFn: () => metricsApi.business({ from: range.from, to: range.to }),
    enabled: Boolean(range.from && range.to),
    placeholderData: keepPreviousData,
    refetchInterval: live ? REFRESH_MS : false,
  });

  if (query.isPending) return <LoadingState>Cargando métricas de negocio…</LoadingState>;
  if (query.isError && !query.data)
    return <ErrorState>No pudimos cargar las métricas de negocio.</ErrorState>;

  const d = query.data!;
  const bars = d.activity.map((a) => ({
    label: DAY_FMT.format(new Date(`${a.day}T00:00:00`)),
    attempts: a.attempts,
    lessons: a.lessonsCompleted,
  }));
  const summary = bars.map((b) => `${b.label}: ${b.attempts}`).join(". ");

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard
          label="Usuarios"
          value={NUMBER.format(d.users.total)}
          hint={`${NUMBER.format(d.users.active)} activos`}
        />
        <StatCard label="Cursos" value={NUMBER.format(d.courses.total)} />
        <StatCard
          label="Versiones publicadas"
          value={NUMBER.format(count(d.courses.versionsByStatus, "PUBLISHED"))}
        />
        <StatCard
          label="Inscripciones en curso"
          value={NUMBER.format(count(d.enrollments, "ENROLLED"))}
        />
        <StatCard
          label="Lecciones completadas"
          value={NUMBER.format(d.progress.lessonsCompleted)}
          hint={`${NUMBER.format(d.progress.topicsCompleted)} temas`}
        />
        <StatCard
          label="Precisión global"
          value={d.accuracy.evaluated ? `${d.accuracy.accuracyPercent}%` : "—"}
          hint={`${NUMBER.format(d.accuracy.evaluated)} ejercicios`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="flex min-w-0 flex-col gap-3 lg:col-span-2">
          <div>
            <CardTitle>Actividad diaria</CardTitle>
            <p className="text-text-muted mt-0.5 text-[13px]">
              Ejercicios por día (resolución diaria)
            </p>
          </div>
          {bars.length === 0 ? (
            <p className="text-text-muted py-8 text-center text-sm">
              Sin actividad en este período.
            </p>
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
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card className="flex min-w-0 flex-col gap-3">
          <CardTitle>Errores</CardTitle>
          <dl className="flex flex-col gap-2 text-sm">
            <Row label="Reportes de señas pendientes" value={d.errors.pendingSignReports} danger />
            <Row label="Imports de contenido fallidos" value={d.errors.failedImports} danger />
          </dl>
          <div className="border-fill mt-1 border-t pt-3">
            <p className="text-text-muted mb-1.5 text-xs font-extrabold tracking-wider uppercase">
              Reportes por estado
            </p>
            <Breakdown items={d.errors.signReportsByStatus} labels={REPORT_STATUS} />
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="flex min-w-0 flex-col gap-3">
          <CardTitle>Inscripciones</CardTitle>
          <Breakdown items={d.enrollments} labels={ENROLLMENT_STATUS} />
        </Card>
        <Card className="flex min-w-0 flex-col gap-3">
          <CardTitle>Versiones de curso</CardTitle>
          <Breakdown items={d.courses.versionsByStatus} labels={VERSION_STATUS} />
        </Card>
        <Card className="flex min-w-0 flex-col gap-3">
          <CardTitle>Precisión por tipo de ejercicio</CardTitle>
          {d.accuracy.byBlockType.length === 0 ? (
            <p className="text-text-muted text-sm">Sin ejercicios evaluados.</p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {d.accuracy.byBlockType.map((b) => (
                <li key={b.type} className="flex flex-col gap-1">
                  <div className="flex justify-between text-[13px] font-bold">
                    <span className="truncate">{b.type}</span>
                    <span>{b.accuracyPercent}%</span>
                  </div>
                  <ProgressBar percent={b.accuracyPercent} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

function Breakdown({ items, labels }: { items: CountItem[]; labels: Record<string, string> }) {
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

function Row({ label, value, danger }: { label: string; value: number; danger?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-text-muted">{label}</dt>
      <dd className={value > 0 && danger ? "text-danger font-extrabold" : "font-extrabold"}>
        {NUMBER.format(value)}
      </dd>
    </div>
  );
}
