"use client";

import { useState } from "react";
import Link from "next/link";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { DailySeriesChart } from "@/components/dashboard/daily-series-chart";
import { Funnel } from "@/components/dashboard/funnel";
import { InfoPopover } from "@/components/dashboard/info-popover";
import { KpiCard } from "@/components/dashboard/kpi-card";
import type { RangeSelect } from "@/components/dashboard/perf-chart";
import { REFRESH_MS } from "@/components/dashboard/perf-panel";
import { Card, CardTitle, ErrorState, LoadingState, ProgressBar } from "@/components/dashboard/ui";
import {
  NUMBER,
  REPORT_STATUS,
  Row,
  useBusinessMetrics,
} from "@/components/dashboard/usage-business";
import { metricsApi, type SignDifficulty } from "@/lib/api/metrics";
import type { DateTimeRange } from "@/lib/datetime-range";

/** Learning & content query (per-course, hardest lessons, vocabulary, reports, imports). */
function useLearningMetrics(range: DateTimeRange, live: boolean, courseIds: string[]) {
  return useQuery({
    queryKey: ["admin", "metrics", "learning", range.from, range.to, ...courseIds],
    queryFn: () =>
      metricsApi.learning({
        from: range.from,
        to: range.to,
        courseIds: courseIds.length > 0 ? courseIds : undefined,
      }),
    enabled: Boolean(range.from && range.to),
    placeholderData: keepPreviousData,
    refetchInterval: live ? REFRESH_MS : false,
  });
}

/** Multi-select course filter pill list, with a published-course count caption. */
function CourseFilter({
  courses,
  selected,
  onChange,
}: {
  courses: { courseId: string; courseName: string }[];
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  if (courses.length === 0) return null;
  const allSelected = selected.length === 0;

  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => onChange([])}
        className={`rounded-full px-3 py-1 text-[13px] font-bold transition-colors ${
          allSelected
            ? "bg-primary text-white"
            : "border-border text-text-muted hover:border-primary hover:text-primary border"
        }`}
      >
        Todos los cursos
      </button>
      {courses.map((c) => {
        const active = selected.includes(c.courseId);
        return (
          <button
            key={c.courseId}
            type="button"
            onClick={() => toggle(c.courseId)}
            className={`rounded-full px-3 py-1 text-[13px] font-bold transition-colors ${
              active
                ? "bg-primary text-white"
                : "border-border text-text-muted hover:border-primary hover:text-primary border"
            }`}
          >
            {c.courseName}
          </button>
        );
      })}
      <span className="text-text-muted ml-auto text-[13px]">
        {NUMBER.format(courses.length)}{" "}
        {courses.length === 1 ? "curso publicado" : "cursos publicados"}
      </span>
    </div>
  );
}

type ReviewLesson = {
  lessonId: string;
  lessonName: string;
  evaluated: number;
  accuracyPercent: number;
  abandonmentPercent: number | null;
};

/**
 * "Contenido a revisar": one table with a lecciones ↔ señas toggle, ranked by lowest accuracy /
 * highest error, each row linking to where it's fixed (courses / sign reports). Replaces scanning
 * several separate difficulty rankings to decide what needs attention.
 */
