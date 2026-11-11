"use client";

import { useState } from "react";
import Link from "next/link";
import { daysSince, expiryTone, fmtDayMonth } from "@/components/dashboard/format";
import { KpiCard, KpiRow } from "@/components/dashboard/kpi-card";
import { RevenueBySourceChart } from "@/components/dashboard/revenue-by-source-chart";
import type { RangeSelect } from "@/components/dashboard/perf-chart";
import { fmtMoney, fmtMoneyCompact } from "@/components/dashboard/perf-format";
import {
  Card,
  CardTitle,
  ErrorState,
  LoadingState,
  ProgressBar,
  StatRows,
} from "@/components/dashboard/ui";
import { NUMBER } from "@/components/dashboard/usage-business";
import {
  dailyRevenue,
  paymentConversion,
  pct0,
  pct1,
  rate1,
  revenueTotals,
} from "@/components/dashboard/usage-math";
import { useGrowthQuery } from "@/components/dashboard/usage-queries";
import type { GrowthMetrics, OrgUtilization } from "@/lib/api/metrics";
import { previousRange, type DateTimeRange } from "@/lib/datetime-range";
import { cn } from "@/lib/utils";

/** The organization pipeline, in the order the segmented bar and legend read left-to-right. */
const ORG_PIPELINE: { key: string; label: string; color: string }[] = [
  { key: "ACTIVE", label: "Activas", color: "var(--color-primary)" },
  { key: "PENDING", label: "Pendientes", color: "var(--color-streak-orange)" },
  { key: "SUSPENDED", label: "Suspendidas", color: "var(--color-primary-dark)" },
  { key: "REJECTED", label: "Rechazadas", color: "var(--color-text-muted)" },
];

/** Growth & business snapshot query — shared by the Resumen, Negocio and Usuarios tabs. */
export function useGrowthMetrics(range: DateTimeRange, live: boolean) {
  return useGrowthQuery(range, live);
}

function orgCount(items: { key: string; count: number }[], key: string): number {
  return items.find((i) => i.key === key)?.count ?? 0;
}

/** A part-of-whole percentage rounded to a whole number (0 when the whole is 0). */
function share(part: number, whole: number): number {
  return whole > 0 ? Math.round((part / whole) * 100) : 0;
}

/** Average org ticket per bucket (org income ÷ org purchases), for the KPI sparkline. */
function dailyTicket(g: GrowthMetrics): number[] {
  const purchases = new Map(g.orgs.dailyPurchases.map((d) => [d.t, d.count]));
  return g.revenue.daily
    .filter((d) => (purchases.get(d.t) ?? 0) > 0)
    .map((d) => d.amount / purchases.get(d.t)!);
}

