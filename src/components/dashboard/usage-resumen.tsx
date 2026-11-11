"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { DailySeriesChart } from "@/components/dashboard/daily-series-chart";
import { KpiCard } from "@/components/dashboard/kpi-card";
import type { RangeSelect } from "@/components/dashboard/perf-chart";
import { fmtCount, fmtMoney } from "@/components/dashboard/perf-format";
import { usePerfQuery } from "@/components/dashboard/perf-panel";
import { Card, CardTitle } from "@/components/dashboard/ui";
import { NUMBER, useBusinessMetrics } from "@/components/dashboard/usage-business";
import { useGrowthMetrics } from "@/components/dashboard/usage-growth";
import { daysSince } from "@/components/dashboard/format";
import type { GrowthMetrics } from "@/lib/api/metrics";
import type { DateTimeRange } from "@/lib/datetime-range";
import { cn } from "@/lib/utils";

/** An actionable exception for the "Requiere atención" panel (only shown when it has a count). */
type Alert = {
  n: number;
  title: string;
  sub: string;
  cta: string;
  href: string;
  tone: "danger" | "warning";
};

/** The most recent weekly cohort whose 7-day retention is already observable, as a "%" or "—". */
function retention7d(retention: GrowthMetrics["retention"]): string {
  for (let i = retention.length - 1; i >= 0; i--) {
    const c = retention[i];
    if (c && c.d7Percent != null) return `${c.d7Percent}%`;
  }
  return "—";
}

/** Latest value of a 1/0 "up" perf widget → a status dot + label; neutral when unavailable. */
function ServiceStatus({ label, up }: { label: string; up: boolean | null }) {
  const tone = up == null ? "bg-text-muted" : up ? "bg-success" : "bg-danger";
  return (
    <span className="inline-flex items-center gap-1.5 text-[13px]">
      <span className={cn("size-2 rounded-full", tone)} />
      <span className="font-bold">{label}</span>
      <span className="text-text-muted">
        {up == null ? "sin datos" : up ? "operativo" : "caído"}
      </span>
    </span>
  );
}

export type ResumenTarget = "negocio" | "usuarios" | "aprendizaje" | "infraestructura";

/**
 * Resumen — the dashboard's at-a-glance view: five north-star KPIs with period-over-period deltas,
 * a "Requiere atención" list of actionable exceptions (each linking to where it's resolved) and a
 * services status strip. Every KPI links through to the tab that explores it.
 */
