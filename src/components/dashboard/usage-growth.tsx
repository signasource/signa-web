"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { BreakdownPie } from "@/components/dashboard/breakdown-pie";
import { DailySeriesChart } from "@/components/dashboard/daily-series-chart";
import { Delta } from "@/components/dashboard/delta";
import { daysSince, expiryTone, fmtShortDate } from "@/components/dashboard/format";
import { InfoPopover } from "@/components/dashboard/info-popover";
import { RevenueBySourceChart } from "@/components/dashboard/revenue-by-source-chart";
import { METRICS, type MetricId } from "@/components/dashboard/metric-catalog";
import { MetricStat } from "@/components/dashboard/metric-stat";
import type { RangeSelect } from "@/components/dashboard/perf-chart";
import { fmtMoney } from "@/components/dashboard/perf-format";
import { REFRESH_MS } from "@/components/dashboard/perf-panel";
import { Card, CardTitle, ProgressBar } from "@/components/dashboard/ui";
import { NUMBER } from "@/components/dashboard/usage-business";
import { metricsApi, type OrgUtilization } from "@/lib/api/metrics";
import type { DateTimeRange } from "@/lib/datetime-range";
import { cn } from "@/lib/utils";

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
 * A golden-style headline tile that splits one money figure into **organizaciones** (B2B) and
 * **usuarios finales** (direct gem/course purchases), the two sides the business is asked to compare.
 * Carries the same InfoPopover as every widget so it reads correctly with no prior context.
 */
function SplitMoneyTile({
  metric,
  total,
  orgAmount,
  userAmount,
}: {
  metric: MetricId;
  total: number;
  orgAmount: number;
  userAmount: number;
}) {
  const def = METRICS[metric];
  return (
    <div className="border-border bg-surface dash-card-enter relative flex flex-col rounded-2xl border p-5">
      <div className="flex items-center gap-1.5">
        <p className="text-text-muted truncate text-[13px] font-bold">{def.label}</p>
        <InfoPopover metric={metric} className="ml-auto" />
      </div>
      <p className="font-display dash-stat-pop mt-1.5 text-4xl leading-10 font-extrabold tracking-tight">
        {fmtMoney(total)}
      </p>
      <dl className="mt-4 flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-text-muted text-[13px] font-semibold">Organizaciones</dt>
          <dd className="font-display text-lg font-extrabold tracking-tight">
            {fmtMoney(orgAmount)}
          </dd>
        </div>
        <div className="border-fill flex items-baseline justify-between gap-3 border-t pt-2">
          <dt className="text-text-muted text-[13px] font-semibold">Usuarios finales</dt>
          <dd className="font-display text-lg font-extrabold tracking-tight">
            {fmtMoney(userAmount)}
          </dd>
        </div>
      </dl>
    </div>
  );
}