/**
 * Negocio. A five-KPI north-star row (ingresos netos, tasa de reembolso, uso de cupos, ticket
 * promedio, conversión a pago), income **by source** (stacked), the **organizaciones** pipeline and
 * **usuarios finales** panels side by side, and the per-org license utilization table.
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
  const query = useGrowthQuery(range, live);
  const previous = useGrowthQuery(previousRange(range), live);

  if (query.isPending) return <LoadingState>Cargando métricas de negocio…</LoadingState>;
  if (!query.data) return <ErrorState>No pudimos cargar las métricas de negocio.</ErrorState>;

  const g = query.data;
  const pg = previous.data;
  const money = revenueTotals(g);
  const prevMoney = pg ? revenueTotals(pg) : null;
  const conversion = paymentConversion(g);
  const payingUsers = g.endUsers.payingUsers;
  const revenuePerPayer = payingUsers > 0 ? money.usersPaid / payingUsers : 0;

  return (
    <div className="flex flex-col gap-5">
      <KpiRow>
        <KpiCard
          metric="income"
          value={fmtMoneyCompact(money.net)}
          delta={{ current: money.net, previous: prevMoney?.net }}
          spark={dailyRevenue(g)}
          hint={`Orgs ${share(money.orgNet, money.net)}% · usuarios finales ${share(money.usersNet, money.net)}%`}
        />
        <KpiCard
          metric="refund_rate"
          value={pct1(money.refundRate)}
          toneValue={money.gross > 0 ? money.refundRate : null}
          delta={{
            current: money.refundRate,
            previous: prevMoney && prevMoney.gross > 0 ? prevMoney.refundRate : null,
            mode: "pp",
            good: "down",
          }}
          hint={`${fmtMoneyCompact(money.refunded)} · orgs ${pct1(rate1(money.orgRefunded, money.orgPaid))} · usuarios ${pct1(rate1(money.usersRefunded, money.usersPaid))}`}
        />
        <KpiCard
          metric="seat_utilization"
          value={g.seats.sold ? pct0(g.seats.utilizationPercent) : "—"}
          toneValue={g.seats.sold ? g.seats.utilizationPercent : null}
          delta={
            g.seats.sold
              ? {
                  current: Math.round(g.seats.utilizationPercent),
                  previous:
                    g.seats.previousUtilizationPercent == null
                      ? null
                      : Math.round(g.seats.previousUtilizationPercent),
                  mode: "pp",
                  decimals: 0,
                }
              : undefined
          }
          hint={`${NUMBER.format(g.seats.active)} de ${NUMBER.format(g.seats.sold)} cupos vendidos`}
        />
        <KpiCard
          metric="average_ticket"
          value={g.revenue.paidCount ? fmtMoney(g.revenue.averageTicket) : "—"}
          delta={
            g.revenue.paidCount
              ? {
                  current: g.revenue.averageTicket,
                  previous: pg && pg.revenue.paidCount ? pg.revenue.averageTicket : null,
                }
              : undefined
          }
          spark={dailyTicket(g)}
          hint={`${NUMBER.format(g.orgs.purchasesInRange)} ${g.orgs.purchasesInRange === 1 ? "compra de organizaciones" : "compras de organizaciones"}`}
        />
        <KpiCard
          metric="payment_conversion"
          value={pct1(conversion)}
          delta={{
            current: conversion,
            previous: pg ? paymentConversion(pg) : null,
            mode: "pp",
          }}
          hint={`${NUMBER.format(payingUsers)} ${payingUsers === 1 ? "usuario pagó algo" : "usuarios pagaron algo"}`}
        />
      </KpiRow>

      <RevenueBySourceChart
        title="Ingresos por fuente"
        subtitle="Ingresos brutos por día. Hacé clic en una barra para ver ese día."
        metric="income"
        range={range}
        format={fmtMoneyCompact}
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
            label: "Cursos pagos",
            color: "var(--color-course-teal)",
            points: g.courseSales.daily,
          },
        ]}
      />

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <OrganizationsPanel g={g} />
        <EndUsersPanel
          gemsAmount={g.gems.paidAmount}
          gemsPurchases={g.gems.purchases}
          gemsGranted={g.gems.gemsGranted}
          coursesAmount={g.courseSales.paidAmount}
          coursesPurchases={g.courseSales.purchases}
          payingUsers={payingUsers}
          revenuePerPayer={revenuePerPayer}
          repeatBuyerPercent={g.endUsers.repeatBuyerPercent}
        />
      </div>

      <OrgUtilizationTable rows={g.orgs.utilization} />
    </div>
  );
}

/** B2B pipeline panel: a segmented status bar + legend, the pending-validation strip and org stats. */
function OrganizationsPanel({ g }: { g: GrowthMetrics }) {
  const segments = ORG_PIPELINE.map((s) => ({ ...s, count: orgCount(g.organizations, s.key) }));
  const total = segments.reduce((sum, s) => sum + s.count, 0);
  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-center gap-1.5">
        <CardTitle>Organizaciones</CardTitle>
        <Link
          href="/admin/organizations"
          className="text-primary hover:text-primary-dark ml-auto text-[13px] font-extrabold"
        >
          Gestionar
        </Link>
      </div>

      <div>
        <div className="bg-fill flex h-3 gap-0.5 overflow-hidden rounded-full">
          {total === 0
            ? null
            : segments.map((s) =>
                s.count > 0 ? (
                  <div
                    key={s.key}
                    style={{ width: `${(s.count / total) * 100}%`, background: s.color }}
                  />
                ) : null,
              )}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
          {segments.map((s) => (
            <div key={s.key}>
              <span className="text-text-muted flex items-center gap-1.5 text-[13px]">
                <span className="size-2 shrink-0 rounded-full" style={{ background: s.color }} />
                {s.label}
              </span>
              <p className="font-display mt-0.5 text-2xl font-extrabold tracking-tight">
                {NUMBER.format(s.count)}
              </p>
            </div>
          ))}
        </div>
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

      <StatRows
        rows={[
          {
            label: "Usuarios promedio por organización",
            value: NUMBER.format(g.orgs.avgUsersPerOrg),
          },
          {
            label: "Ingreso promedio por organización",
            value: fmtMoney(g.orgs.avgRevenuePerOrg),
          },
          { label: "Compras en el período", value: NUMBER.format(g.orgs.purchasesInRange) },
        ]}
      />
    </Card>
  );
}

