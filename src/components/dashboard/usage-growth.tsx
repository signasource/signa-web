"use client";

import { useState } from "react";
import Link from "next/link";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { daysSince, expiryTone, fmtShortDate } from "@/components/dashboard/format";
import { InfoPopover } from "@/components/dashboard/info-popover";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { RevenueBySourceChart } from "@/components/dashboard/revenue-by-source-chart";
import type { RangeSelect } from "@/components/dashboard/perf-chart";
import { fmtMoney, fmtMoneyCompact } from "@/components/dashboard/perf-format";
import { REFRESH_MS } from "@/components/dashboard/perf-panel";
import { Card, CardTitle, ProgressBar, StatRows } from "@/components/dashboard/ui";
import { NUMBER } from "@/components/dashboard/usage-business";
import { metricsApi, type OrgUtilization } from "@/lib/api/metrics";
import type { DateTimeRange } from "@/lib/datetime-range";
import { cn } from "@/lib/utils";

/** The organization pipeline, in the order the segmented bar and legend read left-to-right. */
const ORG_PIPELINE: { key: string; label: string; color: string }[] = [
  { key: "ACTIVE", label: "Activas", color: "var(--color-primary)" },
  { key: "PENDING", label: "Pendientes", color: "var(--color-streak-orange)" },
  { key: "SUSPENDED", label: "Suspendidas", color: "var(--color-primary-dark)" },
  { key: "REJECTED", label: "Rechazadas", color: "var(--color-text-muted)" },
];

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

/** One decimal, Argentine comma, with a trailing "%": `pct1(5.8)` → `"5,8%"`. */
function pct1(value: number): string {
  return `${value.toLocaleString("es-AR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`;
}

/** A part-of-whole percentage rounded to a whole number (0 when the whole is 0). */
function share(part: number, whole: number): number {
  return whole > 0 ? Math.round((part / whole) * 100) : 0;
}

/** A refund rate (refunded / paid, one decimal; 0 when nothing was paid). */
function rate1(refunded: number, paid: number): number {
  return paid > 0 ? Math.round((refunded / paid) * 1000) / 10 : 0;
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
  const query = useGrowthMetrics(range, live);

  if (query.isPending) return <p className="text-text-muted">Cargando métricas de negocio…</p>;
  if (query.isError && !query.data)
    return <p className="text-danger">No pudimos cargar las métricas de negocio.</p>;

  const g = query.data!;

  // Income is split between organizations (seat purchases) and end users (gems + paid courses).
  const incomeUsers = g.gems.paidAmount + g.courseSales.paidAmount;
  const refundUsers = g.gems.refundedAmount + g.courseSales.refundedAmount;
  const usersNet = incomeUsers - refundUsers;

  const orgNet = g.revenue.paidAmount - g.revenue.refundedAmount;
  const totalPaid = g.revenue.paidAmount + incomeUsers;
  const totalRefunded = g.revenue.refundedAmount + refundUsers;
  const netTotal = orgNet + usersNet;
  const previousOrgNet =
    g.revenue.previousPaidAmount == null
      ? null
      : g.revenue.previousPaidAmount - (g.revenue.previousRefundedAmount ?? 0);
  const unifiedRefundRate = rate1(totalRefunded, totalPaid);

  const previousTicket =
    g.revenue.previousPaidCount == null || g.revenue.previousPaidCount === 0
      ? null
      : (g.revenue.previousPaidAmount ?? 0) / g.revenue.previousPaidCount;

  const payingUsers = g.endUsers.payingUsers;
  const conversionPercent =
    g.users.total > 0 ? Math.round((payingUsers / g.users.total) * 1000) / 10 : 0;
  const revenuePerPayer = payingUsers > 0 ? incomeUsers / payingUsers : 0;

  return (
    <div className="flex flex-col gap-7">
      <div className="grid [grid-template-columns:repeat(auto-fit,minmax(180px,1fr))] gap-3">
        <KpiCard
          metric="income"
          value={fmtMoneyCompact(netTotal)}
          current={orgNet}
          previous={previousOrgNet}
          spark={g.revenue.daily.map((d) => d.amount)}
          hint={`Orgs ${share(orgNet, netTotal)}% · usuarios finales ${share(usersNet, netTotal)}%`}
        />
        <KpiCard
          metric="refund_rate"
          value={pct1(unifiedRefundRate)}
          hint={`${fmtMoneyCompact(totalRefunded)} · orgs ${pct1(rate1(g.revenue.refundedAmount, g.revenue.paidAmount))} · usuarios ${pct1(rate1(refundUsers, incomeUsers))}`}
        />
        <KpiCard
          metric="seat_utilization"
          value={g.seats.sold ? `${Math.round(g.seats.utilizationPercent)}%` : "—"}
          current={g.seats.sold ? g.seats.utilizationPercent : undefined}
          previous={g.seats.previousUtilizationPercent}
          mode="pp"
          hint={`${NUMBER.format(g.seats.active)} de ${NUMBER.format(g.seats.sold)} cupos vendidos`}
        />
        <KpiCard
          metric="average_ticket"
          value={fmtMoney(g.revenue.averageTicket)}
          current={g.revenue.averageTicket}
          previous={previousTicket}
          hint={`${NUMBER.format(g.orgs.purchasesInRange)} ${g.orgs.purchasesInRange === 1 ? "compra de organizaciones" : "compras de organizaciones"}`}
        />
        <KpiCard
          metric="payment_conversion"
          value={pct1(conversionPercent)}
          hint={`${NUMBER.format(payingUsers)} ${payingUsers === 1 ? "usuario pagó algo" : "usuarios pagaron algo"}`}
        />
      </div>

      <RevenueBySourceChart
        title="Ingresos por fuente"
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
function OrganizationsPanel({
  g,
}: {
  g: NonNullable<ReturnType<typeof useGrowthMetrics>["data"]>;
}) {
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

/**
 * Per-organization license utilization: contracted vs. used seats, active members, expiry and a
 * health badge. Ranked by risk (big contracts barely used or soon to renew). Long lists collapse to
 * {@link ORG_TABLE_PREVIEW} rows behind a "Ver más" toggle.
 */
function OrgUtilizationTable({ rows }: { rows: OrgUtilization[] }) {
  const [expanded, setExpanded] = useState(false);
  const canExpand = rows.length > ORG_TABLE_PREVIEW;
  const visible = expanded ? rows : rows.slice(0, ORG_TABLE_PREVIEW);
  return (
    <Card>
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
        Ordenadas por riesgo: contratos grandes con poco uso o próximos a vencer.
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
                <th className="pb-2 pl-3 font-bold">Estado</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((o) => {
                const status = licenseStatus(o);
                return (
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
                    <td className="py-2 pl-3">
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
