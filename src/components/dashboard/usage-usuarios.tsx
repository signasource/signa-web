"use client";

import { DailySeriesChart } from "@/components/dashboard/daily-series-chart";
import { GoldenRow, GoldenTile } from "@/components/dashboard/golden-row";
import type { RangeSelect } from "@/components/dashboard/perf-chart";
import { fmtCount } from "@/components/dashboard/perf-format";
import { GamificationSection } from "@/components/dashboard/usage-gamification";
import { NUMBER, useBusinessMetrics } from "@/components/dashboard/usage-business";
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

/**
 * Usuarios. Everything here respects the from/to filter: active users and tasa de actividad are
 * measured over the range (not rolling windows), new users come with the running total, and XP per
 * active user is the range's XP over its active users. Then the gamification & engagement section.
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
  const business = useBusinessMetrics(range, live);
  const gamification = useGamificationMetrics(range, live);

  if (growth.isPending || business.isPending)
    return <p className="text-text-muted">Cargando métricas de usuarios…</p>;
  if (growth.isError && !growth.data)
    return <p className="text-danger">No pudimos cargar las métricas de usuarios.</p>;

  const g = growth.data!;
  const active = business.data?.users.active ?? 0;
  const total = business.data?.users.total ?? 0;
  const engagement = total ? Math.round((active / total) * 1000) / 10 : null;
  const xpTotal = gamification.data?.xp.total ?? 0;
  const xpPerUser = active ? Math.round(xpTotal / active) : null;

  return (
    <div className="flex flex-col gap-7">
      <GoldenRow>
        <GoldenTile metric="users_active" value={NUMBER.format(active)} tone="neutral" />
        <GoldenTile
          metric="new_users"
          value={NUMBER.format(g.users.newInRange)}
          hint={`${NUMBER.format(g.users.total)} usuarios totales`}
          tone="neutral"
        />
        <GoldenTile
          metric="engagement_rate"
          value={engagement == null ? "—" : `${engagement}%`}
          rawValue={engagement}
        />
        <GoldenTile
          metric="xp_per_user"
          value={xpPerUser == null ? "—" : NUMBER.format(xpPerUser)}
          tone="neutral"
        />
      </GoldenRow>

      <div className="grid gap-4 lg:grid-cols-2">
        <DailySeriesChart
          title="Nuevos usuarios por día"
          metric="new_users"
          points={g.users.daily.map((d) => ({ day: d.day, value: d.count }))}
          format={fmtCount}
          onSelectRange={onSelectRange}
        />
        <DailySeriesChart
          title="Usuarios activos por día"
          metric="users_active"
          points={g.engagement.dailyActive.map((d) => ({ day: d.day, value: d.count }))}
          format={fmtCount}
          onSelectRange={onSelectRange}
        />
      </div>

      <div className="border-border flex items-center gap-3 border-t pt-5">
        <h2 className="font-display text-xl font-bold tracking-tight">Gamificación & engagement</h2>
      </div>
      <GamificationSection range={range} live={live} onSelectRange={onSelectRange} />
    </div>
  );
}
