"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CourseSelect } from "@/components/dashboard/course-select";
import { PeriodFilter } from "@/components/dashboard/period-select";
import { Icon } from "@/components/dashboard/icons";
import { InvitedSeats } from "@/components/dashboard/invited-seats";
import { MetricsTabs } from "@/components/dashboard/metrics-tabs";
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
import { useCourseFilter, useWithFilters } from "@/features/dashboard/use-course-filter";
import { useInvitedSeats } from "@/features/dashboard/use-invited-seats";
import { usePeriodFilter } from "@/features/dashboard/use-period-filter";
import { organizationsApi } from "@/lib/api/organizations";
import type { MemberSort, ParticipantActivity } from "@/lib/api/types";
import { avatarSrc } from "@/lib/avatar-url";
import { daysSince, formatDate, formatRelativeDays } from "@/lib/dashboard-format";
import { activityLegend } from "@/lib/participants";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

type Filter = { key: string; label: string; activity?: ParticipantActivity };

/** Only two states: whether they entered the selected course(s) in the last 7 days. */
const FILTERS: Filter[] = [
  { key: "all", label: "Todos" },
  { key: "active", label: "Activos", activity: "ACTIVE" },
  { key: "inactive", label: "Inactivos", activity: "INACTIVE" },
];

/** What the period filter does on this page. */
const JOINED_HINT =
  "Filtra solo por la fecha en que cada persona se incorporó. El estado y el avance son los de hoy.";

type Tab = "participantes" | "invitados";
const TAB_PARAM = "tab";

type Direction = "asc" | "desc";

/** First click on a numeric/date column shows the highest (or most recent) first. */
const FIRST_DIRECTION: Record<MemberSort, Direction> = {
  name: "asc",
  progress: "desc",
  lastActivity: "desc",
  joinedAt: "desc",
};

