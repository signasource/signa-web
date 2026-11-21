"use client";

import { useCallback, useState, type ReactNode } from "react";
import { BreakdownPie } from "@/components/dashboard/breakdown-pie";
import { InfoPopover } from "@/components/dashboard/info-popover";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { RevenueBySourceChart } from "@/components/dashboard/revenue-by-source-chart";
import type { RangeSelect } from "@/components/dashboard/perf-chart";
import { fmtMoney, fmtMoneyCompact } from "@/components/dashboard/perf-format";
import { SalesListDialog } from "@/components/dashboard/sales-list-dialog";
import { salesTotals, type SalesView } from "@/components/dashboard/sales-math";
import { Card, CardTitle, ErrorState, LoadingState } from "@/components/dashboard/ui";
import { NUMBER } from "@/components/dashboard/usage-business";
import { pct1 } from "@/components/dashboard/usage-math";
import { useGrowthQuery, useSalesQuery } from "@/components/dashboard/usage-queries";
import type { CoursePopularity, CourseRevenue, GemSource } from "@/lib/api/metrics";
import { previousRange, type DateTimeRange } from "@/lib/datetime-range";
import { refundReasonLabel } from "@/lib/refund-reasons";

/** How the "Origen de las gemas" pie names each source. */
const GEM_SOURCE_LABEL: Record<GemSource["source"], string> = {
  CHALLENGES: "Desafíos",
  ACHIEVEMENTS: "Logros",
  PURCHASED: "Compradas",
};

/** Growth & business snapshot query — shared by the Resumen, Negocio and Usuarios tabs. */
export function useGrowthMetrics(range: DateTimeRange, live: boolean) {
  return useGrowthQuery(range, live);
}

/**
 * The Negocio grid: every row shares the same three columns on wide screens, so the counters line
 * up with the same width (column 1) and the widgets beside them split the rest evenly. A single
 * widget (`wide`) spans columns 2–3; two widgets take one each. Stacks on narrow screens.
 */
const NEGOCIO_COLUMNS =
  "grid items-stretch gap-4 lg:grid-cols-2 xl:grid-cols-[minmax(200px,1fr)_minmax(0,1.6fr)_minmax(0,1.6fr)]";

function KpiBeside({
  kpi,
  children,
  wide = false,
}: {
  kpi: ReactNode;
  children: ReactNode;
  /** One widget spanning both columns beside the counter. */
  wide?: boolean;
}) {
  return (
    <div className={NEGOCIO_COLUMNS}>
      {kpi}
      {wide ? <div className="flex min-w-0 xl:col-span-2 [&>*]:flex-1">{children}</div> : children}
    </div>
  );
}

/**
 * Negocio, as three rows that each pair a counter with its breakdown: **Ingresos** beside income by
 * source (a compact chart); **Tasa de reembolsos**, the refund reasons and where the users' gems
 * came from as one row of three; then the most popular courses beside the income per course.
 * The counters come from the sales detail (`/admin/metrics/sales`): Ingresos and Tasa de
 * reembolsos open the purchases behind them. The source chart comes from the growth snapshot.
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
  const sales = useSalesQuery(range, live);
  const previousSales = useSalesQuery(previousRange(range), live);
  const [openView, setOpenView] = useState<SalesView | null>(null);
  const closeList = useCallback(() => setOpenView(null), []);

  if (query.isPending) return <LoadingState>Cargando métricas de negocio…</LoadingState>;
  if (!query.data) return <ErrorState>No pudimos cargar las métricas de negocio.</ErrorState>;
  const g = query.data;

  // The sales-backed widgets wait for (or report) the sales query on their own.
  const s = sales.data;
  const salesState = sales.isPending ? (
    <Card>
      <LoadingState>Cargando ventas…</LoadingState>
    </Card>
  ) : (
    <Card>
      <ErrorState>No pudimos cargar las ventas del período.</ErrorState>
    </Card>
  );
  const t = s ? salesTotals(s.sales) : null;
  const p = previousSales.data ? salesTotals(previousSales.data.sales) : null;

  return (
    <div className="flex flex-col gap-4">
      <KpiBeside
        wide
        kpi={
          t ? (
            <KpiCard
              metric="income"
              value={fmtMoneyCompact(t.net)}
              delta={{ current: t.net, previous: p?.net }}
              onOpen={() => setOpenView("income")}
            />
          ) : (
            salesState
          )
        }
      >
        <RevenueBySourceChart
          title="Ingresos por fuente"
          height={150}
          metric="income"
          range={range}
          format={fmtMoneyCompact}
          onSelectRange={onSelectRange}
          sources={[
            {
              key: "orgs",
              label: "Organizaciones",
              color: "var(--color-primary)",
              points: g.revenue.dailyNet,
            },
            {
              key: "gems",
              label: "Gemas",
              color: "var(--color-gems-blue)",
              points: g.gems.dailyNet,
            },
            {
              key: "courses",
              label: "Cursos pagos",
              color: "var(--color-course-teal)",
              points: g.courseSales.dailyNet,
            },
          ]}
        />
      </KpiBeside>

      <KpiBeside
        kpi={
          t ? (
            <KpiCard
              metric="refund_rate"
              value={t.count ? pct1(t.refundRate) : "—"}
              toneValue={t.count ? t.refundRate : null}
              delta={
                t.count
                  ? {
                      current: t.refundRate,
                      previous: p && p.count ? p.refundRate : null,
                      mode: "pp",
                      good: "down",
                    }
                  : undefined
              }
              onOpen={() => setOpenView("refund_rate")}
            />
          ) : (
            salesState
          )
        }
      >
        {s ? (
          <BreakdownPie
            title="Motivos de reembolso"
            metric="refund_reasons"
            items={s.refundReasons.map((r) => ({
              label: refundReasonLabel(r.reason),
              value: r.count,
            }))}
          />
        ) : (
          salesState
        )}
        {s ? (
          <BreakdownPie
            title="Origen de las gemas"
            metric="gem_sources"
            items={s.gemSources.map((src) => ({
              label: GEM_SOURCE_LABEL[src.source],
              value: src.gems,
            }))}
          />
        ) : (
          salesState
        )}
      </KpiBeside>

      {s ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <PopularCoursesCard rows={s.popularCourses} />
          <CourseRevenueCard rows={s.courseRevenue} />
        </div>
      ) : null}

      {openView && s ? (
        <SalesListDialog view={openView} sales={s.sales} onClose={closeList} />
      ) : null}
    </div>
  );
}

/** How many rows a ranking shows before the "Ver más" toggle. */
const RANKING_PREVIEW = 8;

