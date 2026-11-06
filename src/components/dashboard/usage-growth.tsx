"use client";

import { useState, type ReactNode } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { BreakdownPie } from "@/components/dashboard/breakdown-pie";
import { DailySeriesChart } from "@/components/dashboard/daily-series-chart";
import { GoldenRow, GoldenTile } from "@/components/dashboard/golden-row";
import { InfoPopover } from "@/components/dashboard/info-popover";
import { MetricStat } from "@/components/dashboard/metric-stat";
import type { RangeSelect } from "@/components/dashboard/perf-chart";
import { fmtCount, fmtMoney } from "@/components/dashboard/perf-format";
import { REFRESH_MS } from "@/components/dashboard/perf-panel";
import { Card, CardTitle, ProgressBar } from "@/components/dashboard/ui";
import { NUMBER } from "@/components/dashboard/usage-business";
import { metricsApi, type OrgUtilization } from "@/lib/api/metrics";
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
            title="Compras de gemas"
            metric="gems_revenue"
            points={g.gems.daily.map((d) => ({ t: d.t, value: d.count }))}
            format={fmtCount}
            onSelectRange={onSelectRange}
            className="flex min-w-0 flex-col gap-3 lg:col-span-2"
          />
        </div>
      </Section>

      <Section title="Organizaciones">
        <div className="grid gap-4 lg:grid-cols-3">
          <DailySeriesChart
            title="Ingresos (B2B)"
            metric="revenue"
            points={g.revenue.daily.map((d) => ({ t: d.t, value: d.amount }))}
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
          <MetricStat metric="avg_users_per_org" value={NUMBER.format(g.orgs.avgUsersPerOrg)} />
          <MetricStat metric="avg_revenue_per_org" value={fmtMoney(g.orgs.avgRevenuePerOrg)} />
          <MetricStat
            metric="purchases_count"
            value={NUMBER.format(g.orgs.purchasesInRange)}
            hint={`ticket prom. ${fmtMoney(g.revenue.averageTicket)}`}
          />
          <MetricStat
            metric="refund_rate"
            value={`${g.revenue.refundRatePercent}%`}
            hint={fmtMoney(g.revenue.refundedAmount)}
          />
        </div>

        <OrgUtilizationTable rows={g.orgs.utilization} />
      </Section>
    </div>
  );
}

/** How many rows a long listing shows before the "Ver más" toggle. */
const ORG_TABLE_PREVIEW = 6;

/**
 * Per-organization license utilization: contracted vs. used seats, plus members and revenue. The
 * occupancy bar turns amber when a sizeable contract is barely used — the key B2B health signal.
 * Long lists collapse to {@link ORG_TABLE_PREVIEW} rows behind a "Ver más" toggle.
 */
function OrgUtilizationTable({ rows }: { rows: OrgUtilization[] }) {
  const [expanded, setExpanded] = useState(false);
  const canExpand = rows.length > ORG_TABLE_PREVIEW;
  const visible = expanded ? rows : rows.slice(0, ORG_TABLE_PREVIEW);
  return (
    <Card className="mt-4">
      <div className="flex items-center gap-1.5">
        <CardTitle>Utilización de licencias por organización</CardTitle>
        <InfoPopover metric="org_utilization" className="ml-auto" />
      </div>
      <p className="text-text-muted mt-1 text-[13px]">
        Cupos contratados vs. utilizados. Una ocupación baja en un contrato grande es una señal
        comercial.
      </p>
      {rows.length === 0 ? (
        <p className="text-text-muted mt-4 text-sm">Sin compras de cupos todavía.</p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="text-text-muted text-left text-xs font-bold">
                <th className="pb-2 font-bold">Organización</th>
                <th className="pb-2 pl-3 text-right font-bold">Miembros</th>
                <th className="pb-2 pl-3 text-right font-bold">Cupos</th>
                <th className="w-40 pb-2 pl-3 font-bold">Ocupación</th>
                <th className="pb-2 pl-3 text-right font-bold">Ingresos</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((o) => (
                <tr key={o.orgId} className="border-fill border-t">
                  <td className="py-2 font-bold">{o.name}</td>
                  <td className="py-2 pl-3 text-right">{NUMBER.format(o.members)}</td>
                  <td className="py-2 pl-3 text-right">
                    {NUMBER.format(o.seatsActive)}/{NUMBER.format(o.seatsSold)}
                  </td>
                  <td className="py-2 pl-3">
                    <div className="flex items-center gap-2">
                      <ProgressBar
                        percent={o.occupancyPercent}
                        tone={o.occupancyPercent < 50 ? "warning" : undefined}
                        className="flex-1"
                      />
                      <span className="w-10 text-right text-xs font-extrabold">
                        {o.occupancyPercent}%
                      </span>
                    </div>
                  </td>
                  <td className="py-2 pl-3 text-right font-extrabold">{fmtMoney(o.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {canExpand ? (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="text-primary hover:text-primary-dark mt-3 cursor-pointer text-[13px] font-extrabold"
            >
              {expanded
                ? "Ver menos"
                : `Ver más (${NUMBER.format(rows.length - ORG_TABLE_PREVIEW)})`}
            </button>
          ) : null}
        </div>
      )}
    </Card>
  );
}
