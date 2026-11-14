"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { DailySeriesChart } from "@/components/dashboard/daily-series-chart";
import { Funnel } from "@/components/dashboard/funnel";
import { Icon } from "@/components/dashboard/icons";
import { InfoPopover } from "@/components/dashboard/info-popover";
import { KpiCard, KpiRow } from "@/components/dashboard/kpi-card";
import type { RangeSelect } from "@/components/dashboard/perf-chart";
import {
  Card,
  CardTitle,
  ErrorState,
  headerChip,
  LoadingState,
  ProgressBar,
} from "@/components/dashboard/ui";
import { NUMBER } from "@/components/dashboard/usage-business";
import { pct0, pct1, rate1, rateOrNull } from "@/components/dashboard/usage-math";
import {
  useBusinessQuery,
  useGrowthQuery,
  useLearningQuery,
} from "@/components/dashboard/usage-queries";
import type { LearningMetrics, LessonReview, SignDifficulty } from "@/lib/api/metrics";
import { courseLessonHref } from "@/lib/course-deep-link";
import { previousRange, type DateTimeRange } from "@/lib/datetime-range";
import { cn } from "@/lib/utils";

/** Spanish names for the exercise (block) types. */
export const BLOCK_TYPE_LABEL: Record<string, string> = {
  SELECT_MEANING: "Elegir el significado",
  SELECT_SIGN: "Elegir la seña",
  PERFORM_SIGN: "Hacer la seña (cámara)",
  SPELL_NAME: "Deletrear nombre (cámara)",
  VISUAL_RECOGNITION: "Reconocer señas (cámara)",
  MATCH: "Unir pares",
  CONTEXT_RESPONSE: "Responder en contexto",
  INVISIBLE_SIGNS: "Señas invisibles",
  INTRODUCE_SIGN: "Presentar seña",
  INFO: "Información",
};

/** Course completion over enrollments still in progress or completed, at the window's close. */
export function courseCompletion(
  courses: LearningMetrics["courses"],
  courseIds: string[],
): { completed: number; enrollments: number; percent: number | null } {
  const scoped = courseIds.length ? courses.filter((c) => courseIds.includes(c.courseId)) : courses;
  const completed = scoped.reduce((s, c) => s + c.completed, 0);
  const enrollments = scoped.reduce((s, c) => s + c.enrolled + c.completed, 0);
  return { completed, enrollments, percent: enrollments ? rate1(completed, enrollments) : null };
}

/** Abandonment tint: ≥ 40 % danger, ≥ 30 % warning. */
function abandonmentClass(p: number): string {
  if (p >= 40) return "text-danger font-extrabold";
  if (p >= 30) return "text-shop-amber-dark font-extrabold";
  return "font-bold";
}

/** Accuracy tint: < 60 % danger, < 75 % warning. */
function accuracyClass(p: number): string {
  if (p < 60) return "text-danger font-extrabold";
  if (p < 75) return "text-shop-amber-dark font-extrabold";
  return "font-bold";
}

