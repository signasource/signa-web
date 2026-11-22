"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/dashboard/icons";
import {
  Avatar,
  Card,
  CardTitle,
  ErrorState,
  LoadingState,
  ProgressBar,
  TrainingPill,
  pillButton,
  trainingStatusLabel,
} from "@/components/dashboard/ui";
import { useAuth } from "@/features/auth/auth-context";
import { useWithFilters } from "@/features/dashboard/use-course-filter";
import { organizationsApi } from "@/lib/api/organizations";
import type { CourseTraining, TrainingStatus } from "@/lib/api/types";
import { avatarSrc } from "@/lib/avatar-url";
import { daysSince, formatDate, formatRelativeDays } from "@/lib/dashboard-format";
import { trainingTotal, visibleTraining, type TrainingSort } from "@/lib/participants";
import { cn } from "@/lib/utils";

const STATUSES: TrainingStatus[] = [
  "ACTIVE",
  "INACTIVE",
  "NOT_STARTED",
  "INVITATION_PENDING",
  "COMPLETED",
  "ACCESS_EXPIRED",
];

/** First click on a number/date column shows the highest / most recent first. */
const FIRST_DIRECTION: Record<TrainingSort, "asc" | "desc"> = {
  course: "asc",
  status: "asc",
  progress: "desc",
  lastActivity: "desc",
  startedAt: "desc",
  expiresAt: "asc",
};

const GRID =
  "grid grid-cols-[minmax(200px,1.6fr)_150px_minmax(120px,1.3fr)_160px_110px_110px] items-center gap-4";

function SortButton({
  label,
  by,
  sort,
  onSort,
}: {
  label: string;
  by: TrainingSort;
  sort: { by: TrainingSort; direction: "asc" | "desc" };
  onSort: (by: TrainingSort) => void;
}) {
  const active = sort.by === by;
  return (
    <button
      type="button"
      aria-pressed={active}
      title={`Ordenar por ${label.toLowerCase()}`}
      onClick={() => onSort(by)}
      className={cn(
        "hover:text-text inline-flex cursor-pointer items-center gap-1 text-left tracking-wider transition-colors",
        active && "text-text",
      )}
    >
      {label}
      <Icon
        name={active ? (sort.direction === "asc" ? "arrowUp" : "arrowDown") : "sortable"}
        className={cn("size-3.5", !active && "opacity-50")}
      />
    </button>
  );
}

/** The cells of one course row (or the total row) of the training table. */
function TrainingCells({ row, name }: { row: CourseTraining; name: string }) {
  return (
    <>
      <span className="text-[15px] font-bold">{name}</span>
      <span>
        <TrainingPill status={row.status} />
      </span>
      <span className="flex items-center gap-2.5">
        {row.status === "INVITATION_PENDING" ? (
          <span className="text-text-muted text-sm">—</span>
        ) : (
          <>
            <ProgressBar
              percent={row.progressPercentage}
              tone={row.progressPercentage >= 100 ? "success" : "primary"}
              className="flex-1"
              label={`Progreso en ${name}`}
            />
            <span className="w-10 text-sm font-extrabold">{row.progressPercentage}%</span>
          </>
        )}
      </span>
      <span className="text-text-muted text-sm">
        {row.status === "INVITATION_PENDING"
          ? "—"
          : formatRelativeDays(daysSince(row.lastActivityAt))}
      </span>
      <span className="text-text-muted text-sm">
        {row.startedAt ? formatDate(row.startedAt) : "—"}
      </span>
      <span className="text-text-muted text-sm">
        {row.expiresAt ? formatDate(row.expiresAt) : "—"}
      </span>
    </>
  );
}

/**
 * One row per course the participant takes or was invited to, with state, progress, last
 * activity, access start and expiry; every column sorts, course and state filter, and a last row
 * sums up all the courses (average progress, latest activity, earliest start, nearest expiry).
 */