/**
 * Negocio. The money: two headline tiles (Ingresos y Reembolsos, each split organizaciones vs.
 * usuarios finales), then **sin organización** (gem and paid-course purchases: money first, units
 * below) and **organizaciones** (B2B purchases, refunds, seats, org pipeline).
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

  const incomeUsers = g.gems.paidAmount + g.courseSales.paidAmount;
  const refundUsers = g.gems.refundedAmount + g.courseSales.refundedAmount;

  return (
    <div className="flex flex-col gap-7">
      <div className="grid gap-3 sm:grid-cols-2">
        <SplitMoneyTile
          metric="income"
          total={g.revenue.paidAmount + incomeUsers}
          orgAmount={g.revenue.paidAmount}
          userAmount={incomeUsers}
        />
        <SplitMoneyTile
          metric="refunds"
          total={g.revenue.refundedAmount + refundUsers}
          orgAmount={g.revenue.refundedAmount}
          userAmount={refundUsers}
        />
      </div>

      <RevenueBySourceChart
        title="Ingresos por fuente"
        metric="income"
        range={range}
        format={fmtMoney}
        onSelectRange={onSelectRange}
        sources={[
          {
            key: "orgs",
            label: "Organizaciones",
            color: "var(--color-primary)",
            points: g.revenue.daily,
          },
          {
            key: "gems",
            label: "Gemas",
            color: "var(--color-gems-blue)",
            points: g.gems.daily,
          },
          {
            key: "courses",
            label: "Cursos",
            color: "var(--color-course-teal)",
            points: g.courseSales.daily,
          },
        ]}
      />

      <Section title="Sin organización">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
          <MetricStat
            metric="gems_revenue"
            value={fmtMoney(g.gems.paidAmount)}
            hint={`${NUMBER.format(g.gems.gemsGranted)} gemas · ${NUMBER.format(g.gems.purchases)} compras`}
          />
          <MetricStat
            metric="course_sales"
            value={fmtMoney(g.courseSales.paidAmount)}
            hint={`${NUMBER.format(g.courseSales.purchases)} ${g.courseSales.purchases === 1 ? "curso" : "cursos"}`}
          />
          {(() => {
            const totalIncome = g.gems.paidAmount + g.courseSales.paidAmount;
            const totalRefunded = g.gems.refundedAmount + g.courseSales.refundedAmount;
            const rate =
              totalIncome > 0 ? Math.round((totalRefunded / totalIncome) * 1000) / 10 : 0;
            return (
              <MetricStat
                metric="refund_rate_users"
                value={`${rate}%`}
                hint={fmtMoney(totalRefunded)}
              />
            );
          })()}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <DailySeriesChart
            title="Compras de gemas"
            metric="gems_revenue"
            points={g.gems.daily.map((d) => ({ t: d.t, value: d.amount }))}
            format={fmtMoney}
            range={range}
            onSelectRange={onSelectRange}
          />
          <DailySeriesChart
            title="Compras de cursos pagos"
            metric="course_sales"
            points={g.courseSales.daily.map((d) => ({ t: d.t, value: d.amount }))}
            format={fmtMoney}
            range={range}
            onSelectRange={onSelectRange}
          />
        </div>
      </Section>

      <Section title="Organizaciones">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <MetricStat
            metric="orgs_active"
            value={NUMBER.format(orgCount(g.organizations, "ACTIVE"))}
          />
          <MetricStat
            metric="seat_utilization"
            value={g.seats.sold ? `${g.seats.utilizationPercent}%` : "—"}
            hint={
              <>
                {`${NUMBER.format(g.seats.active)}/${NUMBER.format(g.seats.sold)} cupos`}{" "}
                <Delta
                  current={g.seats.utilizationPercent}
                  previous={g.seats.previousUtilizationPercent}
                  mode="pp"
                />
              </>
            }
          />
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
            hint={
              <>
                {fmtMoney(g.revenue.refundedAmount)}{" "}
                {g.revenue.previousPaidAmount != null ? (
                  <Delta
                    current={g.revenue.refundRatePercent}
                    previous={
                      g.revenue.previousPaidAmount > 0
                        ? Math.round(
                            ((g.revenue.previousRefundedAmount ?? 0) /
                              g.revenue.previousPaidAmount) *
                              1000,
                          ) / 10
                        : 0
                    }
                    mode="pp"
                  />
                ) : null}
              </>
            }
          />
        </div>

        {g.orgs.pending > 0 ? (
          <div className="bg-shop-amber-light flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl px-3 py-2.5 text-[13px]">
            <span className="text-shop-amber-dark font-extrabold">
              {NUMBER.format(g.orgs.pending)}{" "}
              {g.orgs.pending === 1 ? "pendiente de validar" : "pendientes de validar"}
            </span>
            {(() => {
              const d = daysSince(g.orgs.oldestPendingCreatedAt);
              return d != null ? (
                <span className="text-shop-amber-dark">
                  la más antigua hace {d} {d === 1 ? "día" : "días"}
                </span>
              ) : null;
            })()}
            <Link
              href="/admin/organizations"
              className="text-shop-amber-dark ml-auto font-extrabold hover:underline"
            >
              Validar
            </Link>
          </div>
        ) : null}

        <OrgUtilizationTable rows={g.orgs.utilization} />

        <div className="grid gap-4 lg:grid-cols-3">
          <DailySeriesChart
            title="Ingresos de organizaciones"
            metric="revenue"
            points={g.revenue.daily.map((d) => ({ t: d.t, value: d.amount }))}
            format={fmtMoney}
            range={range}
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
        <CardTitle>Licencias por organización</CardTitle>
        <Link
          href="/admin/organizations"
          className="text-primary hover:text-primary-dark ml-auto text-[13px] font-extrabold"
        >
          Gestionar
        </Link>
        <InfoPopover metric="org_utilization" />
      </div>
      <p className="text-text-muted mt-1 text-[13px]">
        Ordenadas por riesgo: contratos grandes con poco uso o próximos a vencer. Una ocupación baja
        en un contrato grande es una señal comercial.
      </p>
      {rows.length === 0 ? (
        <p className="text-text-muted mt-4 text-sm">Sin compras de cupos todavía.</p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="text-text-muted text-left text-xs font-bold">
                <th className="pb-2 font-bold">Organización</th>
                <th className="pb-2 pl-3 text-right font-bold">Cupos</th>
                <th className="w-40 pb-2 pl-3 font-bold">Ocupación</th>
                <th className="pb-2 pl-3 text-right font-bold">Activos 7 d</th>
                <th className="pb-2 pl-3 font-bold">Vence</th>
                <th className="pb-2 pl-3 text-right font-bold">Ingresos</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((o) => (
                <tr key={o.orgId} className="border-fill border-t">
                  <td className="py-2 font-bold">{o.name}</td>
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
                  <td className="py-2 pl-3 text-right">{NUMBER.format(o.active7d)}</td>
                  <td
                    className={cn(
                      "py-2 pl-3",
                      expiryTone(o.expiresAt) === "danger"
                        ? "text-danger font-bold"
                        : expiryTone(o.expiresAt) === "warning"
                          ? "text-warning-dark font-semibold"
                          : "text-text-muted",
                    )}
                  >
                    {fmtShortDate(o.expiresAt)}
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