/** Course picker: a single select like the organizations panel's (all courses or one). */
function CoursePicker({
  courses,
  value,
  onChange,
}: {
  courses: { courseId: string; courseName: string }[];
  value: string | null;
  onChange: (id: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (
        e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)
      )
        setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  const current = courses.find((c) => c.courseId === value);
  const options = [{ courseId: null, courseName: "Todos los cursos" }, ...courses];
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div ref={ref} className="relative">
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={menuId}
          onClick={() => setOpen((o) => !o)}
          className={cn(
            headerChip,
            "border-border bg-surface text-text cursor-pointer border transition-shadow hover:shadow-sm",
          )}
        >
          <Icon name="book" className="size-4" />
          <span className="max-w-[220px] truncate">
            {current?.courseName ?? "Todos los cursos"}
          </span>
          <Icon
            name="chevronDown"
            className={cn("size-3.5 transition-transform", open && "rotate-180")}
          />
        </button>
        {open ? (
          <ul
            id={menuId}
            role="listbox"
            aria-label="Curso"
            className="border-border bg-surface dash-card-enter absolute left-0 z-30 mt-2 flex w-64 flex-col gap-0.5 rounded-2xl border p-1.5 shadow-lg"
          >
            {options.map((o) => {
              const selected = (value ?? null) === o.courseId;
              return (
                <li key={o.courseId ?? "all"} role="option" aria-selected={selected}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(o.courseId);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-bold transition-colors",
                      selected ? "bg-primary-light text-primary-dark" : "hover:bg-fill text-text",
                    )}
                  >
                    <span className="truncate">{o.courseName}</span>
                    {selected ? <Icon name="check" className="size-4" /> : null}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
      <span className="text-text-muted text-[13px]">
        {NUMBER.format(courses.length)}{" "}
        {courses.length === 1 ? "curso publicado" : "cursos publicados"}
      </span>
    </div>
  );
}

/**
 * "Contenido a revisar": one table (lecciones ↔ señas) with every signal side by side — abandonment,
 * accuracy, attempts, pending reports — and a direct link to where it's fixed.
 */
function ContentToReview({ lessons, signs }: { lessons: LessonReview[]; signs: SignDifficulty[] }) {
  const [view, setView] = useState<"lessons" | "signs">("lessons");
  const empty = view === "lessons" ? lessons.length === 0 : signs.length === 0;
  return (
    <Card className="flex min-w-0 flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2.5">
        <CardTitle>Contenido a revisar</CardTitle>
        <div
          role="group"
          aria-label="Tipo de contenido"
          className="border-border flex h-7 items-center rounded-full border p-0.5 text-[11px] font-extrabold"
        >
          {(["lessons", "signs"] as const).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={view === v}
              onClick={() => setView(v)}
              className={cn(
                "h-6 cursor-pointer rounded-full px-2.5",
                view === v ? "bg-primary-light text-primary-dark" : "text-text-muted",
              )}
            >
              {v === "lessons" ? "Lecciones" : "Señas"}
            </button>
          ))}
        </div>
        <span className="text-text-muted ml-auto text-[13px]">
          {view === "lessons"
            ? "Mínimo 30 intentos · ordenado por abandono"
            : "Ordenado por mayor error"}
        </span>
      </div>
      {empty ? (
        <p className="text-text-muted text-sm">
          Sin contenido con muestra suficiente en el período.
        </p>
      ) : (
        <div className="overflow-x-auto">
          {view === "lessons" ? (
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="text-text-muted text-left text-xs font-bold">
                  <th className="pb-2 font-bold">Lección</th>
                  <th className="pb-2 pl-3 font-bold">Curso</th>
                  <th className="pb-2 pl-3 text-right font-bold">Abandono</th>
                  <th className="pb-2 pl-3 text-right font-bold">Precisión</th>
                  <th className="pb-2 pl-3 text-right font-bold">Intentos</th>
                  <th className="pb-2 pl-3 text-right font-bold">Reportes</th>
                  <th className="pb-2 pl-3">
                    <span className="sr-only">Acción</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {lessons.map((r) => (
                  <tr key={r.lessonId} className="border-fill border-t">
                    <td className="py-2.5 font-extrabold">{r.lessonName}</td>
                    <td className="text-text-muted py-2.5 pl-3">{r.courseName}</td>
                    <td
                      className={cn(
                        "py-2.5 pl-3 text-right",
                        abandonmentClass(r.abandonmentPercent),
                      )}
                    >
                      {pct0(r.abandonmentPercent)}
                    </td>
                    <td className={cn("py-2.5 pl-3 text-right", accuracyClass(r.accuracyPercent))}>
                      {pct0(r.accuracyPercent)}
                    </td>
                    <td className="py-2.5 pl-3 text-right font-bold">
                      {NUMBER.format(r.evaluated)}
                    </td>
                    <td
                      className={cn(
                        "py-2.5 pl-3 text-right",
                        r.pendingReports >= 3 ? "text-danger font-extrabold" : "font-bold",
                      )}
                    >
                      {NUMBER.format(r.pendingReports)}
                    </td>
                    <td className="py-2.5 pl-3 text-right">
                      <Link
                        href={courseLessonHref(r.courseId, r.lessonId)}
                        className="text-primary hover:text-primary-dark font-extrabold"
                      >
                        Abrir
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full min-w-[480px] border-collapse text-sm">
              <thead>
                <tr className="text-text-muted text-left text-xs font-bold">
                  <th className="pb-2 font-bold">Seña</th>
                  <th className="pb-2 pl-3 text-right font-bold">Error</th>
                  <th className="pb-2 pl-3 text-right font-bold">Precisión</th>
                  <th className="pb-2 pl-3 text-right font-bold">Intentos</th>
                  <th className="pb-2 pl-3">
                    <span className="sr-only">Acción</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {signs.map((s) => (
                  <tr key={s.sign} className="border-fill border-t">
                    <td className="py-2.5 font-extrabold">{s.sign}</td>
                    <td className="text-danger py-2.5 pl-3 text-right font-extrabold">
                      {pct0(s.errorPercent)}
                    </td>
                    <td
                      className={cn("py-2.5 pl-3 text-right", accuracyClass(100 - s.errorPercent))}
                    >
                      {pct0(100 - s.errorPercent)}
                    </td>
                    <td className="py-2.5 pl-3 text-right font-bold">
                      {NUMBER.format(s.evaluated)}
                    </td>
                    <td className="py-2.5 pl-3 text-right">
                      <Link
                        href="/admin/sign-reports"
                        className="text-primary hover:text-primary-dark font-extrabold"
                      >
                        Abrir
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </Card>
  );
}

/**
 * Aprendizaje — "¿La gente aprende LSA?". A course selector, four KPIs with period-over-period
 * deltas, the learning funnel (biggest drop flagged) beside the accuracy evolution (previous window
 * dashed), "Contenido a revisar", accuracy by exercise type and the sign-report summary.
 */
export function LearningTab({
  range,
  live,
  onSelectRange,
}: {
  range: DateTimeRange;
  live: boolean;
  onSelectRange: RangeSelect;
}) {
  const [courseId, setCourseId] = useState<string | null>(null);
  const courseIds = courseId ? [courseId] : [];
  const prev = previousRange(range);
  const learning = useLearningQuery(range, live, courseIds);
  const previous = useLearningQuery(prev, live, courseIds);
  const business = useBusinessQuery(range, live);
  const growth = useGrowthQuery(range, live);

  if (learning.isPending) return <LoadingState>Cargando métricas de aprendizaje…</LoadingState>;
  if (!learning.data)
    return <ErrorState>No pudimos cargar las métricas de aprendizaje.</ErrorState>;

  const l = learning.data;
  const pl = previous.data;
  const b = business.data;
  const activeUsers = growth.data?.engagement.activeInRange ?? 0;

  const completion = courseCompletion(l.courses, courseIds);
  const prevCompletion = pl ? courseCompletion(pl.courses, courseIds) : null;
  const prevLessonRate = rateOrNull(l.lessons.previousCompleted, l.lessons.previousStarted);
  const prevSuccess = rateOrNull(l.exercises.previousCorrect, l.exercises.previousAttempted);

  return (
    <div className="flex flex-col gap-5">
      <CoursePicker courses={l.courses} value={courseId} onChange={setCourseId} />

      <KpiRow>
        <KpiCard
          metric="lesson_completion_rate"
          value={l.lessons.started ? pct1(l.lessons.completionPercent) : "—"}
          toneValue={l.lessons.started ? l.lessons.completionPercent : null}
          delta={
            l.lessons.started
              ? { current: l.lessons.completionPercent, previous: prevLessonRate, mode: "pp" }
              : undefined
          }
          hint={`${NUMBER.format(l.lessons.completed)} de ${NUMBER.format(l.lessons.started)} iniciadas`}
        />
        <KpiCard
          metric="exercise_success_rate"
          value={l.exercises.attempted ? pct1(l.exercises.successPercent) : "—"}
          toneValue={l.exercises.attempted ? l.exercises.successPercent : null}
          delta={
            l.exercises.attempted
              ? { current: l.exercises.successPercent, previous: prevSuccess, mode: "pp" }
              : undefined
          }
          hint={`${l.exercises.averageAttempts.toLocaleString("es-AR")} intentos por ejercicio`}
          spark={l.dailyAccuracy.map((d) => d.accuracyPercent)}
        />
        <KpiCard
          metric="global_course_completion"
          value={completion.percent == null ? "—" : pct1(completion.percent)}
          delta={
            completion.percent == null
              ? undefined
              : { current: completion.percent, previous: prevCompletion?.percent, mode: "pp" }
          }
          hint={`${NUMBER.format(completion.completed)} de ${NUMBER.format(completion.enrollments)} inscripciones`}
        />
        <KpiCard
          metric="vocabulary_growth"
          value={NUMBER.format(l.learnedSigns)}
          delta={{ current: l.learnedSigns, previous: pl?.learnedSigns }}
          hint={
            activeUsers > 0
              ? `${(Math.round((l.learnedSigns / activeUsers) * 10) / 10).toLocaleString("es-AR")} por usuario activo`
              : "Señas nuevas incorporadas en el período"
          }
          spark={l.learnedSignsDaily.map((d) => d.count)}
        />
      </KpiRow>

      <div className="grid gap-4 lg:grid-cols-2">
        <Funnel
          title="Embudo de aprendizaje"
          metric="learning_funnel"
          steps={l.onboardingFunnel.map((s) => ({ key: s.key, count: s.count }))}
        />
        <DailySeriesChart
          title="Respuestas correctas"
          metric="accuracy_evolution"
          seriesLabel="Precisión diaria"
          showKindToggle={false}
          points={l.dailyAccuracy.map((d) => ({ t: d.day, value: d.accuracyPercent }))}
          previous={pl?.dailyAccuracy.map((d) => ({ t: d.day, value: d.accuracyPercent }))}
          format={(v) => `${Math.round(v)}%`}
          range={range}
          dayResolution
          emptyAsNull
          onSelectRange={onSelectRange}
        />
      </div>

      <ContentToReview lessons={l.lessonsToReview ?? []} signs={l.hardestSigns ?? []} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="flex min-w-0 flex-col gap-3">
          <div className="flex items-center gap-1.5">
            <CardTitle>Precisión por tipo de ejercicio</CardTitle>
            <InfoPopover metric="accuracy_by_type" className="ml-auto" />
          </div>
          {!b ? (
            <LoadingState />
          ) : b.accuracy.byBlockType.length === 0 ? (
            <p className="text-text-muted text-sm">Sin ejercicios evaluados.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {[...b.accuracy.byBlockType]
                .sort((x, y) => x.accuracyPercent - y.accuracyPercent)
                .map((bt) => (
                  <li key={bt.type} className="flex flex-col gap-1.5">
                    <div className="flex justify-between gap-2 text-[13px] font-extrabold">
                      <span className="truncate">{BLOCK_TYPE_LABEL[bt.type] ?? bt.type}</span>
                      <span>{pct0(bt.accuracyPercent)}</span>
                    </div>
                    <ProgressBar
                      percent={bt.accuracyPercent}
                      tone={bt.accuracyPercent >= 80 ? "success" : "primary"}
                      label={`Precisión de ${BLOCK_TYPE_LABEL[bt.type] ?? bt.type}`}
                    />
                  </li>
                ))}
            </ul>
          )}
        </Card>

        <Card className="flex min-w-0 flex-col gap-3">
          <div className="flex items-center gap-1.5">
            <CardTitle>Reportes de señas</CardTitle>
            <Link
              href="/admin/sign-reports"
              className="text-primary hover:text-primary-dark ml-auto text-[13px] font-extrabold"
            >
              Ver reportes
            </Link>
            <InfoPopover metric="sign_report_resolution" />
          </div>
          <div className="flex flex-wrap gap-x-8 gap-y-3">
            <div>
              <p
                className={cn(
                  "font-display text-[32px] leading-9 font-extrabold tracking-tight",
                  b && b.errors.pendingSignReports > 0 ? "text-danger" : "",
                )}
              >
                {b ? NUMBER.format(b.errors.pendingSignReports) : "—"}
              </p>
              <p className="text-text-muted text-[13px]">Pendientes</p>
            </div>
            <div>
              <p className="font-display text-[32px] leading-9 font-extrabold tracking-tight">
                {NUMBER.format(l.reports.resolvedCount)}
              </p>
              <p className="text-text-muted text-[13px]">Resueltos</p>
            </div>
            <div>
              <p className="font-display text-[32px] leading-9 font-extrabold tracking-tight">
                {l.reports.resolvedCount
                  ? `${Math.round(l.reports.averageResolutionHours).toLocaleString("es-AR")} h`
                  : "—"}
              </p>
              <p className="text-text-muted text-[13px]">Resolución prom.</p>
            </div>
          </div>
          {l.reports.mostReported.length > 0 ? (
            <dl className="border-fill flex flex-col border-t">
              {l.reports.mostReported.slice(0, 3).map((m) => (
                <div
                  key={m.meaning}
                  className="border-fill flex justify-between gap-3 border-b py-2.5 text-sm last:border-b-0"
                >
                  <dt className="font-extrabold">{m.meaning}</dt>
                  <dd className="text-text-muted shrink-0">
                    {NUMBER.format(m.count)} {m.count === 1 ? "reporte" : "reportes"}
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}
        </Card>
      </div>
    </div>
  );
}
