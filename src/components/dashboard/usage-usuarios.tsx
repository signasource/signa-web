"use client";

import { DailySeriesChart } from "@/components/dashboard/daily-series-chart";
import { KpiCard, KpiRow } from "@/components/dashboard/kpi-card";
import type { RangeSelect } from "@/components/dashboard/perf-chart";
import { fmtCount } from "@/components/dashboard/perf-format";
import { ErrorState, LoadingState } from "@/components/dashboard/ui";
import { GamificationSection } from "@/components/dashboard/usage-gamification";
import { NUMBER } from "@/components/dashboard/usage-business";
import {
  fmtDuration,
  fmtDurationDiff,
  pct0,
  pct1,
  perDayHint,
  rate1,
  retention7,
} from "@/components/dashboard/usage-math";
import { useGrowthQuery } from "@/components/dashboard/usage-queries";
import { previousRange, type DateTimeRange } from "@/lib/datetime-range";

const ONE_DECIMAL = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 1 });

/**
 * Usuarios — "¿La gente usa Signa?": acquisition and activity over the selected window, each KPI
 * compared with the previous equal-length window, the active/new series with the previous window
 * dashed, then the habit & gamification section.
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
  const prev = previousRange(range);
  const growth = useGrowthQuery(range, live);
  const previous = useGrowthQuery(prev, live);

  if (growth.isPending) return <LoadingState>Cargando métricas de usuarios…</LoadingState>;
  if (!growth.data) return <ErrorState>No pudimos cargar las métricas de usuarios.</ErrorState>;

  const g = growth.data;
  const pg = previous.data;
  const u = g.users;
  const e = g.engagement;
  const retention = retention7(g.retention);
  const prevRetention = pg ? retention7(pg.retention) : null;
  const cohortSpark = g.retention.flatMap((c) => (c.d7Percent == null ? [] : [c.d7Percent]));

  return (
    <div className="flex flex-col gap-5">
      <KpiRow>
        <KpiCard
          metric="users_active"
          value={NUMBER.format(e.activeInRange)}
          delta={{ current: e.activeInRange, previous: e.previousActiveInRange }}
          hint={`${pct1(rate1(e.activeInRange, u.total))} de ${NUMBER.format(u.total)} usuarios`}
          spark={e.dailyActive.map((d) => d.count)}
        />
        <KpiCard
          metric="new_users"
          value={NUMBER.format(u.newInRange)}
          delta={{ current: u.newInRange, previous: u.previousNewInRange }}
          hint={perDayHint(u.newInRange, range) ?? `${NUMBER.format(u.total)} usuarios totales`}
          spark={u.daily.map((d) => d.count)}
        />
        <KpiCard
          metric="retention_w1"
          value={retention == null ? "—" : pct0(retention)}
          toneValue={retention}
          delta={
            retention == null
              ? undefined
              : {
                  current: Math.round(retention),
                  previous: prevRetention == null ? null : Math.round(prevRetention),
                  mode: "pp",
                  decimals: 0,
                }
          }
          hint={
            retention == null
              ? "Todavía no pasaron 7 días desde los registros del período"
              : "de los registrados en el período"
          }
          spark={cohortSpark}
        />
        <KpiCard
          metric="sessions_per_user"
          value={g.sessions.users ? ONE_DECIMAL.format(g.sessions.perUser) : "—"}
          delta={
            g.sessions.users
              ? {
                  current: g.sessions.perUser,
                  previous: pg && pg.sessions.users ? pg.sessions.perUser : null,
                }
              : undefined
          }
          hint={`${NUMBER.format(g.sessions.total)} sesiones`}
        />
        <KpiCard
          metric="session_duration"
          value={fmtDuration(g.sessions.averageDurationSeconds)}
          delta={
            g.sessions.averageDurationSeconds
              ? {
                  current: g.sessions.averageDurationSeconds,
                  previous:
                    pg && pg.sessions.averageDurationSeconds
                      ? pg.sessions.averageDurationSeconds
                      : null,
                  mode: "abs",
                  format: fmtDurationDiff,
                }
              : undefined
          }
          hint="promedio por sesión"
        />
      </KpiRow>

      <div className="grid gap-4 lg:grid-cols-2">
        <DailySeriesChart
          title="Usuarios activos"
          metric="users_active"
          seriesLabel="Activos"
          points={e.dailyActive.map((d) => ({ t: d.t, value: d.count }))}
          previous={pg?.engagement.dailyActive.map((d) => ({ t: d.t, value: d.count }))}
          format={fmtCount}
          range={range}
          onSelectRange={onSelectRange}
        />
        <DailySeriesChart
          title="Nuevos usuarios"
          metric="new_users"
          seriesLabel="Nuevos"
          points={u.daily.map((d) => ({ t: d.t, value: d.count }))}
          previous={pg?.users.daily.map((d) => ({ t: d.t, value: d.count }))}
          format={fmtCount}
          range={range}
          onSelectRange={onSelectRange}
        />
      </div>

      <div className="border-border mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1 border-t pt-6">
        <h2 className="font-display text-xl font-bold tracking-tight">Hábito y gamificación</h2>
        <p className="text-text-muted text-[13px]">¿La gamificación hace volver a la gente?</p>
      </div>
      <GamificationSection range={range} live={live} />
    </div>
  );
}
