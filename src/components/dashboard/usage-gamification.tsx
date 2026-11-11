"use client";

import { useState, type ReactNode } from "react";
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
import { DeltaText } from "@/components/dashboard/delta";
import { InfoPopover } from "@/components/dashboard/info-popover";
import { toneFor, METRICS } from "@/components/dashboard/metric-catalog";
import { Card, CardTitle, ErrorState, LoadingState, ProgressBar } from "@/components/dashboard/ui";
import { NUMBER } from "@/components/dashboard/usage-business";
import { pct0, rate1 } from "@/components/dashboard/usage-math";
import { useGamificationQuery } from "@/components/dashboard/usage-queries";
import type { GamificationMetrics, NameCount } from "@/lib/api/metrics";
import { previousRange, type DateTimeRange } from "@/lib/datetime-range";
import { cn } from "@/lib/utils";

const CHALLENGE_TYPE: Record<string, string> = {
  FIRST_STEPS: "Primeros pasos",
  DAILY: "Diarios",
  WEEKLY: "Semanales",
};
const CHALLENGE_ORDER = ["FIRST_STEPS", "DAILY", "WEEKLY"];

/** Overall claim rate (claimed ÷ completed across challenge types), or `null` without data. */
export function claimRate(g: GamificationMetrics): number | null {
  const completed = g.challenges.reduce((s, c) => s + c.completed, 0);
  const claimed = g.challenges.reduce((s, c) => s + c.claimed, 0);
  return completed ? rate1(claimed, completed) : null;
}

/**
 * Hábito y gamificación (inside the Usuarios tab): one stat strip (no second KPI hierarchy), then
 * the XP histogram, challenge claims by type and the most/least unlocked achievements.
 */
export function GamificationSection({ range, live }: { range: DateTimeRange; live: boolean }) {
  const query = useGamificationQuery(range, live);
  const previous = useGamificationQuery(previousRange(range), live);

  if (query.isPending) return <LoadingState>Cargando métricas de gamificación…</LoadingState>;
  if (!query.data) return <ErrorState>No pudimos cargar las métricas de gamificación.</ErrorState>;

  const g = query.data;
  const rate = claimRate(g);
  const prevRate = previous.data ? claimRate(previous.data) : null;

  return (
    <div className="flex flex-col gap-4">
      <Card className="grid grid-cols-2 p-0 sm:grid-cols-3 lg:grid-cols-5">
        <StripStat
          label="XP por usuario activo"
          value={g.xp.activeUsers ? NUMBER.format(g.xp.perActiveUser) : "—"}
          sub={<DeltaText current={g.xp.perActiveUser} previous={g.xp.previousPerActiveUser} />}
        />
        <StripStat
          label="Desbloqueo de logros"
          value={pct0(g.achievements.unlockRatePercent)}
          sub={`${NUMBER.format(g.achievements.unlocked)} logros`}
        />
        <StripStat
          label="Reclamo de desafíos"
          value={rate == null ? "—" : pct0(rate)}
          sub={
            rate == null ? null : (
              <DeltaText
                current={Math.round(rate)}
                previous={prevRate == null ? null : Math.round(prevRate)}
                mode="pp"
                decimals={0}
              />
            )
          }
        />
        <StripStat
          label="Canje de gemas"
          value={g.shop.gemsInInventory ? pct0(g.shop.redemptionRatePercent) : "—"}
          sub={`${NUMBER.format(g.shop.totalGemsSpent)} de ${NUMBER.format(g.shop.gemsInInventory)}`}
        />
        <StripStat
          label="Regalos enviados"
          value={NUMBER.format(g.gifts.sent)}
          sub={g.gifts.sent ? `${pct0(rate1(g.gifts.claimed, g.gifts.sent))} reclamados` : null}
        />
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <XpHistogram tiers={g.xpDistribution} />
        <ChallengeClaims challenges={g.challenges} />
        <AchievementsCard
          top={g.achievements.topUnlocked}
          least={g.achievements.leastUnlocked}
          eligibleUsers={g.achievements.eligibleUsers}
        />
      </div>
    </div>
  );
}

function StripStat({ label, value, sub }: { label: string; value: string; sub?: ReactNode }) {
  return (
    <div className="border-fill flex min-w-0 flex-col gap-1 border-r border-b px-[18px] py-4 last:border-r-0 lg:border-b-0">
      <p className="text-text-muted truncate text-[13px] font-bold">{label}</p>
      <p className="font-display text-[28px] leading-8 font-extrabold tracking-tight">{value}</p>
      {sub ? <div className="text-text-muted text-xs">{sub}</div> : null}
    </div>
  );
}

function HistogramTooltip({
  active,
  payload,
}: TooltipContentProps<TooltipValueType, string | number>) {
  const point = payload?.[0]?.payload as NameCount | undefined;
  if (!active || !point) return null;
  return (
    <div className="border-border bg-surface rounded-xl border px-3 py-2 text-[13px] shadow-lg">
      <p className="text-text-muted font-bold">{point.name} XP</p>
      <p className="font-extrabold">{NUMBER.format(point.count)} usuarios</p>
    </div>
  );
}