export function ResumenTab({
  range,
  live,
  step,
  onSelectRange,
  onSelectTab,
}: {
  range: DateTimeRange;
  live: boolean;
  step: number;
  onSelectRange: RangeSelect;
  onSelectTab: (tab: ResumenTarget) => void;
}) {
  const growth = useGrowthMetrics(range, live);
  const business = useBusinessMetrics(range, live);
  const backendUp = usePerfQuery("backend_up", { range, step, live });
  const r2Up = usePerfQuery("r2_up", { range, step, live });

  if (growth.isPending || business.isPending)
    return <p className="text-text-muted">Cargando resumen…</p>;
  if ((growth.isError && !growth.data) || (business.isError && !business.data))
    return <p className="text-danger">No pudimos cargar el resumen.</p>;

  const g = growth.data!;
  const b = business.data!;

  const netIncome = g.revenue.paidAmount - g.revenue.refundedAmount;
  const previousNet =
    g.revenue.previousPaidAmount == null
      ? null
      : g.revenue.previousPaidAmount - (g.revenue.previousRefundedAmount ?? 0);

  const alerts: Alert[] = [];
  if (g.orgs.pending > 0) {
    const d = daysSince(g.orgs.oldestPendingCreatedAt);
    alerts.push({
      n: g.orgs.pending,
      title: "Organizaciones pendientes de validar",
      sub:
        d != null ? `La más antigua hace ${d} ${d === 1 ? "día" : "días"}` : "Esperan aprobación",
      cta: "Validar",
      href: "/admin/organizations",
      tone: d != null && d >= 5 ? "danger" : "warning",
    });
  }
  if (b.errors.pendingSignReports > 0) {
    alerts.push({
      n: b.errors.pendingSignReports,
      title: "Reportes de señas sin resolver",
      sub: "Usuarios reportaron señas incorrectas o de baja calidad",
      cta: "Ver reportes",
      href: "/admin/sign-reports",
      tone: b.errors.pendingSignReports >= 10 ? "danger" : "warning",
    });
  }
  if (b.errors.failedImports > 0) {
    alerts.push({
      n: b.errors.failedImports,
      title: "Actualizaciones de contenido fallidas",
      sub: "El contenido de los cursos no se actualizó",
      cta: "Ver contenido",
      href: "/admin/content",
      tone: "danger",
    });
  }

  const upOf = (q: typeof backendUp): boolean | null => {
    if (!q.data?.available) return null;
    const pts = q.data.series[0]?.points ?? [];
    const last = [...pts].reverse().find((p) => p.v != null);
    return last ? last.v! >= 1 : null;
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid [grid-template-columns:repeat(auto-fit,minmax(180px,1fr))] gap-3">
        <KpiCard
          metric="users_active"
          value={NUMBER.format(g.engagement.activeInRange)}
          current={g.engagement.activeInRange}
          previous={g.engagement.previousActiveInRange}
          spark={g.engagement.dailyActive.map((d) => d.count)}
          hint="Personas con actividad en el período"
        />
        <KpiCard
          metric="new_users"
          value={NUMBER.format(g.users.newInRange)}
          current={g.users.newInRange}
          previous={g.users.previousNewInRange}
          spark={g.users.daily.map((d) => d.count)}
          hint="Cuentas nuevas en el período"
        />
        <KpiCard
          metric="income"
          value={fmtMoney(netIncome)}
          current={netIncome}
          previous={previousNet}
          spark={g.revenue.daily.map((d) => d.amount)}
          hint="Ingresos netos (org. + usuarios finales)"
        />
        <KpiCard
          metric="lessons_completed"
          value={NUMBER.format(b.progress.lessonsCompleted)}
          hint="Lecciones terminadas en el período"
        />
        <KpiCard
          metric="retention_w1"
          value={retention7d(g.retention)}
          hint="Cohorte observable más reciente"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <DailySeriesChart
          title="Usuarios activos"
          metric="users_active"
          points={g.engagement.dailyActive.map((d) => ({ t: d.t, value: d.count }))}
          format={fmtCount}
          range={range}
          onSelectRange={onSelectRange}
        />
        <DailySeriesChart
          title="Lecciones completadas"
          metric="lessons_completed"
          points={b.activity.map((d) => ({ t: d.day, value: d.lessonsCompleted }))}
          format={fmtCount}
          range={range}
          dayResolution
          onSelectRange={onSelectRange}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="flex flex-col gap-3">
          <div className="flex items-baseline gap-2">
            <CardTitle>Requiere atención</CardTitle>
            <span className="text-text-muted text-[13px]">
              {alerts.length} {alerts.length === 1 ? "tema" : "temas"}
            </span>
          </div>
          {alerts.length === 0 ? (
            <p className="text-text-muted text-sm">Todo en orden: nada pendiente de resolver.</p>
          ) : (
            <ul className="flex flex-col">
              {alerts.map((a) => (
                <li
                  key={a.title}
                  className="border-fill flex items-center gap-3 border-t py-2.5 first:border-t-0"
                >
                  <span
                    className={cn(
                      "font-display flex size-8 shrink-0 items-center justify-center rounded-full text-[13px] font-extrabold",
                      a.tone === "danger"
                        ? "bg-danger-light text-danger"
                        : "bg-shop-amber-light text-shop-amber-dark",
                    )}
                  >
                    {NUMBER.format(a.n)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold">{a.title}</p>
                    <p className="text-text-muted text-[13px]">{a.sub}</p>
                  </div>
                  <Link
                    href={a.href}
                    className="text-primary hover:text-primary-dark text-[13px] font-extrabold whitespace-nowrap"
                  >
                    {a.cta} →
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <ServicesStrip
          backendUp={upOf(backendUp)}
          r2Up={upOf(r2Up)}
          onGoInfra={() => onSelectTab("infraestructura")}
        />
      </div>
    </div>
  );
}

function ServicesStrip({
  backendUp,
  r2Up,
  onGoInfra,
}: {
  backendUp: boolean | null;
  r2Up: boolean | null;
  onGoInfra: () => void;
}): ReactNode {
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <CardTitle>Estado de servicios</CardTitle>
        <button
          type="button"
          onClick={onGoInfra}
          className="text-primary hover:text-primary-dark ml-auto cursor-pointer text-[13px] font-extrabold"
        >
          Ver infraestructura →
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <ServiceStatus label="Servidor" up={backendUp} />
        <ServiceStatus label="Animaciones (R2)" up={r2Up} />
      </div>
      <p className="text-text-muted text-[13px]">
        El reconocimiento de señas corre en el dispositivo; su salud es independiente del backend.
      </p>
    </Card>
  );
}
