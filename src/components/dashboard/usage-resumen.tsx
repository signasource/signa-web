"use client";

import Link from "next/link";
import { DailySeriesChart } from "@/components/dashboard/daily-series-chart";
import { daysSince } from "@/components/dashboard/format";
import { KpiCard, KpiRow } from "@/components/dashboard/kpi-card";
import type { RangeSelect } from "@/components/dashboard/perf-chart";
import { fmtCount, fmtMoneyCompact } from "@/components/dashboard/perf-format";
import { ServicesStrip, useServiceStatus } from "@/components/dashboard/services-status";
import { Card, CardTitle, ErrorState, LoadingState } from "@/components/dashboard/ui";
import { NUMBER } from "@/components/dashboard/usage-business";
import {
  dailyRevenue,
  pct1,
  perDayHint,
  rate1,
  rateOrNull,
  revenueTotals,
} from "@/components/dashboard/usage-math";
import {
  useBusinessQuery,
  useGrowthQuery,
  useLearningQuery,
} from "@/components/dashboard/usage-queries";
import type { BusinessMetrics, GrowthMetrics, LearningMetrics } from "@/lib/api/metrics";
import { courseLessonHref } from "@/lib/course-deep-link";
import { previousRange, type DateTimeRange } from "@/lib/datetime-range";
import { cn } from "@/lib/utils";

export type ResumenTarget = "negocio" | "usuarios" | "aprendizaje" | "infraestructura";

/** Below this occupancy a contract counts as under-used (same rule as the license table). */
export const LOW_USE_PERCENT = 50;
/** A lesson's abandonment worth flagging on the Resumen. */
export const ABANDONMENT_ALERT_PERCENT = 40;

/** An actionable exception for "Requiere atención": a badge, what happened, and where to fix it. */
export type Alert = {
  key: string;
  badge: string;
  title: string;
  sub: string;
  cta: string;
  tone: "danger" | "warning";
  href?: string;
  tab?: ResumenTarget;
  /** Element id to scroll to once the tab is shown. */
  anchor?: string;
};

/**
 * Builds the "Requiere atención" list: only exceptions that need someone to act, each pointing at
 * the screen where it's resolved. Nothing here is informational.
 */
export function buildAlerts({
  growth: g,
  business: b,
  learning: l,
  emailFailures,
}: {
  growth: GrowthMetrics;
  business: BusinessMetrics;
  learning: LearningMetrics | undefined;
  emailFailures: number | null;
}): Alert[] {
  const alerts: Alert[] = [];
  if (g.orgs.pending > 0) {
    const d = daysSince(g.orgs.oldestPendingCreatedAt);
    alerts.push({
      key: "orgs",
      badge: NUMBER.format(g.orgs.pending),
      title: "Organizaciones pendientes de validar",
      sub:
        d != null
          ? `La más antigua espera hace ${d} ${d === 1 ? "día" : "días"}`
          : "Esperan aprobación",
      cta: "Validar",
      href: "/admin/organizations",
      tone: "warning",
    });
  }
  if (b.errors.pendingSignReports > 0) {
    const top = l?.reports.mostReportedPending?.[0];
    alerts.push({
      key: "reports",
      badge: NUMBER.format(b.errors.pendingSignReports),
      title: "Reportes de señas sin resolver",
      sub: top
        ? `«${top.meaning}» acumula ${NUMBER.format(top.count)} ${top.count === 1 ? "reporte" : "reportes"}`
        : "Usuarios reportaron señas incorrectas o de baja calidad",
      cta: "Revisar",
      href: "/admin/sign-reports",
      tone: "danger",
    });
  }
  const lowUse = g.orgs.utilization
    .filter((o) => o.seatsSold > 0 && o.occupancyPercent < LOW_USE_PERCENT)
    .sort((a, b) => b.seatsSold - a.seatsSold);
  if (lowUse.length > 0) {
    alerts.push({
      key: "low-use",
      badge: NUMBER.format(lowUse.length),
      title: "Contratos grandes con poco uso",
      sub: lowUse
        .slice(0, 2)
        .map((o) => `${o.name} ${Math.round(o.occupancyPercent)}%`)
        .join(" · "),
      cta: "Ver licencias",
      tab: "negocio",
      anchor: "licencias",
      tone: "warning",
    });
  }
  const worst = l?.lessonsToReview?.[0];
  if (worst && worst.abandonmentPercent >= ABANDONMENT_ALERT_PERCENT) {
    alerts.push({
      key: "abandonment",
      badge: `${Math.round(worst.abandonmentPercent)}%`,
      title: `Abandono en «${worst.lessonName}»`,
      sub: "La lección con mayor caída del embudo",
      cta: "Ver lección",
      href: courseLessonHref(worst.courseId, worst.lessonId),
      tone: "warning",
    });
  }
  if (emailFailures != null && emailFailures > 0) {
    alerts.push({
      key: "emails",
      badge: NUMBER.format(emailFailures),
      title: "Emails que no se enviaron",
      sub: "Verificaciones, invitaciones o recuperos de contraseña",
      cta: "Ver detalle",
      tab: "infraestructura",
      tone: "danger",
    });
  }
  if (b.errors.failedImports > 0) {
    alerts.push({
      key: "imports",
      badge: NUMBER.format(b.errors.failedImports),
      title: "Actualizaciones de contenido fallidas",
      sub: "El contenido de los cursos no se actualizó",
      cta: "Ver contenido",
      href: "/admin/content",
      tone: "danger",
    });
  }
  return alerts;
}