/** A compact money sub-tile for the "Usuarios finales" panel (gem packs / paid courses). */
function MoneyTile({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="bg-fill rounded-xl p-3.5">
      <p className="text-text-muted text-[13px] font-bold">{label}</p>
      <p className="font-display mt-1 text-2xl font-extrabold tracking-tight">{value}</p>
      <p className="text-text-muted mt-0.5 text-[13px]">{hint}</p>
    </div>
  );
}

/** End-user (no-org) revenue panel: gem and paid-course money plus payer counts and repeat rate. */
function EndUsersPanel({
  gemsAmount,
  gemsPurchases,
  gemsGranted,
  coursesAmount,
  coursesPurchases,
  payingUsers,
  revenuePerPayer,
  repeatBuyerPercent,
}: {
  gemsAmount: number;
  gemsPurchases: number;
  gemsGranted: number;
  coursesAmount: number;
  coursesPurchases: number;
  payingUsers: number;
  revenuePerPayer: number;
  repeatBuyerPercent: number;
}) {
  return (
    <Card className="flex flex-col gap-4">
      <CardTitle>Usuarios finales</CardTitle>
      <div className="grid grid-cols-2 gap-3">
        <MoneyTile
          label="Compras de gemas"
          value={fmtMoneyCompact(gemsAmount)}
          hint={`${NUMBER.format(gemsPurchases)} compras · ${NUMBER.format(gemsGranted)} gemas`}
        />
        <MoneyTile
          label="Cursos pagos"
          value={fmtMoneyCompact(coursesAmount)}
          hint={`${NUMBER.format(coursesPurchases)} ${coursesPurchases === 1 ? "curso vendido" : "cursos vendidos"}`}
        />
      </div>
      <StatRows
        rows={[
          { label: "Usuarios que compraron", value: NUMBER.format(payingUsers) },
          { label: "Ingreso por usuario pagador", value: fmtMoney(revenuePerPayer) },
          { label: "Recompra (2+ compras)", value: `${pct1(repeatBuyerPercent)}` },
        ]}
      />
    </Card>
  );
}

/** How many rows a long listing shows before the "Ver más" toggle. */
const ORG_TABLE_PREVIEW = 6;

/** The license health badge, ranked: no free seats, then under-use, then renewal risk, else healthy. */
function licenseStatus(o: OrgUtilization): { label: string; className: string } {
  if (o.occupancyPercent >= 100)
    return { label: "Sin cupos libres", className: "bg-primary-light text-primary-dark" };
  if (o.occupancyPercent < 50)
    return { label: "Bajo uso", className: "bg-shop-amber-light text-shop-amber-dark" };
  if (expiryTone(o.expiresAt) === "danger")
    return { label: "Vence pronto", className: "bg-danger-light text-danger" };
  return { label: "Saludable", className: "bg-success-light text-success-dark" };
}

