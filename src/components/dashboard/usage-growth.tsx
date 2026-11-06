"use client";

import type { ReactNode } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { BreakdownPie } from "@/components/dashboard/breakdown-pie";
import { DailySeriesChart } from "@/components/dashboard/daily-series-chart";
import { GoldenRow, GoldenTile } from "@/components/dashboard/golden-row";
import { MetricStat } from "@/components/dashboard/metric-stat";
import type { RangeSelect } from "@/components/dashboard/perf-chart";
import { fmtCount, fmtMoney } from "@/components/dashboard/perf-format";
import { REFRESH_MS } from "@/components/dashboard/perf-panel";
import { NUMBER } from "@/components/dashboard/usage-business";
import { metricsApi } from "@/lib/api/metrics";
import type { DateTimeRange } from "@/lib/datetime-range";

const ORG_STATUS: Record<string, string> = {
  ACTIVE: "Activas",
  PENDING: "Pendientes",
  REJECTED: "Rechazadas",
  SUSPENDED: "Suspendidas",
};

/** Growth & business snapshot query — shared by the Negocio and Usuarios tabs (one cache). */
export function useGrowthMetrics(range: DateTimeRange, live: boolean) {
  return useQuery({
    queryKey: ["admin", "metrics", "growth", range.from, range.to],
    queryFn: () => metricsApi.growth({ from: range.from, to: range.to }),
    enabled: Boolean(range.from && range.to),
    placeholderData: keepPreviousData,
    refetchInterval: live ? REFRESH_MS : false,
  });
}

function orgCount(items: { key: string; count: number }[], key: string): number {
  return items.find((i) => i.key === key)?.count ?? 0;
}

/** A labelled group of widgets within the tab. */
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="font-display text-xl font-bold tracking-tight">{title}</h2>
      {children}
    </div>
  );
}

/**
 * Negocio. The money: split into **sin organización** (individual monetization — gem purchases,
 * users on paid courses) and **organizaciones** (B2B course purchases, refunds, seats, org pipeline).
 */
export function GrowthTab({
  range,
  live,
  onSelectRange,
}: {
  range: DateTimeRange;
  live: boolean;
  onSelectRange: RangeSelect;
}) {
  const query = useGrowthMetrics(range, live);

  if (query.isPending) return <p className="text-text-muted">Cargando métricas de negocio…</p>;
  if (query.isError && !query.data)
    return <p className="text-danger">No pudimos cargar las métricas de negocio.</p>;

  const g = query.data!;

  return (
    <div className="flex flex-col gap-7">
      <GoldenRow>
        <GoldenTile
          metric="revenue"
          value={fmtMoney(g.revenue.paidAmount)}
          hint={`${NUMBER.format(g.revenue.paidCount)} compras`}
          tone="neutral"
        />
        <GoldenTile
          metric="refund_rate"
          value={`${g.revenue.refundRatePercent}%`}
          rawValue={g.revenue.refundRatePercent}
          hint={fmtMoney(g.revenue.refundedAmount)}
        />
        <GoldenTile
          metric="seat_utilization"
          value={g.seats.sold ? `${g.seats.utilizationPercent}%` : "—"}
          rawValue={g.seats.sold ? g.seats.utilizationPercent : null}
          hint={`${NUMBER.format(g.seats.active)}/${NUMBER.format(g.seats.sold)} cupos`}
        />
        <GoldenTile
          metric="gems_revenue"
          value={NUMBER.format(g.gems.purchases)}
          hint={`${NUMBER.format(g.gems.gemsGranted)} gemas`}
          tone="neutral"
        />
        <GoldenTile
          metric="orgs_active"
          value={NUMBER.format(orgCount(g.organizations, "ACTIVE"))}
          tone="neutral"
        />
      </GoldenRow>

      <Section title="Sin organización">
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="flex flex-col gap-4">
            <MetricStat metric="paid_course_users" value={NUMBER.format(g.paidCourseUsers)} />
            <MetricStat
              metric="gems_revenue"
              value={NUMBER.format(g.gems.purchases)}
              hint={`${NUMBER.format(g.gems.gemsGranted)} gemas acreditadas`}
            />
          </div>
          <DailySeriesChart
            title="Compras de gemas por día"
            metric="gems_revenue"
            points={g.gems.daily.map((d) => ({ day: d.day, value: d.count }))}
            format={fmtCount}
            onSelectRange={onSelectRange}
            className="flex min-w-0 flex-col gap-3 lg:col-span-2"
          />
        </div>
      </Section>

      <Section title="Organizaciones">
        <div className="grid gap-4 lg:grid-cols-3">
          <DailySeriesChart
            title="Ingresos (B2B) por día"
            metric="revenue"
            points={g.revenue.daily.map((d) => ({ day: d.day, value: d.amount }))}
            format={fmtMoney}
            onSelectRange={onSelectRange}
            className="flex min-w-0 flex-col gap-3 lg:col-span-2"
          />
          <BreakdownPie
            title="Organizaciones por estado"
            metric="orgs_active"
            items={Object.keys(ORG_STATUS).map((k) => ({
              label: ORG_STATUS[k]!,
              value: orgCount(g.organizations, k),
            }))}
          />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <MetricStat
            metric="revenue"
            value={fmtMoney(g.revenue.paidAmount)}
            hint={`ticket prom. ${fmtMoney(g.revenue.averageTicket)}`}
          />
          <MetricStat
            metric="refund_rate"
            value={`${g.revenue.refundRatePercent}%`}
            hint={fmtMoney(g.revenue.refundedAmount)}
          />
        </div>
      </Section>
    </div>
  );
}
