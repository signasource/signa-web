"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { BreakdownPie } from "@/components/dashboard/breakdown-pie";
import { DailySeriesChart } from "@/components/dashboard/daily-series-chart";
import { GoldenRow, GoldenTile } from "@/components/dashboard/golden-row";
import { MetricStat } from "@/components/dashboard/metric-stat";
import type { RangeSelect } from "@/components/dashboard/perf-chart";
import { fmtCount } from "@/components/dashboard/perf-format";
import { REFRESH_MS } from "@/components/dashboard/perf-panel";
import { Card, CardTitle, ErrorState, LoadingState, ProgressBar } from "@/components/dashboard/ui";
import { NUMBER } from "@/components/dashboard/usage-business";
import { metricsApi, type NameCount } from "@/lib/api/metrics";
import type { DateTimeRange } from "@/lib/datetime-range";

const CHALLENGE_TYPE: Record<string, string> = {
  FIRST_STEPS: "Primeros pasos",
  DAILY: "Diarios",
  WEEKLY: "Semanales",
};

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
 * Gamificación & engagement. XP earned, streak health, achievements, challenge claim rates, gifts and
 * the shop economy. Rendered as a section inside the Usuarios tab (not a standalone tab).
 */
export function GamificationSection({
  range,
  live,
  onSelectRange,
}: {
  range: DateTimeRange;
  live: boolean;
  onSelectRange: RangeSelect;
}) {
  const query = useGamificationMetrics(range, live);

  if (query.isPending) return <LoadingState>Cargando métricas de gamificación…</LoadingState>;
  if (query.isError && !query.data)
    return <ErrorState>No pudimos cargar las métricas de gamificación.</ErrorState>;

  const g = query.data!;
  const streakOverPct = g.streaks.activeStreakers
    ? Math.round((g.streaks.usersOverSevenDays / g.streaks.activeStreakers) * 1000) / 10
    : null;
  const totalCompleted = g.challenges.reduce((s, c) => s + c.completed, 0);
  const totalClaimed = g.challenges.reduce((s, c) => s + c.claimed, 0);
  const claimRate = totalCompleted ? Math.round((totalClaimed / totalCompleted) * 1000) / 10 : null;

  return (
    <div className="flex flex-col gap-6">
      <GoldenRow>
        <GoldenTile
          metric="streak_over7"
          value={streakOverPct == null ? "—" : `${streakOverPct}%`}
          rawValue={streakOverPct}
          hint={`${NUMBER.format(g.streaks.usersOverSevenDays)} / ${NUMBER.format(g.streaks.activeStreakers)} con racha`}
        />
        <GoldenTile
          metric="max_streak"
          value={`${NUMBER.format(g.streaks.maxStreak)} d`}
          tone="neutral"
        />
        <GoldenTile
          metric="xp_per_active_user"
          value={g.xp.activeUsers ? NUMBER.format(g.xp.perActiveUser) : "—"}
          hint={`${NUMBER.format(g.xp.total)} XP total`}
          tone="neutral"
        />
        <GoldenTile
          metric="achievement_unlock_rate"
          value={`${g.achievements.unlockRatePercent}%`}
          rawValue={g.achievements.unlockRatePercent}
          hint={`${NUMBER.format(g.achievements.unlocked)} en el período`}
        />
        <GoldenTile
          metric="challenge_claim_rate"
          value={claimRate == null ? "—" : `${claimRate}%`}
          rawValue={claimRate}
        />
      </GoldenRow>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <MetricStat
          metric="streak_avg"
          value={g.streaks.averageStreakActive ? `${g.streaks.averageStreakActive} d` : "—"}
          hint={`${NUMBER.format(g.streaks.activeStreakers)} con racha activa`}
        />
        <MetricStat
          metric="gem_redemption_rate"
          value={g.shop.gemsCredited ? `${g.shop.redemptionRatePercent}%` : "—"}
          hint={`${NUMBER.format(g.shop.totalGemsSpent)} / ${NUMBER.format(g.shop.gemsCredited)} 💎`}
        />
        <MetricStat
          metric="gifts"
          value={NUMBER.format(g.gifts.sent)}
          hint={`${NUMBER.format(g.gifts.claimed)} reclamados`}
        />
        <MetricStat metric="gems_spent" value={NUMBER.format(g.shop.totalGemsSpent)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <DailySeriesChart
          title="XP por día"
          metric="xp_daily"
          points={g.xp.daily.map((d) => ({ day: d.day, value: d.count }))}
          format={fmtCount}
          onSelectRange={onSelectRange}
        />
        <DailySeriesChart
          title="Logros desbloqueados por día"
          metric="achievements_unlocked"
          points={g.achievements.daily.map((d) => ({ day: d.day, value: d.count }))}
          format={fmtCount}
          onSelectRange={onSelectRange}
        />
        <DailySeriesChart
          title="Gemas gastadas por día"
          metric="gems_spent"
          points={g.shop.dailySpent.map((d) => ({ day: d.day, value: d.count }))}
          format={fmtCount}
          onSelectRange={onSelectRange}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="flex min-w-0 flex-col gap-3">
          <CardTitle>Reclamo de desafíos</CardTitle>
          {g.challenges.length === 0 ? (
            <p className="text-text-muted text-sm">Sin desafíos completados.</p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {g.challenges.map((c) => (
                <li key={c.type} className="flex flex-col gap-1">
                  <div className="flex justify-between gap-2 text-[13px] font-bold">
                    <span className="truncate">{CHALLENGE_TYPE[c.type] ?? c.type}</span>
                    <span>
                      {c.claimRatePercent}% · {NUMBER.format(c.claimed)}/
                      {NUMBER.format(c.completed)}
                    </span>
                  </div>
                  <ProgressBar percent={c.claimRatePercent} />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <BreakdownPie
          title="Distribución de XP"
          items={g.xpDistribution.map((t) => ({ label: t.name, value: t.count }))}
        />

        <Card className="flex min-w-0 flex-col gap-3">
          <CardTitle>Ítems más comprados</CardTitle>
          {g.shop.topItems.length === 0 ? (
            <p className="text-text-muted text-sm">Sin compras en el período.</p>
          ) : (
            <dl className="flex flex-col">
              {g.shop.topItems.map((item) => (
                <div
                  key={item.title}
                  className="border-fill flex justify-between gap-3 border-b py-2 text-sm last:border-b-0"
                >
                  <dt className="text-text-muted truncate">{item.title}</dt>
                  <dd className="font-extrabold">
                    {NUMBER.format(item.purchases)} · {NUMBER.format(item.gemsSpent)} 💎
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </Card>
      </div>

      {/* Ranking de logros: los más y los menos desbloqueados. */}
      <div className="grid gap-4 lg:grid-cols-2">
        <AchievementRanking title="Logros más desbloqueados" items={g.achievements.topUnlocked} />
        <AchievementRanking
          title="Logros menos desbloqueados"
          items={g.achievements.leastUnlocked}
        />
      </div>
    </div>
  );
}

/** A ranked list of achievements by unlock count (used for both most- and least-unlocked). */
function AchievementRanking({ title, items }: { title: string; items: NameCount[] }) {
  return (
    <Card className="flex min-w-0 flex-col gap-3">
      <CardTitle>{title}</CardTitle>
      {items.length === 0 ? (
        <p className="text-text-muted text-sm">Sin logros.</p>
      ) : (
        <dl className="flex flex-col">
          {items.map((a) => (
            <div
              key={a.name}
              className="border-fill flex justify-between gap-3 border-b py-2 text-sm last:border-b-0"
            >
              <dt className="text-text-muted truncate">{a.name}</dt>
              <dd className="font-extrabold">{NUMBER.format(a.count)}</dd>
            </div>
          ))}
        </dl>
      )}
    </Card>
  );
}
