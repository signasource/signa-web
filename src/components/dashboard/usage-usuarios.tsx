"use client";

import { DailySeriesChart } from "@/components/dashboard/daily-series-chart";
import { fmtShortDate } from "@/components/dashboard/format";
import { InfoPopover } from "@/components/dashboard/info-popover";
import { KpiCard } from "@/components/dashboard/kpi-card";
import type { RangeSelect } from "@/components/dashboard/perf-chart";
import { fmtCount } from "@/components/dashboard/perf-format";
import { Card, CardTitle } from "@/components/dashboard/ui";
import { GamificationSection } from "@/components/dashboard/usage-gamification";
import { NUMBER } from "@/components/dashboard/usage-business";
import { useGrowthMetrics } from "@/components/dashboard/usage-growth";
import type { CohortRetention } from "@/lib/api/metrics";
import { cn } from "@/lib/utils";
import type { DateTimeRange } from "@/lib/datetime-range";

/** Tints a retention cell by how well it held: ≥40% success, ≥20% warning, else danger. */
function retentionCellClass(pct: number | null): string {
  if (pct == null) return "text-text-muted";
  if (pct >= 40) return "text-success-dark font-extrabold";
  if (pct >= 20) return "text-warning-dark font-bold";
  return "text-danger font-bold";
}

/**
 * Weekly registration cohorts and the share active again at D1/D7/D30. Cells read "—" while a
 * horizon is still unobservable for that week (the API returns null), so an incomplete week never
 * looks like 0% retention.
 */
function CohortRetentionTable({ rows }: { rows: CohortRetention[] }) {
  return (
    <Card className="flex min-w-0 flex-col gap-3">
      <div className="flex items-center gap-1.5">
        <CardTitle>Retención por cohorte</CardTitle>
        <InfoPopover metric="cohort_retention" className="ml-auto" />
      </div>
      <p className="text-text-muted -mt-1.5 text-[13px]">
        Por semana de registro: qué parte volvió 1, 7 y 30 días después.
      </p>
      {rows.length === 0 ? (
        <p className="text-text-muted text-sm">Sin cohortes en el período.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="text-text-muted text-left text-xs font-bold">
                <th className="pb-2 font-bold">Semana</th>
                <th className="pb-2 pl-3 text-right font-bold">Registrados</th>
                <th className="pb-2 pl-3 text-right font-bold">D1</th>
                <th className="pb-2 pl-3 text-right font-bold">D7</th>
                <th className="pb-2 pl-3 text-right font-bold">D30</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.weekStart} className="border-fill border-t">
                  <td className="py-2 font-bold">{fmtShortDate(c.weekStart)}</td>
                  <td className="py-2 pl-3 text-right">{NUMBER.format(c.cohortSize)}</td>
                  <td className={cn("py-2 pl-3 text-right", retentionCellClass(c.d1Percent))}>
                    {c.d1Percent == null ? "—" : `${c.d1Percent}%`}
                  </td>
                  <td className={cn("py-2 pl-3 text-right", retentionCellClass(c.d7Percent))}>
                    {c.d7Percent == null ? "—" : `${c.d7Percent}%`}
                  </td>
                  <td className={cn("py-2 pl-3 text-right", retentionCellClass(c.d30Percent))}>
                    {c.d30Percent == null ? "—" : `${c.d30Percent}%`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

/** Seconds → "3m 4s" / "45s" / "—" for a session-duration value. */
function fmtDuration(seconds: number): string {
  if (!seconds) return "—";
  const s = Math.round(seconds);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

/**
 * Usuarios — "¿La gente usa Signa?": adquisición y actividad medidas sobre la ventana elegida.
 * Activation, new users and active users are measured over the range and compared with the previous
 * equal-length window; engagement and XP per user are over the period, total base as of its close.
 * Then the gamification & engagement section.
 */
export function UsersTab({
  range,
  live,
  onSelectRange,
}: {
  range: DateTimeRange;
  live: boolean;
  onSelectRange: RangeSelect;
}) {
  const growth = useGrowthMetrics(range, live);

  if (growth.isPending) return <p className="text-text-muted">Cargando métricas de usuarios…</p>;
  if (growth.isError && !growth.data)
    return <p className="text-danger">No pudimos cargar las métricas de usuarios.</p>;

  const g = growth.data!;
  const u = g.users;
  const e = g.engagement;
  const active = e.activeInRange;
  // Same universe as the other tiles (growth endpoint): non-staff accounts created before the window closes.
  const engagement = u.total ? Math.round((active / u.total) * 1000) / 10 : null;

  // Most recent weekly cohort whose 7-day retention is already observable (null while unobservable).
  const retention7 = (() => {
    for (let i = g.retention.length - 1; i >= 0; i -= 1) {
      const c = g.retention[i];
      if (c && c.d7Percent != null) return c.d7Percent;
    }
    return null;
  })();

  return (
    <div className="flex flex-col gap-7">
      {/* Adquisición, actividad y uso medidos sobre la ventana elegida: activos, altas, retención a
          la semana y frecuencia/duración de sesión (telemetría de la app). */}
      <div className="grid [grid-template-columns:repeat(auto-fit,minmax(180px,1fr))] gap-3">
        <KpiCard
          metric="users_active"
          value={NUMBER.format(active)}
          current={active}
          previous={e.previousActiveInRange}
          spark={e.dailyActive.map((d) => d.count)}
          hint={
            engagement != null
              ? `${engagement}% de ${NUMBER.format(u.total)} usuarios totales`
              : undefined
          }
        />
        <KpiCard
          metric="new_users"
          value={NUMBER.format(u.newInRange)}
          current={u.newInRange}
          previous={u.previousNewInRange}
          spark={u.daily.map((d) => d.count)}
          hint={u.total > 0 ? `${NUMBER.format(u.total)} usuarios totales` : undefined}
        />
        <KpiCard
          metric="retention_w1"
          value={retention7 == null ? "—" : `${retention7}%`}
          hint="Cohorte observable más reciente"
        />
        <KpiCard
          metric="sessions_per_user"
          value={g.sessions.users ? NUMBER.format(g.sessions.perUser) : "—"}
          hint={`${NUMBER.format(g.sessions.total)} sesiones · ${NUMBER.format(g.sessions.users)} usuarios`}
        />
        <KpiCard
          metric="session_duration"
          value={fmtDuration(g.sessions.averageDurationSeconds)}
          hint="Tiempo promedio por uso de la app"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <DailySeriesChart
          title="Usuarios activos"
          metric="users_active"
          points={e.dailyActive.map((d) => ({ t: d.t, value: d.count }))}
          format={fmtCount}
          range={range}
          onSelectRange={onSelectRange}
        />
        <DailySeriesChart
          title="Nuevos usuarios"
          metric="new_users"
          points={u.daily.map((d) => ({ t: d.t, value: d.count }))}
          format={fmtCount}
          range={range}
          onSelectRange={onSelectRange}
        />
      </div>

      <CohortRetentionTable rows={g.retention} />

      <div className="border-border flex items-center gap-3 border-t pt-5">
        <h2 className="font-display text-xl font-bold tracking-tight">Hábito y gamificación</h2>
      </div>
      <GamificationSection
        range={range}
        live={live}
        onSelectRange={onSelectRange}
        dailyActiveUsers={e.dailyActive}
      />
    </div>
  );
}