const GRID = "grid grid-cols-[minmax(240px,2.4fr)_112px_minmax(190px,1.6fr)_120px_120px] gap-4";

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
  const { courseId, course } = useCourseFilter();
  const { period } = usePeriodFilter();
  const withFilters = useWithFilters();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>(FILTERS[0]!);
  // Who already completed the selected course(s) is listed unless the admin hides them.
  const [showCompleted, setShowCompleted] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab: Tab = searchParams.get(TAB_PARAM) === "invitados" ? "invitados" : "participantes";
  const [sort, setSort] = useState<{ by: MemberSort; direction: Direction }>({
    by: "name",
    direction: "asc",
  });
  // The page belongs to the course and period it was picked in: changing either starts over.
  const scope = `${courseId ?? ""}|${period?.from ?? ""}|${period?.to ?? ""}`;
  const [paging, setPaging] = useState({ scope, page: 0 });
  const page = paging.scope === scope ? paging.page : 0;
  const setPage = (next: number | ((p: number) => number)) =>
    setPaging({ scope, page: typeof next === "function" ? next(page) : next });
  const query = useDebounced(search.trim(), 300);
  const legend = activityLegend(course?.name ?? null);
  const invitedView = tab === "invitados";
  const invited = useInvitedSeats(orgId, courseId);

  const changeTab = (next: Tab) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "invitados") params.set(TAB_PARAM, "invitados");
    else params.delete(TAB_PARAM);
    const search = params.toString();
    router.replace(search ? `${pathname}?${search}` : pathname, { scroll: false });
    setSearch("");
    setPage(0);
  };

  const params = {
    query: query || undefined,
    activity: filter.activity,
    courseId,
    period,
    includeCompleted: showCompleted,
    sort,
    page,
    size: PAGE_SIZE,
  };
  const { data, isPending, error, isPlaceholderData } = useQuery({
    queryKey: ["organization", orgId, "members", "roster", params],
    queryFn: () => organizationsApi.participants(orgId!, params),
    enabled: Boolean(orgId) && !invitedView,
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
        subtitle={
          invitedView
            ? "Quiénes recibieron una invitación por email y cómo va cada una."
            : "Seguí el avance de cada persona. Tocá un encabezado para ordenar la lista."
        }
      >
        <div className="flex flex-wrap items-center gap-2">
          <CourseSelect />
          {invitedView ? null : <PeriodFilter prefix="Incorporación" hint={JOINED_HINT} />}
          <Link href="/dashboard/purchases" className={headerButton}>
            <Icon name="personAdd" className="size-4" />
            Sumar personas
          </Link>
        </div>
      </PageHeading>

      <MetricsTabs<Tab>
        idBase="members"
        label="Secciones de participantes"
        active={tab}
        onChange={changeTab}
        tabs={[
          { key: "participantes", label: "Participantes" },
          {
            key: "invitados",
            label: invited.isPending ? "Invitados" : `Invitados · ${invited.rows.length}`,
          },
        ]}
      />

      <div
        role="tabpanel"
        id={`members-panel-${tab}`}
        aria-labelledby={`members-tab-${tab}`}
        className="flex flex-col gap-5"
      >
        <div className="flex flex-col gap-3">
          <label className="border-border bg-surface flex h-[42px] items-center gap-2 rounded-lg border px-3">
            <Icon name="search" className="text-text-muted" />
            <span className="sr-only">
              {invitedView ? "Buscar invitados" : "Buscar participantes"}
            </span>
            <input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              placeholder={invitedView ? "Buscá por email" : "Buscá por nombre, apellido o email"}
              className="min-w-0 flex-1 bg-transparent text-[15px] outline-none"
            />
          </label>
          {invitedView ? null : (
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex flex-wrap gap-2" role="group" aria-label="Estado">
                  {FILTERS.map((f) => {
                    const pressed = filter.key === f.key;
                    return (
                      <button
                        key={f.key}
                        type="button"
                        aria-pressed={pressed}
                        title={
                          f.activity === "ACTIVE"
                            ? legend.active
                            : f.activity === "INACTIVE"
                              ? legend.inactive
                              : undefined
                        }
                        onClick={() => {
                          setFilter(f);
                          setPage(0);
                        }}
                        className={cn(
                          "cursor-pointer rounded-full px-3.5 py-2 text-[13px] font-extrabold transition-colors",
                          pressed ? "bg-text text-on-dark" : "bg-fill text-text hover:bg-fill-dark",
                        )}
                      >
                        {f.label}
                      </button>
                    );
                  })}
                </div>
                <label className="text-text-muted ml-auto flex cursor-pointer items-center gap-2 text-[13px] font-semibold">
                  <input
                    type="checkbox"
                    checked={showCompleted}
                    onChange={(e) => {
                      setShowCompleted(e.target.checked);
                      setPage(0);
                    }}
                  />
                  Mostrar completados
                </label>
              </div>
              <p className="text-text-muted text-[13px] text-pretty">
                <span className="text-text font-bold">{legend.active}</span> {legend.inactive}
              </p>
            </div>
          )}
        </div>

        {invitedView ? <InvitedSeats orgId={orgId} courseId={courseId} query={query} /> : null}
        {!invitedView && isPending ? <LoadingState>Cargando participantes…</LoadingState> : null}
        {!invitedView && error ? (
          <ErrorState>No pudimos cargar a los participantes.</ErrorState>
        ) : null}

        {!invitedView && data ? (
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
                  <span title={`${legend.active} ${legend.inactive}`}>ESTADO</span>
                  <SortHeader label="AVANCE" field="progress" sort={sort} onSort={onSort} />
                  <SortHeader label="ÚLTIMA VEZ" field="lastActivity" sort={sort} onSort={onSort} />
                  <SortHeader label="INCORPORACIÓN" field="joinedAt" sort={sort} onSort={onSort} />
                </div>
                {data.content.map((m) => (
                  <Link
                    key={m.userId}
                    href={withFilters(`/dashboard/members/${m.userId}`)}
                    className={cn(
                      GRID,
                      "border-fill hover:bg-background items-center border-b py-3",
                    )}
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <Avatar
                        seed={m.userId}
                        name={m.name}
                        lastName={m.lastName}
                        src={avatarSrc(m.avatarUrl)}
                      />
                      <span className="flex min-w-0 flex-col">
                        <span className="text-[15px] font-bold">
                          {m.name} {m.lastName}
                        </span>
                        <span className="text-text-muted truncate text-[13px]">{m.email}</span>
                      </span>
                    </span>
                    <span>
                      <StatusPill status={m.activity} />
                    </span>
                    <span className="flex items-center gap-2.5">
                      <ProgressBar
                        percent={m.progressPercentage}
                        tone={m.completed ? "success" : "primary"}
                        className="flex-1"
                        label={`Avance de ${m.name}`}
                      />
                      <span
                        className={cn(
                          "flex w-14 items-center gap-1 text-sm font-extrabold",
                          m.completed && "text-success-dark",
                        )}
                      >
                        {m.completed ? (
                          <Icon name="checkCircle" className="size-4" aria-label="Completó" />
                        ) : null}
                        {m.progressPercentage}%
                      </span>
                    </span>
                    <span className="text-text-muted text-sm">
                      {formatRelativeDays(daysSince(m.lastActivityAt))}
                    </span>
                    <span className="text-text-muted text-sm">{formatDate(m.joinedAt)}</span>
                  </Link>
                ))}
                {data.content.length === 0 ? (
                  <div className="flex flex-col items-center gap-1.5 py-10 text-center">
                    <p className="font-display text-lg font-bold">
                      {query ? "No encontramos a nadie" : "No hay personas en este filtro"}
                    </p>
                    <p className="text-text-muted text-sm">
                      {query
                        ? "Probá con otro nombre o email."
                        : "Probá con otro estado, otro período de incorporación o mostrando a quienes completaron."}
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
      </div>
    </section>
  );
}
