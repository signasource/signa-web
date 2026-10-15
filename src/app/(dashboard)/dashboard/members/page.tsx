"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CourseSelect } from "@/components/dashboard/course-select";
import { Icon } from "@/components/dashboard/icons";
import {
  Avatar,
  ErrorState,
  LoadingState,
  PageHeading,
  ProgressBar,
  StatusPill,
  pillButton,
  headerButton,
} from "@/components/dashboard/ui";
import { useAuth } from "@/features/auth/auth-context";
import { useCourseFilter, useWithCourse } from "@/features/dashboard/use-course-filter";
import { organizationsApi } from "@/lib/api/organizations";
import type { MemberActivityStatus, MemberSort, MemberStatus } from "@/lib/api/types";
import {
  currentModuleLabel,
  daysSince,
  formatDate,
  formatRelativeDays,
} from "@/lib/dashboard-format";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

type Filter = { key: string; label: string; status: MemberStatus; activity?: MemberActivityStatus };

const FILTERS: Filter[] = [
  { key: "all", label: "Todos", status: "ACTIVE" },
  { key: "active", label: "Activos", status: "ACTIVE", activity: "ACTIVE" },
  { key: "inactive", label: "Inactivos", status: "ACTIVE", activity: "INACTIVE" },
  { key: "notStarted", label: "Sin iniciar", status: "ACTIVE", activity: "NOT_STARTED" },
  { key: "completed", label: "Completaron", status: "ACTIVE", activity: "COMPLETED" },
  { key: "removed", label: "Quitados", status: "REMOVED" },
];

type Direction = "asc" | "desc";

/** First click on a numeric/date column shows the highest (or most recent) first. */
const FIRST_DIRECTION: Record<MemberSort, Direction> = {
  name: "asc",
  progress: "desc",
  lastActivity: "desc",
  joinedAt: "desc",
};

const GRID =
  "grid grid-cols-[minmax(240px,2.2fr)_112px_minmax(170px,1.4fr)_minmax(170px,1.5fr)_116px_116px] gap-4";

function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return debounced;
}

function SortHeader({
  label,
  field,
  sort,
  onSort,
}: {
  label: string;
  field: MemberSort;
  sort: { by: MemberSort; direction: Direction };
  onSort: (field: MemberSort) => void;
}) {
  const active = sort.by === field;
  return (
    <span>
      <button
        type="button"
        aria-pressed={active}
        title={`Ordenar por ${label.toLowerCase()}`}
        onClick={() => onSort(field)}
        className={cn(
          "hover:text-text inline-flex cursor-pointer items-center gap-1 tracking-wider transition-colors",
          active && "text-text",
        )}
      >
        {label}
        <Icon
          name={active ? (sort.direction === "asc" ? "arrowUp" : "arrowDown") : "sortable"}
          className={cn("size-3.5", !active && "opacity-50")}
        />
      </button>
    </span>
  );
}