/** Active users per XP-earned tier: an ordered histogram (not a donut — the tiers have an order). */
function XpHistogram({ tiers }: { tiers: NameCount[] }) {
  const total = tiers.reduce((s, t) => s + t.count, 0);
  return (
    <Card className="flex min-w-0 flex-col gap-3">
      <div className="flex items-start gap-1.5">
        <div className="min-w-0">
          <CardTitle>Distribución de experiencia</CardTitle>
          <p className="text-text-muted mt-0.5 text-[13px]">
            Usuarios activos por XP ganada en el período
          </p>
        </div>
        <InfoPopover metric="xp_distribution" className="ml-auto" />
      </div>
      {total === 0 ? (
        <p className="text-text-muted py-8 text-center text-sm">Sin actividad en este período.</p>
      ) : (
        <div
          role="img"
          aria-label={tiers.map((t) => `${t.name} XP: ${t.count} usuarios`).join(". ")}
          className="h-[180px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={tiers} margin={{ top: 22, right: 0, left: 0, bottom: 0 }}>
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                interval={0}
                tick={{ fill: "var(--color-text-muted)", fontSize: 11 }}
              />
              <Tooltip
                content={HistogramTooltip}
                cursor={{ fill: "var(--color-fill)", radius: 8 }}
                isAnimationActive={false}
              />
              <Bar
                dataKey="count"
                fill="var(--color-primary)"
                radius={[6, 6, 2, 2]}
                isAnimationActive={false}
              >
                <LabelList
                  dataKey="count"
                  position="top"
                  formatter={(v: unknown) => NUMBER.format(Number(v))}
                  style={{ fill: "var(--color-text)", fontSize: 12, fontWeight: 800 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}

function ChallengeClaims({ challenges }: { challenges: GamificationMetrics["challenges"] }) {
  const threshold = METRICS.challenge_claim_rate.threshold;
  const ordered = [...challenges].sort(
    (a, b) => CHALLENGE_ORDER.indexOf(a.type) - CHALLENGE_ORDER.indexOf(b.type),
  );
  return (
    <Card className="flex min-w-0 flex-col gap-3">
      <div className="flex items-center gap-1.5">
        <CardTitle>Reclamo de desafíos</CardTitle>
        <InfoPopover metric="challenge_claim_rate" className="ml-auto" />
      </div>
      {ordered.length === 0 ? (
        <p className="text-text-muted text-sm">Sin desafíos completados.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {ordered.map((c) => {
            const tone = toneFor(c.claimRatePercent, threshold);
            return (
              <li key={c.type} className="flex flex-col gap-1.5">
                <div className="flex justify-between gap-2 text-[13px]">
                  <span className="truncate font-extrabold">
                    {CHALLENGE_TYPE[c.type] ?? c.type}
                  </span>
                  <span className="text-text-muted shrink-0">
                    <span className="text-text font-extrabold">{pct0(c.claimRatePercent)}</span> ·{" "}
                    {NUMBER.format(c.claimed)}/{NUMBER.format(c.completed)}
                  </span>
                </div>
                <ProgressBar
                  percent={c.claimRatePercent}
                  tone={tone === "success" ? "success" : tone === "neutral" ? "primary" : "warning"}
                  label={`Reclamo de desafíos ${CHALLENGE_TYPE[c.type] ?? c.type}`}
                />
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

/** Most and least unlocked achievements (all-time) in one card, with the share of users holding each. */
function AchievementsCard({
  top,
  least,
  eligibleUsers,
}: {
  top: NameCount[];
  least: NameCount[];
  eligibleUsers: number;
}) {
  const [view, setView] = useState<"top" | "least">("top");
  const items = (view === "top" ? top : least).slice(0, 5);
  return (
    <Card className="flex min-w-0 flex-col gap-3">
      <div className="flex items-center gap-1.5">
        <CardTitle>Logros</CardTitle>
        <div
          role="group"
          aria-label="Orden de logros"
          className="border-border ml-auto flex h-7 items-center rounded-full border p-0.5 text-[11px] font-extrabold"
        >
          {(["top", "least"] as const).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={view === v}
              onClick={() => setView(v)}
              className={cn(
                "h-6 cursor-pointer rounded-full px-2.5 transition-colors",
                view === v ? "bg-primary-light text-primary-dark" : "text-text-muted",
              )}
            >
              {v === "top" ? "Más" : "Menos"}
            </button>
          ))}
        </div>
      </div>
      {items.length === 0 ? (
        <p className="text-text-muted text-sm">Sin logros.</p>
      ) : (
        <dl className="flex flex-col">
          {items.map((a) => (
            <div
              key={a.name}
              className="border-fill flex items-baseline justify-between gap-3 border-b py-2 text-sm last:border-b-0"
            >
              <dt className="text-text-muted truncate">{a.name}</dt>
              <dd className="shrink-0">
                <span className="font-extrabold">{NUMBER.format(a.count)}</span>
                {eligibleUsers > 0 ? (
                  <span className="text-text-muted ml-1.5 text-xs">
                    {pct0(Math.min(100, rate1(a.count, eligibleUsers)))}
                  </span>
                ) : null}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </Card>
  );
}
