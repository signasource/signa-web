"use client";

import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { DailySeriesChart } from "@/components/dashboard/daily-series-chart";
import { Funnel } from "@/components/dashboard/funnel";
import { GoldenRow, GoldenTile } from "@/components/dashboard/golden-row";
import { InfoPopover } from "@/components/dashboard/info-popover";
import type { MetricId } from "@/components/dashboard/metric-catalog";
import type { RangeSelect } from "@/components/dashboard/perf-chart";
import { fmtCount } from "@/components/dashboard/perf-format";
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

/** Multi-select course filter pill list. */
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
      const next = selected.filter((s) => s !== id);
      onChange(next);
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-text-muted text-[13px] font-bold">Filtrar por curso:</span>
      <button
        type="button"
        onClick={() => onChange([])}
        className={`rounded-full px-3 py-1 text-[13px] font-bold transition-colors ${
          allSelected
            ? "bg-primary text-white"
            : "border-border text-text-muted hover:border-primary hover:text-primary border"
        }`}
      >
        Todos
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
    </div>
  );
}

/** Signs ranked by a chosen metric — error rate or retries. */
function SignRanking({
  title,
  metric,
  signs,
  value,
  percent,
  subtitle,
}: {
  title: string;
  metric: MetricId;
  signs: SignDifficulty[];
  value: (s: SignDifficulty) => string;
  percent: (s: SignDifficulty) => number;
  subtitle?: string;
}) {
  return (
    <Card className="flex min-w-0 flex-col gap-3">
      <div className="flex items-center gap-1.5">
        <CardTitle>{title}</CardTitle>
        <InfoPopover metric={metric} className="ml-auto" />
      </div>
      {subtitle ? <p className="text-text-muted -mt-1.5 text-[13px]">{subtitle}</p> : null}
      {signs.length === 0 ? (
        <p className="text-text-muted text-sm">Sin señas con muestra suficiente.</p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {signs.map((s) => (
            <li key={s.sign} className="flex flex-col gap-1">
              <div className="flex justify-between gap-2 text-[13px] font-bold">
                <span className="truncate">{s.sign}</span>
                <span className="shrink-0">{value(s)}</span>
              </div>
              <ProgressBar percent={percent(s)} tone="warning" />
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

/**
 * Aprendizaje & contenido. Completion (global, funnel and per course), accuracy (global + per block
 * type), the hardest lessons, vocabulary growth, and content-quality signals (sign-report resolution,
 * most-reported signs). Golden tiles summarise learning health up top.
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

  // Completion over all user-course pairs that actually exist as enrollments (active + completed),
  // not totalUsers × totalCourses — users without access to paid courses would inflate that.
  const totalCompletions = l.courses.reduce((s, c) => s + c.completed, 0);
  const denominator = l.courses.reduce((s, c) => s + c.enrolled + c.completed, 0);
  const globalCompletionPercent =
    denominator > 0 ? Math.round((totalCompletions / denominator) * 1000) / 10 : 0;

  const hardestSignsByError = l.hardestSigns ?? [];
  const hardestSignsByRetries = [...(l.hardestSigns ?? [])].sort(
    (a, b) => b.averageAttempts - a.averageAttempts,
  );

  return (
    <div className="flex flex-col gap-6">
      <CourseFilter courses={l.courses} selected={selectedCourses} onChange={setSelectedCourses} />

      {/* ¿La gente aprende LSA? Progreso de lecciones y ejercicios. */}
      <GoldenRow>
        <GoldenTile
          metric="exercise_success_rate"
          value={l.exercises.attempted ? `${l.exercises.successPercent}%` : "—"}
          rawValue={l.exercises.attempted ? l.exercises.successPercent : null}
          hint={`${NUMBER.format(l.exercises.correct)} / ${NUMBER.format(l.exercises.attempted)} ejercicios`}
        />
        <GoldenTile
          metric="lesson_completion_rate"
          value={l.lessons.started ? `${l.lessons.completionPercent}%` : "—"}
          rawValue={l.lessons.started ? l.lessons.completionPercent : null}
          hint={`${NUMBER.format(l.lessons.completed)} / ${NUMBER.format(l.lessons.started)} lecciones`}
        />
        <GoldenTile
          metric="avg_attempts"
          value={l.exercises.attempted ? l.exercises.averageAttempts.toString() : "—"}
          rawValue={l.exercises.attempted ? l.exercises.averageAttempts : null}
        />
        <GoldenTile
          metric="vocabulary_growth"
          value={NUMBER.format(l.learnedSigns)}
          tone="neutral"
        />
      </GoldenRow>

      {/* Embudo de aprendizaje + evolución de aciertos. */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Funnel
          title="Embudo de aprendizaje"
          metric="learning_funnel"
          subtitle="Dónde se pierden los usuarios en el recorrido"
          steps={l.onboardingFunnel.map((s) => ({ key: s.key, count: s.count }))}
        />
        <DailySeriesChart
          title="Evolución de respuestas correctas"
          metric="accuracy_evolution"
          points={l.dailyAccuracy.map((d) => ({ t: d.day, value: d.accuracyPercent }))}
          format={(v) => `${v}%`}
          range={range}
          dayResolution
          emptyAsNull
          onSelectRange={onSelectRange}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Completitud de cursos */}
        <Card className="flex min-w-0 flex-col gap-3">
          <div className="flex items-center gap-1.5">
            <CardTitle>Completitud de cursos</CardTitle>
            <InfoPopover metric="global_course_completion" className="ml-auto" />
          </div>
          {denominator === 0 ? (
            <p className="text-text-muted text-sm">Sin inscripciones.</p>
          ) : (
            <>
              <p className="font-display dash-stat-pop mt-1 text-4xl leading-10 font-extrabold tracking-tight">
                {globalCompletionPercent}%
              </p>
              <p className="text-text-muted text-[13px]">
                {NUMBER.format(totalCompletions)}/{NUMBER.format(denominator)} inscripciones
              </p>
              <ProgressBar percent={globalCompletionPercent} className="mt-1" />
            </>
          )}
        </Card>

        <Card className="flex min-w-0 flex-col gap-3">
          <div className="flex items-center gap-1.5">
            <CardTitle>Lecciones más difíciles</CardTitle>
            <InfoPopover metric="hardest_lessons" className="ml-auto" />
          </div>
          <p className="text-text-muted -mt-1.5 text-[13px]">Menor precisión en el período</p>
          {l.hardestLessons.length === 0 ? (
            <p className="text-text-muted text-sm">Sin ejercicios evaluados.</p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {l.hardestLessons.map((lesson) => (
                <li key={lesson.lessonId} className="flex flex-col gap-1">
                  <div className="flex justify-between gap-2 text-[13px] font-bold">
                    <span className="truncate">{lesson.lessonName}</span>
                    <span className="shrink-0">{lesson.accuracyPercent}%</span>
                  </div>
                  <ProgressBar percent={lesson.accuracyPercent} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Dificultad y calidad del contenido. */}
      <div className="border-border flex items-center gap-3 border-t pt-5">
        <h2 className="font-display text-xl font-bold tracking-tight">Dificultad y calidad</h2>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="flex min-w-0 flex-col gap-3">
          <div className="flex items-center gap-1.5">
            <CardTitle>Lecciones con mayor abandono</CardTitle>
            <InfoPopover metric="lesson_abandonment_detail" className="ml-auto" />
          </div>
          {l.lessonRanking.length === 0 ? (
            <p className="text-text-muted text-sm">Sin lecciones con muestra suficiente.</p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {l.lessonRanking.map((lesson) => (
                <li key={lesson.lessonId} className="flex flex-col gap-1">
                  <div className="flex justify-between gap-2 text-[13px] font-bold">
                    <span className="truncate">{lesson.lessonName}</span>
                    <span className="shrink-0">
                      {lesson.abandonmentPercent}% · {NUMBER.format(lesson.completed)}/
                      {NUMBER.format(lesson.started)}
                    </span>
                  </div>
                  <ProgressBar percent={lesson.abandonmentPercent} tone="warning" />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <SignRanking
          title="Mayor tasa de error"
          metric="exercise_error_rate"
          subtitle="Por seña (SELECT_MEANING / SELECT_SIGN)"
          signs={hardestSignsByError}
          value={(s) => `${s.errorPercent}%`}
          percent={(s) => s.errorPercent}
        />
        <SignRanking
          title="Más reintentos"
          metric="exercise_retries"
          subtitle="Por seña (SELECT_MEANING / SELECT_SIGN)"
          signs={hardestSignsByRetries}
          value={(s) => `${s.averageAttempts}×`}
          percent={(s) => Math.min(100, s.averageAttempts * 25)}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <DailySeriesChart
          title="Señas aprendidas"
          metric="vocabulary_growth"
          points={l.learnedSignsDaily.map((d) => ({ t: d.day, value: d.count }))}
          format={fmtCount}
          range={range}
          dayResolution
          onSelectRange={onSelectRange}
          className="flex min-w-0 flex-col gap-3"
        />
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
      </div>

      {/* Señas reportadas */}
      <div className="border-border flex items-center gap-3 border-t pt-5">
        <h2 className="font-display text-xl font-bold tracking-tight">Señas reportadas</h2>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="flex min-w-0 flex-col gap-3">
          <div className="flex items-center gap-1.5">
            <CardTitle>Reportes de señas</CardTitle>
            <InfoPopover metric="sign_report_resolution" className="ml-auto" />
          </div>
          <dl className="flex flex-col gap-2 text-sm">
            {b ? <Row label="Pendientes" value={b.errors.pendingSignReports} danger /> : null}
            <Row label="Resueltos" value={l.reports.resolvedCount} />
            {l.reports.averageResolutionHours > 0 ? (
              <div className="flex items-center justify-between gap-3">
                <dt className="text-text-muted">Tiempo prom. de resolución</dt>
                <dd className="font-extrabold">{l.reports.averageResolutionHours} h</dd>
              </div>
            ) : null}
          </dl>
          {b && b.errors.signReportsByStatus.length > 0 ? (
            <div className="border-fill mt-1 border-t pt-3">
              <p className="text-text-muted mb-1.5 text-xs font-extrabold tracking-wider uppercase">
                Por estado
              </p>
              <dl className="flex flex-col">
                {b.errors.signReportsByStatus.map((item) => (
                  <div
                    key={item.key}
                    className="border-fill flex justify-between gap-3 border-b py-2 text-sm last:border-b-0"
                  >
                    <dt className="text-text-muted">{REPORT_STATUS[item.key] ?? item.key}</dt>
                    <dd className="font-extrabold">{NUMBER.format(item.count)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : null}
        </Card>

        <Card className="flex min-w-0 flex-col gap-3 lg:col-span-2">
          <div className="flex items-center gap-1.5">
            <CardTitle>Señas más reportadas</CardTitle>
            <InfoPopover metric="most_reported_signs" className="ml-auto" />
          </div>
          {l.reports.mostReported.length === 0 ? (
            <p className="text-text-muted text-sm">Sin reportes.</p>
          ) : (
            <dl className="flex flex-col">
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
          )}
        </Card>
      </div>
    </div>
  );
}
