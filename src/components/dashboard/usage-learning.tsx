"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { BreakdownPie } from "@/components/dashboard/breakdown-pie";
import { DailySeriesChart } from "@/components/dashboard/daily-series-chart";
import { Funnel } from "@/components/dashboard/funnel";
import { GoldenRow, GoldenTile } from "@/components/dashboard/golden-row";
import { InfoPopover } from "@/components/dashboard/info-popover";
import type { MetricId } from "@/components/dashboard/metric-catalog";
import { MetricStat } from "@/components/dashboard/metric-stat";
import type { RangeSelect } from "@/components/dashboard/perf-chart";
import { fmtCount } from "@/components/dashboard/perf-format";
import { REFRESH_MS } from "@/components/dashboard/perf-panel";
import { Card, CardTitle, ErrorState, LoadingState, ProgressBar } from "@/components/dashboard/ui";
import {
  Breakdown,
  ENROLLMENT_STATUS,
  NUMBER,
  REPORT_STATUS,
  Row,
  countOf,
  useBusinessMetrics,
} from "@/components/dashboard/usage-business";
import { metricsApi, type ExerciseDifficulty } from "@/lib/api/metrics";
import type { DateTimeRange } from "@/lib/datetime-range";

const IMPORT_STATUS: Record<string, string> = { SUCCESS: "Exitosos", FAILED: "Fallidos" };