export default function MembersPage() {
  const { organization } = useAuth();
  const orgId = organization?.id;
  const { courseId, courses } = useCourseFilter();
  const withCourse = useWithCourse();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>(FILTERS[0]!);
  const [sort, setSort] = useState<{ by: MemberSort; direction: Direction }>({
    by: "name",
    direction: "asc",
  });
  // The page belongs to the course it was picked in: switching course starts from page one.
  const [paging, setPaging] = useState({ courseId, page: 0 });
  const page = paging.courseId === courseId ? paging.page : 0;
  const setPage = (next: number | ((p: number) => number)) =>
    setPaging({ courseId, page: typeof next === "function" ? next(page) : next });
  const query = useDebounced(search.trim(), 300);
  const showCourse = !courseId && courses.length > 1;

  const params = {
    query: query || undefined,
    status: filter.status,
    activity: filter.activity,
    courseId,
    sort,
    page,
    size: PAGE_SIZE,
  };
  const { data, isPending, error, isPlaceholderData } = useQuery({
    queryKey: ["organization", orgId, "members", params],
    queryFn: () => organizationsApi.members(orgId!, params),
    enabled: Boolean(orgId),
    placeholderData: keepPreviousData,
  });

  const onSort = (by: MemberSort) => {
    setSort((s) =>
      s.by === by
        ? { by, direction: s.direction === "asc" ? "desc" : "asc" }
        : { by, direction: FIRST_DIRECTION[by] },
    );
    setPage(0);
  };

  const total = data?.totalElements ?? 0;
  const totalPages = data?.totalPages ?? 0;
  const people = `${total} ${total === 1 ? "persona" : "personas"}`;

  return (
    <section className="flex flex-col gap-5">
      <PageHeading
        title="Participantes"
        subtitle="Seguí el avance de cada persona. Tocá un encabezado para ordenar la lista."
      >
        <div className="flex flex-wrap items-center gap-2">
          <CourseSelect />
          <Link href={withCourse("/dashboard/invitations")} className={headerButton}>
            <Icon name="personAdd" className="size-4" />
            Invitar personas
          </Link>
        </div>
      </PageHeading>

      <div className="flex flex-col gap-3">
        <label className="border-border bg-surface flex h-[42px] items-center gap-2 rounded-lg border px-3">
          <Icon name="search" className="text-text-muted" />
          <span className="sr-only">Buscar participantes</span>
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder="Buscá por nombre, apellido o email"
            className="min-w-0 flex-1 bg-transparent text-[15px] outline-none"
          />
        </label>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Estado">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              aria-pressed={filter.key === f.key}
              onClick={() => {
                setFilter(f);
                setPage(0);
              }}
              className={cn(
                "cursor-pointer rounded-full px-3.5 py-2 text-[13px] font-extrabold transition-colors",
                filter.key === f.key
                  ? "bg-text text-on-dark"
                  : "bg-fill text-text hover:bg-fill-dark",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {isPending ? <LoadingState>Cargando participantes…</LoadingState> : null}
      {error ? <ErrorState>No pudimos cargar a los participantes.</ErrorState> : null}

      {data ? (
        <>
          <div
            className={cn(
              "border-border bg-surface overflow-x-auto rounded-2xl border transition-opacity",
              isPlaceholderData && "opacity-60",
            )}
          >
            <div className="min-w-[940px] px-5 py-2">
              <div
                className={cn(
                  GRID,
                  "border-border text-text-muted border-b py-3 text-xs font-extrabold tracking-wider",
                )}
              >
                <SortHeader label="PERSONA" field="name" sort={sort} onSort={onSort} />
                <span>ESTADO</span>
                <span>MÓDULO ACTUAL</span>
                <SortHeader label="AVANCE" field="progress" sort={sort} onSort={onSort} />
                <SortHeader label="ÚLTIMA VEZ" field="lastActivity" sort={sort} onSort={onSort} />
                <SortHeader label="INCORPORACIÓN" field="joinedAt" sort={sort} onSort={onSort} />
              </div>
              {data.content.map((m) => {
                const moduleLabel = currentModuleLabel(m, showCourse);
                return (
                  <Link
                    key={m.userId}
                    href={withCourse(`/dashboard/members/${m.userId}`)}
                    className={cn(
                      GRID,
                      "border-fill hover:bg-background items-center border-b py-3",
                    )}
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <Avatar seed={m.userId} name={m.name} lastName={m.lastName} />
                      <span className="flex min-w-0 flex-col">
                        <span className="text-[15px] font-bold">
                          {m.name} {m.lastName}
                        </span>
                        <span className="text-text-muted truncate text-[13px]">{m.email}</span>
                      </span>
                    </span>
                    <span>
                      <StatusPill status={m.activityStatus} />
                    </span>
                    <span className="flex min-w-0 flex-col">
                      <span
                        className={cn(
                          "flex items-center gap-1.5 truncate text-sm",
                          moduleLabel.finished && "text-success-dark font-bold",
                          moduleLabel.text === "Todavía no empezó" && "text-text-muted",
                        )}
                      >
                        {moduleLabel.finished ? (
                          <Icon name="checkCircle" className="size-4" />
                        ) : null}
                        {moduleLabel.text}
                      </span>
                      {moduleLabel.detail ? (
                        <span className="text-text-muted truncate text-xs">
                          {moduleLabel.detail}
                        </span>
                      ) : null}
                    </span>
                    <span className="flex items-center gap-2.5">
                      <ProgressBar
                        percent={m.progressPercentage}
                        className="flex-1"
                        label={`Avance de ${m.name}`}
                      />
                      <span className="w-10 text-sm font-extrabold">{m.progressPercentage}%</span>
                    </span>
                    <span className="text-text-muted text-sm">
                      {formatRelativeDays(daysSince(m.lastActivityAt))}
                    </span>
                    <span className="text-text-muted text-sm">{formatDate(m.joinedAt)}</span>
                  </Link>
                );
              })}
              {data.content.length === 0 ? (
                <div className="flex flex-col items-center gap-1.5 py-10 text-center">
                  <p className="font-display text-lg font-bold">
                    {query ? "No encontramos a nadie" : "No hay personas en este filtro"}
                  </p>
                  <p className="text-text-muted text-sm">
                    {query
                      ? "Probá con otro nombre o email."
                      : "Elegí otro estado para ver al resto del equipo."}
                  </p>
                </div>
              ) : null}
            </div>
          </div>

          {total > 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-text-muted text-sm font-semibold">
                {totalPages > 1 ? `${people} · Página ${page + 1} de ${totalPages}` : people}
              </span>
              {totalPages > 1 ? (
                <div className="flex gap-2">
                  <button
                    type="button"
                    className={pillButton}
                    disabled={page === 0}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                  >
                    <Icon name="chevronBack" className="size-3.5" />
                    Anterior
                  </button>
                  <button
                    type="button"
                    className={pillButton}
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Siguiente
                    <Icon name="chevronForward" className="size-3.5" />
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