/** Occupancy bar colour: under-used warns, healthy (≥ 80 %) is green, the rest neutral. */
function occupancyTone(percent: number): "warning" | "primary" | "success" {
  if (percent < 50) return "warning";
  if (percent >= 80) return "success";
  return "primary";
}

/**
 * Per-organization license utilization: contracted vs. used seats, active members, expiry and a
 * health badge. Ranked by risk (big contracts barely used or soon to renew). Long lists collapse to
 * {@link ORG_TABLE_PREVIEW} rows behind a "Ver las N organizaciones" toggle.
 */
function OrgUtilizationTable({ rows }: { rows: OrgUtilization[] }) {
  const [expanded, setExpanded] = useState(false);
  const canExpand = rows.length > ORG_TABLE_PREVIEW;
  const visible = expanded ? rows : rows.slice(0, ORG_TABLE_PREVIEW);
  return (
    <Card id="licencias" className="scroll-mt-6">
      <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
        <CardTitle>Licencias por organización</CardTitle>
        <p className="text-text-muted text-[13px]">
          Ordenadas por riesgo: contratos grandes con poco uso o próximos a vencer
        </p>
      </div>
      {rows.length === 0 ? (
        <p className="text-text-muted mt-4 text-sm">Sin compras de cupos todavía.</p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="text-text-muted text-left text-xs font-bold">
                <th className="pb-2 font-bold">Organización</th>
                <th className="pb-2 pl-3 text-right font-bold">Cupos</th>
                <th className="w-44 pb-2 pl-3 font-bold">Ocupación</th>
                <th className="pb-2 pl-3 text-right font-bold">Activos 7 d</th>
                <th className="pb-2 pl-3 font-bold">Vence</th>
                <th className="pb-2 pl-3 text-right font-bold">Ingresos</th>
                <th className="pb-2 pl-3 font-bold">Estado</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((o) => {
                const status = licenseStatus(o);
                const expiry = expiryTone(o.expiresAt);
                return (
                  <tr key={o.orgId} className="border-fill border-t">
                    <td className="py-2.5 font-extrabold">{o.name}</td>
                    <td className="py-2.5 pl-3 text-right">
                      {NUMBER.format(o.seatsActive)}/{NUMBER.format(o.seatsSold)}
                    </td>
                    <td className="py-2.5 pl-3">
                      <div className="flex items-center gap-2">
                        <ProgressBar
                          percent={o.occupancyPercent}
                          tone={occupancyTone(o.occupancyPercent)}
                          className="flex-1"
                          label={`Ocupación de ${o.name}`}
                        />
                        <span className="w-10 text-right text-xs font-extrabold">
                          {Math.round(o.occupancyPercent)}%
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 pl-3 text-right">{NUMBER.format(o.active7d)}</td>
                    <td
                      className={cn(
                        "py-2.5 pl-3 whitespace-nowrap",
                        expiry === "danger"
                          ? "text-danger font-extrabold"
                          : expiry === "warning"
                            ? "text-shop-amber-dark font-extrabold"
                            : "",
                      )}
                    >
                      {fmtDayMonth(o.expiresAt)}
                    </td>
                    <td className="py-2.5 pl-3 text-right font-extrabold">{fmtMoney(o.revenue)}</td>
                    <td className="py-2.5 pl-3">
                      <span
                        className={cn(
                          "inline-block rounded-full px-2.5 py-1 text-xs font-extrabold whitespace-nowrap",
                          status.className,
                        )}
                      >
                        {status.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {canExpand ? (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="text-primary hover:text-primary-dark mt-3 cursor-pointer text-[13px] font-extrabold"
            >
              {expanded ? "Ver menos" : `Ver las ${NUMBER.format(rows.length)} organizaciones`}
            </button>
          ) : null}
        </div>
      )}
    </Card>
  );
}