/** The "Ver los N" / "Ver menos" toggle under a long ranking. */
function useExpandable<T>(rows: T[]) {
  const [expanded, setExpanded] = useState(false);
  const canExpand = rows.length > RANKING_PREVIEW;
  return {
    visible: expanded ? rows : rows.slice(0, RANKING_PREVIEW),
    toggle: canExpand ? (
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="text-primary hover:text-primary-dark mt-3 cursor-pointer text-[13px] font-extrabold"
      >
        {expanded ? "Ver menos" : `Ver los ${NUMBER.format(rows.length)} cursos`}
      </button>
    ) : null,
  };
}

/**
 * Courses ranked by the people who joined them in the window: organization seats activated plus
 * individuals (paid orders and free self-enrollments). The table is its own text alternative.
 */
function PopularCoursesCard({ rows }: { rows: CoursePopularity[] }) {
  const { visible, toggle } = useExpandable(rows);
  return (
    <Card className="min-w-0">
      <div className="flex items-start justify-between gap-2">
        <CardTitle>Cursos más populares</CardTitle>
        <InfoPopover metric="popular_courses" />
      </div>
      {rows.length === 0 ? (
        <p className="text-text-muted mt-3 text-sm">Nadie se sumó a un curso en este período.</p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="text-text-muted text-left text-xs font-bold">
                <th className="pb-2 font-bold">Curso</th>
                <th className="pb-2 pl-3 text-right font-bold">Organizaciones</th>
                <th className="pb-2 pl-3 text-right font-bold">Individuales</th>
                <th className="pb-2 pl-3 text-right font-bold">Total</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((c) => (
                <tr key={c.courseId} className="border-fill border-t">
                  <td className="py-2.5 font-extrabold">{c.courseName}</td>
                  <td className="py-2.5 pl-3 text-right">{NUMBER.format(c.orgSeats)}</td>
                  <td className="py-2.5 pl-3 text-right">{NUMBER.format(c.individual)}</td>
                  <td className="py-2.5 pl-3 text-right font-extrabold">
                    {NUMBER.format(c.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {toggle}
        </div>
      )}
    </Card>
  );
}

/** Income per course (seat purchases + individual orders), refunded purchases left out. */
function CourseRevenueCard({ rows }: { rows: CourseRevenue[] }) {
  const { visible, toggle } = useExpandable(rows);
  return (
    <Card className="min-w-0">
      <div className="flex items-start justify-between gap-2">
        <CardTitle>Ingresos por curso</CardTitle>
        <InfoPopover metric="course_revenue" />
      </div>
      {rows.length === 0 ? (
        <p className="text-text-muted mt-3 text-sm">
          Ningún curso generó ingresos en este período.
        </p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="text-text-muted text-left text-xs font-bold">
                <th className="pb-2 font-bold">Curso</th>
                <th className="pb-2 pl-3 text-right font-bold">Organizaciones</th>
                <th className="pb-2 pl-3 text-right font-bold">Individuales</th>
                <th className="pb-2 pl-3 text-right font-bold">Total</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((c) => (
                <tr key={c.courseId} className="border-fill border-t">
                  <td className="py-2.5 font-extrabold">{c.courseName}</td>
                  <td className="py-2.5 pl-3 text-right whitespace-nowrap">
                    {fmtMoney(c.orgAmount)}
                  </td>
                  <td className="py-2.5 pl-3 text-right whitespace-nowrap">
                    {fmtMoney(c.individualAmount)}
                  </td>
                  <td className="py-2.5 pl-3 text-right font-extrabold whitespace-nowrap">
                    {fmtMoney(c.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {toggle}
        </div>
      )}
    </Card>
  );
}