/** A ranked list of the hardest exercises, with a per-row bar driven by a caller-chosen metric. */
function ExerciseRanking({
  title,
  metric,
  exercises,
  value,
  percent,
}: {
  title: string;
  metric: MetricId;
  exercises: ExerciseDifficulty[];
  value: (e: ExerciseDifficulty) => string;
  percent: (e: ExerciseDifficulty) => number;
}) {
  return (
    <Card className="flex min-w-0 flex-col gap-3">
      <div className="flex items-center gap-1.5">
        <CardTitle>{title}</CardTitle>
        <InfoPopover metric={metric} className="ml-auto" />
      </div>
      {exercises.length === 0 ? (
        <p className="text-text-muted text-sm">Sin ejercicios con muestra suficiente.</p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {exercises.map((e) => (
            <li key={e.blockId} className="flex flex-col gap-1">
              <div className="flex justify-between gap-2 text-[13px] font-bold">
                <span className="truncate">{e.label}</span>
                <span className="shrink-0">
                  {value(e)} · {NUMBER.format(e.evaluated)} ej.
                </span>
              </div>
              <ProgressBar percent={percent(e)} tone="warning" />
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

/** Learning & content query (per-course, hardest lessons, vocabulary, reports, imports). */
function useLearningMetrics(range: DateTimeRange, live: boolean) {
  return useQuery({
    queryKey: ["admin", "metrics", "learning", range.from, range.to],
    queryFn: () => metricsApi.learning({ from: range.from, to: range.to }),
    enabled: Boolean(range.from && range.to),
    placeholderData: keepPreviousData,
    refetchInterval: live ? REFRESH_MS : false,
  });
}

/**
 * Aprendizaje & contenido. Completion (global, funnel and per course), accuracy (global + per block
 * type), the hardest lessons, vocabulary growth, and content-quality signals (sign-report resolution,
 * most-reported signs, imports). Golden tiles summarise learning health up top.
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
  const learning = useLearningMetrics(range, live);
  const business = useBusinessMetrics(range, live);

  if (learning.isPending || business.isPending)
    return <LoadingState>Cargando métricas de aprendizaje…</LoadingState>;
  if (learning.isError && !learning.data)
    return <ErrorState>No pudimos cargar las métricas de aprendizaje.</ErrorState>;

  const l = learning.data!;
  const b = business.data;

  return (
    <div className="flex flex-col gap-6">
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
          metric="accuracy_global"
          value={b && b.accuracy.evaluated ? `${b.accuracy.accuracyPercent}%` : "—"}
          rawValue={b && b.accuracy.evaluated ? b.accuracy.accuracyPercent : null}
          hint={b ? `${NUMBER.format(b.accuracy.evaluated)} ejercicios` : undefined}
        />
        <GoldenTile
          metric="vocabulary_growth"
          value={NUMBER.format(l.learnedSigns)}
          tone="neutral"
        />
      </GoldenRow>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <MetricStat metric="lessons_started" value={NUMBER.format(l.lessons.started)} />
        <MetricStat
          metric="lessons_completed"
          value={NUMBER.format(l.lessons.completed)}
          hint={b ? `${NUMBER.format(b.progress.topicsCompleted)} temas` : undefined}
        />
        <MetricStat metric="exercises_attempted" value={NUMBER.format(l.exercises.attempted)} />
        <MetricStat
          metric="sign_report_resolution"
          value={`${l.reports.averageResolutionHours} h`}
          hint={`${NUMBER.format(l.reports.resolvedCount)} resueltos`}
        />
        {b ? <MetricStat metric="courses_total" value={NUMBER.format(b.courses.total)} /> : null}
        {b ? (
          <MetricStat
            metric="versions_published"
            value={NUMBER.format(countOf(b.courses.versionsByStatus, "PUBLISHED"))}
          />
        ) : null}
        <MetricStat
          metric="sign_reports_pending"
          value={b ? NUMBER.format(b.errors.pendingSignReports) : "—"}
        />
        <MetricStat
          metric="imports_failed"
          value={b ? NUMBER.format(b.errors.failedImports) : "—"}
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
        <Card className="flex min-w-0 flex-col gap-3">
          <div className="flex items-center gap-1.5">
            <CardTitle>Completitud por curso</CardTitle>
            <InfoPopover metric="course_completion" className="ml-auto" />
          </div>
          <p className="text-text-muted -mt-1.5 text-[13px]">Menor completitud primero</p>
          {l.courses.length === 0 ? (
            <p className="text-text-muted text-sm">Sin inscripciones.</p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {[...l.courses]
                .sort((x, y) => x.completionPercent - y.completionPercent)
                .map((c) => (
                  <li key={c.courseId} className="flex flex-col gap-1">
                    <div className="flex justify-between gap-2 text-[13px] font-bold">
                      <span className="truncate">{c.courseName}</span>
                      <span>
                        {c.completionPercent}% · {NUMBER.format(c.completed)}/
                        {NUMBER.format(c.total)}
                      </span>
                    </div>
                    <ProgressBar percent={c.completionPercent} />
                  </li>
                ))}
            </ul>
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
                    <span>
                      {lesson.accuracyPercent}% · {NUMBER.format(lesson.evaluated)} ej.
                    </span>
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
            <InfoPopover metric="lesson_abandonment" className="ml-auto" />
          </div>
          {l.lessonRanking.length === 0 ? (
            <p className="text-text-muted text-sm">Sin lecciones con muestra suficiente.</p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {l.lessonRanking.map((lesson) => (
                <li key={lesson.lessonId} className="flex flex-col gap-1">
                  <div className="flex justify-between gap-2 text-[13px] font-bold">
                    <span className="truncate">{lesson.lessonName}</span>
                    <span>
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

        <ExerciseRanking
          title="Mayor tasa de error"
          metric="exercise_error_rate"
          exercises={l.highestErrorExercises}
          value={(e) => `${e.errorPercent}%`}
          percent={(e) => e.errorPercent}
        />
        <ExerciseRanking
          title="Más reintentos"
          metric="exercise_retries"
          exercises={l.mostRetriedExercises}
          value={(e) => `${e.averageAttempts}×`}
          percent={(e) => Math.min(100, e.averageAttempts * 25)}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <DailySeriesChart
          title="Señas aprendidas"
          metric="vocabulary_growth"
          points={l.learnedSignsDaily.map((d) => ({ t: d.day, value: d.count }))}
          format={fmtCount}
          range={range}
          dayResolution
          onSelectRange={onSelectRange}
          className="flex min-w-0 flex-col gap-3 lg:col-span-2"
        />
        <BreakdownPie
          title="Inscripciones por estado"
          metric="enrollments_active"
          items={l.enrollmentFunnel.map((i) => ({
            label: ENROLLMENT_STATUS[i.key] ?? i.key,
            value: i.count,
          }))}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
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
            <InfoPopover metric="sign_report_resolution" className="ml-auto" />
          </div>
          <dl className="flex flex-col gap-2 text-sm">
            {b ? <Row label="Pendientes" value={b.errors.pendingSignReports} danger /> : null}
            <Row label="Resueltos (en resolución)" value={l.reports.resolvedCount} />
          </dl>
          <div className="border-fill mt-1 border-t pt-3">
            <p className="text-text-muted mb-1.5 text-xs font-extrabold tracking-wider uppercase">
              Señas más reportadas
            </p>
            {l.reports.mostReported.length === 0 ? (
              <p className="text-text-muted text-sm">Sin reportes.</p>
            ) : (
              <dl className="flex flex-col">
                {l.reports.mostReported.map((m) => (
                  <div
                    key={m.meaning}
                    className="border-fill flex justify-between gap-3 border-b py-2 text-sm last:border-b-0"
                  >
                    <dt className="text-text-muted truncate">{m.meaning}</dt>
                    <dd className="font-extrabold">{NUMBER.format(m.count)}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </Card>

        <Card className="flex min-w-0 flex-col gap-3">
          <div className="flex items-center gap-1.5">
            <CardTitle>Imports de contenido</CardTitle>
            <InfoPopover metric="imports_failed" className="ml-auto" />
          </div>
          <Breakdown items={l.imports} labels={IMPORT_STATUS} />
          {b ? (
            <div className="border-fill mt-1 border-t pt-3">
              <p className="text-text-muted mb-1.5 text-xs font-extrabold tracking-wider uppercase">
                Reportes por estado
              </p>
              <Breakdown items={b.errors.signReportsByStatus} labels={REPORT_STATUS} />
            </div>
          ) : null}
        </Card>
      </div>
    </div>
  );
}