function ContentToReview({ lessons, signs }: { lessons: ReviewLesson[]; signs: SignDifficulty[] }) {
  const [view, setView] = useState<"lessons" | "signs">("lessons");
  const rows = view === "lessons" ? lessons : signs;
  return (
    <Card className="flex min-w-0 flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2.5">
        <CardTitle>Contenido a revisar</CardTitle>
        <div className="border-border flex items-center rounded-full border p-0.5 text-xs font-extrabold">
          {(["lessons", "signs"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={`cursor-pointer rounded-full px-2.5 py-1 ${
                view === v ? "bg-primary-light text-primary-dark" : "text-text-muted"
              }`}
            >
              {v === "lessons" ? "Lecciones" : "Señas"}
            </button>
          ))}
        </div>
        <span className="text-text-muted ml-auto text-[13px]">
          Mínimo 30 intentos · ordenado por {view === "lessons" ? "menor precisión" : "mayor error"}
        </span>
      </div>
      {rows.length === 0 ? (
        <p className="text-text-muted text-sm">Sin contenido con muestra suficiente.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="text-text-muted text-left text-xs font-bold">
                <th className="pb-2 font-bold">{view === "lessons" ? "Lección" : "Seña"}</th>
                {view === "lessons" ? (
                  <th className="pb-2 pl-3 text-right font-bold">Abandono</th>
                ) : null}
                <th className="pb-2 pl-3 text-right font-bold">
                  {view === "lessons" ? "Precisión" : "Error"}
                </th>
                <th className="pb-2 pl-3 text-right font-bold">Intentos</th>
                <th className="pb-2 pl-3 text-right font-bold">Acción</th>
              </tr>
            </thead>
            <tbody>
              {view === "lessons"
                ? lessons.map((r) => (
                    <tr key={r.lessonId} className="border-fill border-t">
                      <td className="py-2 font-bold">{r.lessonName}</td>
                      <td className="text-shop-amber-dark py-2 pl-3 text-right font-extrabold">
                        {r.abandonmentPercent == null ? "—" : `${r.abandonmentPercent}%`}
                      </td>
                      <td className="py-2 pl-3 text-right font-extrabold">{r.accuracyPercent}%</td>
                      <td className="text-text-muted py-2 pl-3 text-right">
                        {NUMBER.format(r.evaluated)}
                      </td>
                      <td className="py-2 pl-3 text-right">
                        <Link
                          href="/admin/courses"
                          className="text-primary hover:text-primary-dark font-extrabold"
                        >
                          Abrir
                        </Link>
                      </td>
                    </tr>
                  ))
                : signs.map((s) => (
                    <tr key={s.sign} className="border-fill border-t">
                      <td className="py-2 font-bold">{s.sign}</td>
                      <td className="text-danger py-2 pl-3 text-right font-extrabold">
                        {s.errorPercent}%
                      </td>
                      <td className="text-text-muted py-2 pl-3 text-right">
                        {NUMBER.format(s.evaluated)}
                      </td>
                      <td className="py-2 pl-3 text-right">
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
        </div>
      )}
    </Card>
  );
}

/**
 * Aprendizaje & contenido. Four north-star KPIs (finalización de lecciones, tasa de éxito,
 * completitud de curso/s, señas aprendidas), the learning funnel and accuracy evolution, the
 * "Contenido a revisar" table, and accuracy by exercise type beside the sign-report summary.
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
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const learning = useLearningMetrics(range, live, selectedCourses);
  const business = useBusinessMetrics(range, live);

  if (learning.isPending || business.isPending)
    return <LoadingState>Cargando métricas de aprendizaje…</LoadingState>;
  if (learning.isError && !learning.data)
    return <ErrorState>No pudimos cargar las métricas de aprendizaje.</ErrorState>;

  const l = learning.data!;
  const b = business.data;

  // Completion over all user-course pairs that actually exist as enrollments (active + completed).
  const totalCompletions = l.courses.reduce((s, c) => s + c.completed, 0);
  const denominator = l.courses.reduce((s, c) => s + c.enrolled + c.completed, 0);
  const globalCompletionPercent =
    denominator > 0 ? Math.round((totalCompletions / denominator) * 1000) / 10 : 0;

  // Previous-window rates for the period-over-period deltas (pp), null for the whole history.
  const previousSuccessPercent =
    l.exercises.previousAttempted && l.exercises.previousAttempted > 0
      ? Math.round(((l.exercises.previousCorrect ?? 0) / l.exercises.previousAttempted) * 1000) / 10
      : null;
  const previousCompletionPercent =
    l.lessons.previousStarted && l.lessons.previousStarted > 0
      ? Math.round(((l.lessons.previousCompleted ?? 0) / l.lessons.previousStarted) * 1000) / 10
      : null;

  // Merge abandonment (from the lesson ranking) into the hardest-lessons list for the review table.
  const abandonmentByLesson = new Map(
    l.lessonRanking.map((r) => [r.lessonId, r.abandonmentPercent]),
  );
  const reviewLessons: ReviewLesson[] = l.hardestLessons.map((lesson) => ({
    lessonId: lesson.lessonId,
    lessonName: lesson.lessonName,
    evaluated: lesson.evaluated,
    accuracyPercent: lesson.accuracyPercent,
    abandonmentPercent: abandonmentByLesson.get(lesson.lessonId) ?? null,
  }));
  const hardestSignsByError = l.hardestSigns ?? [];

  return (
    <div className="flex flex-col gap-6">
      <CourseFilter courses={l.courses} selected={selectedCourses} onChange={setSelectedCourses} />

      {/* ¿La gente aprende LSA? Finalización, éxito, completitud de cursos y vocabulario. */}
      <div className="grid [grid-template-columns:repeat(auto-fit,minmax(200px,1fr))] gap-3">
        <KpiCard
          metric="lesson_completion_rate"
          value={l.lessons.started ? `${l.lessons.completionPercent}%` : "—"}
          current={l.lessons.started ? l.lessons.completionPercent : undefined}
          previous={previousCompletionPercent}
          mode="pp"
          hint={`${NUMBER.format(l.lessons.completed)} de ${NUMBER.format(l.lessons.started)} iniciadas`}
        />
        <KpiCard
          metric="exercise_success_rate"
          value={l.exercises.attempted ? `${l.exercises.successPercent}%` : "—"}
          current={l.exercises.attempted ? l.exercises.successPercent : undefined}
          previous={previousSuccessPercent}
          mode="pp"
          spark={l.dailyAccuracy.map((d) => d.accuracyPercent)}
          hint={`${l.exercises.averageAttempts} intentos por ejercicio`}
        />
        <KpiCard
          metric="global_course_completion"
          value={denominator > 0 ? `${globalCompletionPercent}%` : "—"}
          hint={`${NUMBER.format(totalCompletions)} de ${NUMBER.format(denominator)} inscripciones`}
        />
        <KpiCard
          metric="vocabulary_growth"
          value={NUMBER.format(l.learnedSigns)}
          spark={l.learnedSignsDaily.map((d) => d.count)}
          hint="Señas nuevas incorporadas en el período"
        />
      </div>

      {/* Embudo de aprendizaje + evolución de aciertos. */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Funnel
          title="Embudo de aprendizaje"
          metric="learning_funnel"
          subtitle="Dónde se pierden los usuarios en el recorrido"
          steps={l.onboardingFunnel.map((s) => ({ key: s.key, count: s.count }))}
        />
        <DailySeriesChart
          title="Respuestas correctas"
          metric="accuracy_evolution"
          points={l.dailyAccuracy.map((d) => ({ t: d.day, value: d.accuracyPercent }))}
          format={(v) => `${v}%`}
          range={range}
          dayResolution
          emptyAsNull
          onSelectRange={onSelectRange}
        />
      </div>

      <ContentToReview lessons={reviewLessons} signs={hardestSignsByError} />

      <div className="grid gap-4 lg:grid-cols-2">
        {b ? (
          <Card className="flex min-w-0 flex-col gap-3">
            <div className="flex items-center gap-1.5">
              <CardTitle>Precisión por tipo de ejercicio</CardTitle>
              <InfoPopover metric="accuracy_by_type" className="ml-auto" />
            </div>
            <p className="text-text-muted -mt-1.5 text-[13px]">Menor precisión primero</p>
            {b.accuracy.byBlockType.length === 0 ? (
              <p className="text-text-muted text-sm">Sin ejercicios evaluados.</p>
            ) : (
              <ul className="flex flex-col gap-2.5">
                {[...b.accuracy.byBlockType]
                  .sort((x, y) => x.accuracyPercent - y.accuracyPercent)
                  .map((bt) => (
                    <li key={bt.type} className="flex flex-col gap-1">
                      <div className="flex justify-between text-[13px] font-bold">
                        <span className="truncate">{bt.type}</span>
                        <span>{bt.accuracyPercent}%</span>
                      </div>
                      <ProgressBar percent={bt.accuracyPercent} />
                    </li>
                  ))}
              </ul>
            )}
          </Card>
        ) : null}

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
            {b ? (
              <div>
                <p className="font-display text-danger text-3xl font-extrabold tracking-tight">
                  {NUMBER.format(b.errors.pendingSignReports)}
                </p>
                <p className="text-text-muted text-[13px] font-bold">Pendientes</p>
              </div>
            ) : null}
            <div>
              <p className="font-display text-3xl font-extrabold tracking-tight">
                {NUMBER.format(l.reports.resolvedCount)}
              </p>
              <p className="text-text-muted text-[13px] font-bold">Resueltos</p>
            </div>
            {l.reports.averageResolutionHours > 0 ? (
              <div>
                <p className="font-display text-3xl font-extrabold tracking-tight">
                  {l.reports.averageResolutionHours} h
                </p>
                <p className="text-text-muted text-[13px] font-bold">Resolución prom.</p>
              </div>
            ) : null}
          </div>
          {l.reports.mostReported.length > 0 ? (
            <dl className="border-fill flex flex-col border-t pt-1">
              {l.reports.mostReported.map((m) => (
                <div
                  key={m.meaning}
                  className="border-fill flex justify-between gap-3 border-b py-2 text-sm last:border-b-0"
                >
                  <dt className="font-bold">{m.meaning}</dt>
                  <dd className="text-text-muted shrink-0">
                    {NUMBER.format(m.count)} reporte{m.count !== 1 ? "s" : ""}
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}
          {b && b.errors.signReportsByStatus.length > 0 ? (
            <dl className="flex flex-col">
              {b.errors.signReportsByStatus.map((item) => (
                <Row
                  key={item.key}
                  label={REPORT_STATUS[item.key] ?? item.key}
                  value={item.count}
                />
              ))}
            </dl>
          ) : null}
        </Card>
      </div>
    </div>
  );
}