function TrainingTable({ courses, total }: { courses: CourseTraining[]; total: CourseTraining }) {
  const [sort, setSort] = useState<{ by: TrainingSort; direction: "asc" | "desc" }>({
    by: "course",
    direction: "asc",
  });
  const [courseFilter, setCourseFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<TrainingStatus | "ALL">("ALL");
  const rows = visibleTraining(courses, { courseId: courseFilter, status: statusFilter }, sort);
  // The total follows what is on screen: the API's row unfiltered, recomputed for a filtered list.
  const filtered = courseFilter !== "ALL" || statusFilter !== "ALL";
  const shownTotal = filtered ? trainingTotal(rows) : total;
  const onSort = (by: TrainingSort) =>
    setSort((s) =>
      s.by === by
        ? { by, direction: s.direction === "asc" ? "desc" : "asc" }
        : { by, direction: FIRST_DIRECTION[by] },
    );

  return (
    <Card className="flex flex-col gap-3">
      <CardTitle>Cursos</CardTitle>
      {courses.length === 0 ? (
        <p className="text-text-muted text-sm">Todavía no tiene cursos asignados.</p>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[920px]">
            <div
              role="row"
              className={cn(
                GRID,
                "border-border text-text-muted items-start border-b pb-3 text-xs font-extrabold",
              )}
            >
              <span className="flex flex-col gap-1.5">
                <SortButton label="CURSO" by="course" sort={sort} onSort={onSort} />
                <select
                  value={courseFilter}
                  onChange={(e) => setCourseFilter(e.target.value)}
                  aria-label="Filtrar por curso"
                  className="border-border bg-surface text-text rounded-lg border px-2 py-1 text-[13px] font-semibold"
                >
                  <option value="ALL">Todos</option>
                  {courses.flatMap((c) =>
                    c.courseId ? (
                      <option key={c.courseId} value={c.courseId}>
                        {c.courseName}
                      </option>
                    ) : (
                      []
                    ),
                  )}
                </select>
              </span>
              <span className="flex flex-col gap-1.5">
                <SortButton label="ESTADO" by="status" sort={sort} onSort={onSort} />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as TrainingStatus | "ALL")}
                  aria-label="Filtrar por estado"
                  className="border-border bg-surface text-text rounded-lg border px-2 py-1 text-[13px] font-semibold"
                >
                  <option value="ALL">Todos</option>
                  {STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {trainingStatusLabel(st)}
                    </option>
                  ))}
                </select>
              </span>
              <SortButton label="PROGRESO" by="progress" sort={sort} onSort={onSort} />
              <SortButton label="ÚLTIMA ACTIVIDAD" by="lastActivity" sort={sort} onSort={onSort} />
              <SortButton label="INICIO" by="startedAt" sort={sort} onSort={onSort} />
              <SortButton label="VENCIMIENTO" by="expiresAt" sort={sort} onSort={onSort} />
            </div>
            <div>
              {rows.map((row) => (
                <div
                  key={row.courseId}
                  role="row"
                  className={cn(GRID, "border-fill border-b py-3 last:border-b-0")}
                >
                  <TrainingCells row={row} name={row.courseName ?? ""} />
                </div>
              ))}
            </div>
            {rows.length === 0 ? (
              <p className="text-text-muted py-4 text-center text-sm">
                Ningún curso coincide con los filtros.
              </p>
            ) : null}
            {rows.length > 0 ? (
              <div role="row" className={cn(GRID, "border-border border-t py-3")}>
                <TrainingCells
                  row={shownTotal}
                  name={filtered ? "Cursos mostrados" : "Todos los cursos"}
                />
              </div>
            ) : null}
          </div>
        </div>
      )}
    </Card>
  );
}

export default function MemberDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { organization } = useAuth();
  const orgId = organization?.id;
  const [confirming, setConfirming] = useState(false);
  const withFilters = useWithFilters();

  const { data, isPending, error } = useQuery({
    queryKey: ["organization", orgId, "members", "training", userId],
    queryFn: () => organizationsApi.participantTraining(orgId!, userId),
    enabled: Boolean(orgId),
    placeholderData: keepPreviousData,
  });

  const remove = useMutation({
    mutationFn: () => organizationsApi.removeMember(orgId!, userId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["organization", orgId] });
      router.replace(withFilters("/dashboard/members"));
    },
  });

  const back = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Link
        href={withFilters("/dashboard/members")}
        className="text-text-muted flex items-center gap-1 text-sm font-bold"
      >
        <Icon name="chevronBack" className="size-4" />
        Participantes
      </Link>
    </div>
  );

  if (isPending)
    return (
      <>
        {back}
        <LoadingState>Cargando participante…</LoadingState>
      </>
    );
  if (error)
    return (
      <>
        {back}
        <ErrorState>No pudimos cargar al participante.</ErrorState>
      </>
    );

  const m = data;

  return (
    <section className="flex flex-col gap-4">
      {back}

      <div className="border-border bg-surface flex flex-wrap items-center gap-[18px] rounded-3xl border p-6">
        <Avatar
          seed={m.userId}
          name={m.name}
          lastName={m.lastName}
          size="lg"
          src={avatarSrc(m.avatarUrl)}
        />
        <div className="flex min-w-[220px] flex-1 flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="font-display text-3xl leading-9 font-bold">
              {m.name} {m.lastName}
            </h1>
          </div>
          <p className="text-text-muted text-sm">
            {m.email} · Se incorporó el {formatDate(m.joinedAt)}
          </p>
        </div>
        {m.status === "ACTIVE" ? (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className={`${pillButton} text-danger rounded-xl px-4 py-2.5 text-sm`}
          >
            <Icon name="personRemove" className="size-4" />
            Quitar de la organización
          </button>
        ) : null}
      </div>

      <TrainingTable courses={m.courses} total={m.total} />

      {confirming ? (
        <div
          onClick={() => !remove.isPending && setConfirming(false)}
          className="bg-text/45 fixed inset-0 z-50 flex items-center justify-center p-5"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="remove-title"
            onClick={(e) => e.stopPropagation()}
            className="bg-background flex w-full max-w-[440px] flex-col gap-3 rounded-3xl p-7"
          >
            <p id="remove-title" className="font-display text-2xl font-bold tracking-tight">
              ¿Quitar a {m.name} {m.lastName}?
            </p>
            <p className="text-text-muted text-[15px] text-pretty">
              Deja de tener acceso a los cursos de {organization?.name} y su cupo se pierde: no se
              puede pasar a otra persona. Su progreso queda guardado.
            </p>
            {remove.error ? <ErrorState>No pudimos quitar a la persona.</ErrorState> : null}
            <div className="mt-2 flex justify-end gap-2">
              <button
                type="button"
                disabled={remove.isPending}
                onClick={() => setConfirming(false)}
                className="border-border bg-surface cursor-pointer rounded-xl border px-5 py-3 text-[15px] font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={remove.isPending}
                onClick={() => remove.mutate()}
                className="bg-danger text-surface cursor-pointer rounded-xl px-5 py-3 text-[15px] font-bold disabled:opacity-60"
              >
                {remove.isPending ? "Quitando…" : "Quitar"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
