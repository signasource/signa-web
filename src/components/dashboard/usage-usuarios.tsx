"use client";

import { DailySeriesChart } from "@/components/dashboard/daily-series-chart";
import { Delta } from "@/components/dashboard/delta";
import { GoldenRow, GoldenTile } from "@/components/dashboard/golden-row";
import { MetricStat } from "@/components/dashboard/metric-stat";
import type { RangeSelect } from "@/components/dashboard/perf-chart";
import { fmtCount } from "@/components/dashboard/perf-format";
import { GamificationSection } from "@/components/dashboard/usage-gamification";
import { NUMBER } from "@/components/dashboard/usage-business";
import { useGrowthMetrics } from "@/components/dashboard/usage-growth";
import { metricsApi } from "@/lib/api/metrics";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { REFRESH_MS } from "@/components/dashboard/perf-panel";
import type { DateTimeRange } from "@/lib/datetime-range";

function useGamificationMetrics(range: DateTimeRange, live: boolean) {
  return useQuery({
    queryKey: ["admin", "metrics", "gamification", range.from, range.to],
    queryFn: () => metricsApi.gamification({ from: range.from, to: range.to }),
    enabled: Boolean(range.from && range.to),
    placeholderData: keepPreviousData,
    refetchInterval: live ? REFRESH_MS : false,
  });
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
  const gamification = useGamificationMetrics(range, live);

  if (growth.isPending) return <p className="text-text-muted">Cargando métricas de usuarios…</p>;
  if (growth.isError && !growth.data)
    return <p className="text-danger">No pudimos cargar las métricas de usuarios.</p>;

  const g = growth.data!;
  const u = g.users;
  const e = g.engagement;
  const active = e.activeInRange;
  // Same universe as the other tiles (growth endpoint): non-staff accounts created before the window closes.
  const engagement = u.total ? Math.round((active / u.total) * 1000) / 10 : null;
  const xp = gamification.data?.xp;
  // Same figure (and same "active" definition) as the gamification section, so the delta matches.
  const xpPerUser = xp && xp.activeUsers ? xp.perActiveUser : null;

  return (
    <div className="flex flex-col gap-7">
      {/* Adquisición y actividad medidas sobre la ventana elegida (altas, activos,
          base total al cierre y engagement/XP por usuario del período). */}
      <GoldenRow>
        <GoldenTile
          metric="new_users"
          value={NUMBER.format(u.newInRange)}
          hint={
            <>
              <Delta current={u.newInRange} previous={u.previousNewInRange} />
              {u.total > 0 ? (
                <span className="text-text-muted block">
                  {NUMBER.format(u.newInRange)} / {NUMBER.format(u.total)} totales
                </span>
              ) : null}
            </>
          }
          tone="neutral"
        />
        <GoldenTile
          metric="users_active"
          value={NUMBER.format(active)}
          hint={
            <>
              <Delta current={active} previous={e.previousActiveInRange} />
              {engagement != null ? (
                <span className="text-text-muted block">
                  {engagement}% de {NUMBER.format(u.total)} usuarios totales
                </span>
              ) : null}
            </>
          }
          tone="neutral"
        />
        <GoldenTile
          metric="xp_per_user"
          value={xpPerUser == null ? "—" : NUMBER.format(xpPerUser)}
          hint={
            xpPerUser == null ? undefined : (
              <Delta current={xpPerUser} previous={xp?.previousPerActiveUser ?? null} />
            )
          }
          tone="neutral"
        />
      </GoldenRow>

      <div className="grid gap-4 lg:grid-cols-2">
        <DailySeriesChart
          title="Nuevos usuarios"
          metric="new_users"
          points={u.daily.map((d) => ({ t: d.t, value: d.count }))}
          format={fmtCount}
          range={range}
          onSelectRange={onSelectRange}
        />
        <DailySeriesChart
          title="Usuarios activos"
          metric="users_active"
          points={e.dailyActive.map((d) => ({ t: d.t, value: d.count }))}
          format={fmtCount}
          range={range}
          onSelectRange={onSelectRange}
        />
      </div>

      {/* Sesiones: frecuencia de uso y tiempo dedicado (telemetría de la app); el gráfico muestra
          cuántos usuarios tuvieron la app abierta en cada intervalo (meseta mientras dura la sesión). */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4">
          <MetricStat
            metric="sessions_per_user"
            value={g.sessions.users ? NUMBER.format(g.sessions.perUser) : "—"}
            hint={`${NUMBER.format(g.sessions.total)} sesiones · ${NUMBER.format(g.sessions.users)} usuarios`}
          />
          <MetricStat
            metric="session_duration"
            value={fmtDuration(g.sessions.averageDurationSeconds)}
          />
        </div>
        <DailySeriesChart
          title="Usuarios conectados"
          metric="users_online"
          points={g.sessions.daily.map((d) => ({ t: d.t, value: d.count }))}
          format={fmtCount}
          range={range}
          onSelectRange={onSelectRange}
          className="flex min-w-0 flex-col gap-3 lg:col-span-2"
        />
      </div>

      <div className="border-border flex items-center gap-3 border-t pt-5">
        <h2 className="font-display text-xl font-bold tracking-tight">Gamificación & engagement</h2>
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