/**
 * Resumen — "¿está todo bien?" in seconds: five north-star KPIs with period-over-period deltas, the
 * actionable exceptions next to the two trend charts (with the previous window dashed), and the
 * services status strip.
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
  onSelectTab: (tab: ResumenTarget, anchor?: string) => void;
}) {
  const prev = previousRange(range);
  const growth = useGrowthQuery(range, live);
  const prevGrowth = useGrowthQuery(prev, live);
  const business = useBusinessQuery(range, live);
  const prevBusiness = useBusinessQuery(prev, live);
  const learning = useLearningQuery(range, live);
  const services = useServiceStatus(range, step, live);

  if (growth.isPending || business.isPending) return <LoadingState>Cargando resumen…</LoadingState>;
  if (!growth.data || !business.data) return <ErrorState>No pudimos cargar el resumen.</ErrorState>;

  const g = growth.data;
  const pg = prevGrowth.data;
  const b = business.data;
  const l = learning.data;

  const money = revenueTotals(g);
  const prevMoney = pg ? revenueTotals(pg) : null;
  const activeShare = rate1(g.engagement.activeInRange, g.users.total);
  const prevCompletion = rateOrNull(l?.lessons.previousCompleted, l?.lessons.previousStarted);
  const prevSuccess = rateOrNull(l?.exercises.previousCorrect, l?.exercises.previousAttempted);

  const alerts = buildAlerts({
    growth: g,
    business: b,
    learning: l,
    emailFailures: services.emailFailures,
  });

  return (
    <div className="flex flex-col gap-4">
      <KpiRow>
        <KpiCard
          metric="income"
          value={fmtMoneyCompact(money.net)}
          delta={{ current: money.net, previous: prevMoney?.net }}
          hint={`Bruto ${fmtMoneyCompact(money.gross)} · reembolsos ${fmtMoneyCompact(money.refunded)}`}
          spark={dailyRevenue(g)}
        />
        <KpiCard
          metric="users_active"
          value={NUMBER.format(g.engagement.activeInRange)}
          delta={{
            current: g.engagement.activeInRange,
            previous: g.engagement.previousActiveInRange,
          }}
          hint={`${pct1(activeShare)} de ${NUMBER.format(g.users.total)} usuarios`}
          spark={g.engagement.dailyActive.map((d) => d.count)}
        />
        <KpiCard
          metric="new_users"
          value={NUMBER.format(g.users.newInRange)}
          delta={{ current: g.users.newInRange, previous: g.users.previousNewInRange }}
          hint={perDayHint(g.users.newInRange, range) ?? `${NUMBER.format(g.users.total)} en total`}
          spark={g.users.daily.map((d) => d.count)}
        />
        <KpiCard
          metric="lesson_completion_rate"
          value={l && l.lessons.started ? pct1(l.lessons.completionPercent) : "—"}
          toneValue={l && l.lessons.started ? l.lessons.completionPercent : null}
          delta={
            l && l.lessons.started
              ? { current: l.lessons.completionPercent, previous: prevCompletion, mode: "pp" }
              : undefined
          }
          hint={
            l
              ? `${NUMBER.format(l.lessons.completed)} de ${NUMBER.format(l.lessons.started)} iniciadas`
              : undefined
          }
        />
        <KpiCard
          metric="exercise_success_rate"
          value={l && l.exercises.attempted ? pct1(l.exercises.successPercent) : "—"}
          toneValue={l && l.exercises.attempted ? l.exercises.successPercent : null}
          delta={
            l && l.exercises.attempted
              ? { current: l.exercises.successPercent, previous: prevSuccess, mode: "pp" }
              : undefined
          }
          hint={
            l
              ? `${l.exercises.averageAttempts.toLocaleString("es-AR")} intentos por ejercicio`
              : undefined
          }
          spark={l?.dailyAccuracy.map((d) => d.accuracyPercent)}
        />
      </KpiRow>

      <div className="grid gap-4 lg:grid-cols-2">
        <AttentionList alerts={alerts} onSelectTab={onSelectTab} />
        <div className="flex flex-col gap-4">
          <DailySeriesChart
            title="Usuarios activos por día"
            metric="users_active"
            seriesLabel="Activos"
            showKindToggle={false}
            points={g.engagement.dailyActive.map((d) => ({ t: d.t, value: d.count }))}
            previous={pg?.engagement.dailyActive.map((d) => ({ t: d.t, value: d.count }))}
            format={fmtCount}
            range={range}
            onSelectRange={onSelectRange}
          />
          <DailySeriesChart
            title="Lecciones completadas por día"
            metric="lessons_completed"
            seriesLabel="Completadas"
            showKindToggle={false}
            points={b.activity.map((d) => ({ t: d.day, value: d.lessonsCompleted }))}
            previous={prevBusiness.data?.activity.map((d) => ({
              t: d.day,
              value: d.lessonsCompleted,
            }))}
            format={fmtCount}
            range={range}
            dayResolution
            onSelectRange={onSelectRange}
          />
        </div>
      </div>

      <ServicesStrip
        items={services.items}
        unavailable={services.unavailable}
        action={{ label: "Ver infraestructura", onClick: () => onSelectTab("infraestructura") }}
      />
    </div>
  );
}

const CTA = "text-primary hover:text-primary-dark text-[13px] font-extrabold whitespace-nowrap";

function AttentionList({
  alerts,
  onSelectTab,
}: {
  alerts: Alert[];
  onSelectTab: (tab: ResumenTarget, anchor?: string) => void;
}) {
  return (
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
            <li key={a.key} className="border-fill flex items-center gap-3 border-t py-3">
              <span
                className={cn(
                  "font-display flex size-9 shrink-0 items-center justify-center rounded-full text-[13px] font-extrabold",
                  a.tone === "danger"
                    ? "bg-danger-light text-danger"
                    : "bg-shop-amber-light text-shop-amber-dark",
                )}
              >
                {a.badge}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-extrabold">{a.title}</p>
                <p className="text-text-muted truncate text-[13px]">{a.sub}</p>
              </div>
              {a.href ? (
                <Link href={a.href} className={CTA}>
                  {a.cta} ›
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => a.tab && onSelectTab(a.tab, a.anchor)}
                  className={cn(CTA, "cursor-pointer")}
                >
                  {a.cta} ›
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
