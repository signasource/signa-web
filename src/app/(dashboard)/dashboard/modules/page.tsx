"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Fragment } from "react";
import { CourseSelect } from "@/components/dashboard/course-select";
import { PeriodFilter } from "@/components/dashboard/period-select";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeading,
  ProgressBar,
} from "@/components/dashboard/ui";
import { useAuth } from "@/features/auth/auth-context";
import { useCourseFilter } from "@/features/dashboard/use-course-filter";
import { usePeriodFilter } from "@/features/dashboard/use-period-filter";
import { organizationsApi } from "@/lib/api/organizations";

const NUMBER = new Intl.NumberFormat("es-AR");

export default function ModulesPage() {
  const { organization } = useAuth();
  const orgId = organization?.id;
  const { courseId, courses } = useCourseFilter();
  const groupByCourse = !courseId && courses.length > 1;
  const { period } = usePeriodFilter();
  const filters = { courseId, period };

  const overview = useQuery({
    queryKey: ["organization", orgId, "overview", filters],
    queryFn: () => organizationsApi.overview(orgId!, filters),
    enabled: Boolean(orgId),
    placeholderData: keepPreviousData,
  });
  const { data, isPending, error } = useQuery({
    queryKey: ["organization", orgId, "modules", filters],
    queryFn: () => organizationsApi.modules(orgId!, filters),
    enabled: Boolean(orgId),
    placeholderData: keepPreviousData,
  });
  const total = overview.data?.participation.totalParticipants ?? 0;

  return (
    <section className="flex flex-col gap-5">
      <PageHeading
        title="Contenidos contratados"
        subtitle={`Todas las personas activas de ${organization?.name} acceden a estos módulos desde la app. Cada una avanza a su ritmo.`}
      >
        <div className="flex flex-wrap items-center gap-2">
          <CourseSelect />
          <PeriodFilter />
        </div>
      </PageHeading>

      {isPending ? <LoadingState>Cargando contenidos…</LoadingState> : null}
      {error ? <ErrorState>No pudimos cargar los contenidos.</ErrorState> : null}
      {data && data.length === 0 ? (
        <EmptyState
          title="Todavía no hay contenidos"
          body="Cuando tu organización tenga cursos contratados, sus módulos aparecen acá."
        />
      ) : null}

      <ul className="flex flex-col gap-3">
        {data?.map((m, index) => (
          <Fragment key={m.topicId}>
            {groupByCourse && m.courseId !== data[index - 1]?.courseId ? (
              <li className="font-display mt-2 text-lg font-bold first:mt-0">{m.courseName}</li>
            ) : null}
            <li className="border-border bg-surface flex flex-wrap items-center gap-x-8 gap-y-5 rounded-2xl border p-5">
              <div className="flex min-w-0 flex-[1_1_280px] items-center gap-3.5">
                <span className="bg-primary text-on-primary font-display flex size-12 shrink-0 items-center justify-center rounded-full text-lg font-extrabold">
                  {groupByCourse
                    ? data.slice(0, index + 1).filter((x) => x.courseId === m.courseId).length
                    : index + 1}
                </span>
                <div className="min-w-0">
                  <p className="font-display text-xl font-bold tracking-tight">{m.title}</p>
                  <p className="text-text-muted mt-0.5 text-[13px]">
                    {m.totalLessons} {m.totalLessons === 1 ? "lección" : "lecciones"}
                  </p>
                </div>
              </div>
              <div className="grid flex-[2_1_520px] grid-cols-[repeat(auto-fit,minmax(130px,1fr))] items-center gap-5">
                <div className="flex flex-col gap-1.5">
                  <span className="text-text-muted text-[13px] font-bold">Lo completaron</span>
                  <span className="flex items-center gap-2">
                    <ProgressBar
                      percent={m.completionPercentage}
                      tone="success"
                      className="flex-1"
                      label={`Completaron ${m.title}`}
                    />
                    <span className="text-sm font-extrabold whitespace-nowrap">
                      {m.participantsCompleted}
                      {total ? `/${total}` : ""}
                    </span>
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-text-muted text-[13px] font-bold">En curso</span>
                  <span className="font-display text-2xl font-extrabold">
                    {m.participantsInProgress}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-text-muted text-[13px] font-bold">
                    Respuestas correctas
                  </span>
                  <span className="font-display text-2xl font-extrabold">
                    {m.exerciseAttempts > 0 ? `${m.correctPercentage}%` : "—"}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-text-muted text-[13px] font-bold">
                    Ejercicios realizados
                  </span>
                  <span className="font-display text-2xl font-extrabold">
                    {NUMBER.format(m.exerciseAttempts)}
                  </span>
                </div>
              </div>
            </li>
          </Fragment>
        ))}
      </ul>
      <p className="text-text-muted text-sm">
        ¿Querés sumar módulos o cursos? Escribinos y armamos la propuesta.
      </p>
    </section>
  );
}
