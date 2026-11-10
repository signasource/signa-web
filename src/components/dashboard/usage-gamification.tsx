"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { BreakdownPie } from "@/components/dashboard/breakdown-pie";
import { DailySeriesChart } from "@/components/dashboard/daily-series-chart";
import { GoldenRow, GoldenTile } from "@/components/dashboard/golden-row";
import { InfoPopover } from "@/components/dashboard/info-popover";
import type { MetricId } from "@/components/dashboard/metric-catalog";
import { MetricStat } from "@/components/dashboard/metric-stat";
import type { RangeSelect } from "@/components/dashboard/perf-chart";
import { fmtCount } from "@/components/dashboard/perf-format";
import { REFRESH_MS } from "@/components/dashboard/perf-panel";
import { Card, CardTitle, ErrorState, LoadingState, ProgressBar } from "@/components/dashboard/ui";
import { NUMBER } from "@/components/dashboard/usage-business";
import { metricsApi, type NameCount, type SeriesCount } from "@/lib/api/metrics";
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
  dailyActiveUsers,
}: {
  range: DateTimeRange;
  live: boolean;
  onSelectRange: RangeSelect;
  /** Daily active users from the growth query — used to compute XP per user per day. */
  dailyActiveUsers?: SeriesCount[];
}) {
  const query = useGamificationMetrics(range, live);

  if (query.isPending) return <LoadingState>Cargando métricas de gamificación…</LoadingState>;
  if (query.isError && !query.data)
    return <ErrorState>No pudimos cargar las métricas de gamificación.</ErrorState>;

  const g = query.data!;
  const totalCompleted = g.challenges.reduce((s, c) => s + c.completed, 0);
  const totalClaimed = g.challenges.reduce((s, c) => s + c.claimed, 0);
  const claimRate = totalCompleted ? Math.round((totalClaimed / totalCompleted) * 1000) / 10 : null;

  return (
    <div className="flex flex-col gap-6">
      <GoldenRow>
        <GoldenTile
          metric="xp_per_active_user"
          value={g.xp.activeUsers ? NUMBER.format(g.xp.perActiveUser) : "—"}
          hint={(() => {
            const prev = g.xp.previousPerActiveUser;
            const curr = g.xp.perActiveUser;
            const totalLine = (
              <span className="text-text-muted block">{NUMBER.format(g.xp.total)} XP total</span>
            );
            if (prev == null) return totalLine;
            if (prev === 0)
              return (
                <>
                  {totalLine}
                  {curr > 0 ? <span className="text-success-dark">nuevo</span> : null}
                </>
              );
            const pct = Math.round(((curr - prev) / prev) * 1000) / 10;
            const sign = pct > 0 ? "+" : "";
            const cls =
              pct > 0 ? "text-success-dark" : pct < 0 ? "text-danger" : "text-text-muted";
            return (
              <>
                {totalLine}
                <span className={cls}>
                  {sign}
                  {pct}% vs. período anterior
                </span>
              </>
            );
          })()}
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
          metric="gem_redemption_rate"
          value={g.shop.gemsCredited ? `${g.shop.redemptionRatePercent}%` : "—"}
          hint={`${NUMBER.format(g.shop.totalGemsSpent)} / ${NUMBER.format(g.shop.gemsCredited)} 💎`}
        />
        <MetricStat
          metric="gifts"
          value={NUMBER.format(g.gifts.sent)}
          hint={`${NUMBER.format(g.gifts.claimed)} reclamados`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <DailySeriesChart
          title="XP"
          metric="xp_daily"
          points={g.xp.daily.map((d) => ({ t: d.day, value: d.count }))}
          format={fmtCount}
          range={range}
          dayResolution
          onSelectRange={onSelectRange}
        />
        <DailySeriesChart
          title="Logros desbloqueados"
          metric="achievements_unlocked"
          points={g.achievements.daily.map((d) => ({ t: d.day, value: d.count }))}
          format={fmtCount}
          range={range}
          dayResolution
          onSelectRange={onSelectRange}
        />
        {(() => {
          const activeByDay = new Map(
            (dailyActiveUsers ?? []).map((d) => [d.t.slice(0, 10), d.count]),
          );
          const xpPerUserPoints = g.xp.daily
            .map((d) => {
              const active = activeByDay.get(d.day) ?? 0;
              return { t: d.day, value: active > 0 ? Math.round(d.count / active) : 0 };
            })
            .filter((p) => p.value > 0);
          return (
            <DailySeriesChart
              title="XP por usuario activo"
              metric="xp_per_active_user"
              points={xpPerUserPoints}
              format={fmtCount}
              range={range}
              dayResolution
              onSelectRange={onSelectRange}
            />
          );
        })()}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="flex min-w-0 flex-col gap-3">
          <div className="flex items-center gap-1.5">
            <CardTitle>Reclamo de desafíos</CardTitle>
            <InfoPopover metric="challenge_claim_rate" className="ml-auto" />
          </div>
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
          metric="xp_distribution"
          items={g.xpDistribution.map((t) => ({ label: t.name, value: t.count }))}
        />

        <Card className="flex min-w-0 flex-col gap-3">
          <div className="flex items-center gap-1.5">
            <CardTitle>Ítems más comprados</CardTitle>
            <InfoPopover metric="shop_top" className="ml-auto" />
          </div>
          {g.shop.topItems.length === 0 ? (
            <p className="text-text-muted text-sm">Sin compras en el período.</p>
          ) : (
            <dl className="flex flex-col">
              {g.shop.topItems.map((item) => (
                <div
                  key={item.title}
                  className="border-fill flex justify-between gap-3 border-b py-2 text-sm last:border-b-0"
                >
                  <dt className="text-text-muted truncate">
                    {item.title}
                    <span className="ml-1 font-extrabold text-current">
                      · {NUMBER.format(item.gemsSpent)} 💎
                    </span>
                  </dt>
                  <dd className="font-extrabold shrink-0">{NUMBER.format(item.purchases)}×</dd>
                </div>
              ))}
            </dl>
          )}
        </Card>
      </div>

      {/* Ranking de logros: los más y los menos desbloqueados. */}
      <div className="grid gap-4 lg:grid-cols-2">
        <AchievementRanking
          title="Logros más desbloqueados"
          metric="achievements_unlocked"
          items={g.achievements.topUnlocked}
        />
        <AchievementRanking
          title="Logros menos desbloqueados"
          metric="achievements_least"
          items={g.achievements.leastUnlocked}
        />
      </div>
    </div>
  );
}

/** A ranked list of achievements by unlock count (used for both most- and least-unlocked). */
function AchievementRanking({
  title,
  metric,
  items,
}: {
  title: string;
  metric: MetricId;
  items: NameCount[];
}) {
  return (
    <Card className="flex min-w-0 flex-col gap-3">
      <div className="flex items-center gap-1.5">
        <CardTitle>{title}</CardTitle>
        <InfoPopover metric={metric} className="ml-auto" />
      </div>
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
