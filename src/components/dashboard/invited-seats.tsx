"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { SeatStatusPill } from "@/components/dashboard/purchase-status";
import { SortHeader } from "@/components/dashboard/sort-header";
import { ErrorState, LoadingState } from "@/components/dashboard/ui";
import { useInvitedSeats } from "@/features/dashboard/use-invited-seats";
import type { OrganizationInvitation, SeatStatus } from "@/lib/api/types";
import { formatDate } from "@/lib/dashboard-format";
import { isErasedEmail, seatEmailLabel, seatStatusLabel } from "@/lib/purchases";
import { nextSort, sortRows, type SortDir, type SortValue } from "@/lib/table-sort";
import { cn } from "@/lib/utils";

type InvitedFilter = SeatStatus | "ALL";

const FILTERS: { value: InvitedFilter; label: string }[] = [
  { value: "ALL", label: "Todas" },
  { value: "INVITED", label: "Pendientes" },
  { value: "INVITATION_EXPIRED", label: "Vencidas" },
];

type InvitedSort = "email" | "course" | "status" | "invitedAt";

/** What each column of the invited list orders by, and its first direction. */
const INVITED_SORT: Record<
  InvitedSort,
  { key: (r: OrganizationInvitation) => SortValue; first: SortDir }
> = {
  email: { key: (r) => r.seat.email, first: "asc" },
  course: { key: (r) => r.courseName, first: "asc" },
  status: { key: (r) => seatStatusLabel(r.seat.status, r.purchaseStatus), first: "asc" },
  invitedAt: { key: (r) => r.seat.invitedAt, first: "desc" },
};

const GRID = "grid grid-cols-[minmax(220px,2fr)_minmax(160px,1.4fr)_150px_120px] gap-4";

/** People invited by email who have not accepted yet, with the state of each invitation. */
export function InvitedSeats({
  orgId,
  courseId,
  query,
  filtersEnd,
}: {
  orgId: string | undefined;
  courseId: string | undefined;
  query: string;
  /** Rendered at the right of the state chips (the page's course picker). */
  filtersEnd?: ReactNode;
}) {
  const { isPending, error, rows: all } = useInvitedSeats(orgId, courseId);
  const [filter, setFilter] = useState<InvitedFilter>("ALL");
  const [sort, setSort] = useState<{ by: InvitedSort; dir: SortDir }>({
    by: "invitedAt",
    dir: "desc",
  });

  if (isPending) return <LoadingState>Cargando invitados…</LoadingState>;
  if (error) return <ErrorState>No pudimos cargar a los invitados.</ErrorState>;

  const q = query.trim().toLowerCase();
  const searched = all.filter(({ seat }) => !q || seat.email.toLowerCase().includes(q));
  const countOf = (f: InvitedFilter) =>
    f === "ALL" ? searched.length : searched.filter(({ seat }) => seat.status === f).length;
  const rows = sortRows(
    searched.filter(({ seat }) => filter === "ALL" || seat.status === filter),
    INVITED_SORT[sort.by].key,
    sort.dir,
  );
  const onSort = (field: InvitedSort) =>
    setSort((s) => nextSort(s, field, INVITED_SORT[field].first));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Estado de la invitación">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              aria-pressed={filter === f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                "cursor-pointer rounded-full px-3.5 py-2 text-[13px] font-extrabold transition-colors",
                filter === f.value
                  ? "bg-text text-on-dark"
                  : "bg-fill text-text hover:bg-fill-dark",
              )}
            >
              {f.label} · {countOf(f.value)}
            </button>
          ))}
        </div>
        {filtersEnd ? (
          <div className="ml-auto flex flex-wrap items-center gap-2">{filtersEnd}</div>
        ) : null}
      </div>

      <div className="border-border bg-surface overflow-x-auto rounded-2xl border">
        <div className="min-w-[640px] px-5 py-2">
          <div
            className={cn(
              GRID,
              "border-border text-text-muted border-b py-3 text-xs font-extrabold tracking-wider",
            )}
          >
            <SortHeader label="EMAIL" field="email" sort={sort} onSort={onSort} />
            <SortHeader label="CURSO" field="course" sort={sort} onSort={onSort} />
            <SortHeader label="ESTADO" field="status" sort={sort} onSort={onSort} />
            <SortHeader label="INVITADO" field="invitedAt" sort={sort} onSort={onSort} />
          </div>
          {rows.map(({ seat, purchaseId, courseName, purchaseStatus }) => {
            const reminded = seat.lastReminderAt ?? seat.autoReminderSentAt;
            return (
              <Link
                key={seat.id}
                href={`/dashboard/purchases/${purchaseId}`}
                className={cn(
                  GRID,
                  "border-fill hover:bg-background items-center border-b py-3 last:border-b-0",
                )}
              >
                <span className="flex min-w-0 flex-col">
                  <span
                    className={cn(
                      "truncate text-[15px] font-bold",
                      isErasedEmail(seat.email) && "text-text-muted italic",
                    )}
                  >
                    {seatEmailLabel(seat.email)}
                  </span>
                  {reminded ? (
                    <span className="text-text-muted text-xs">
                      Último recordatorio el {formatDate(reminded)}
                    </span>
                  ) : null}
                </span>
                <span className="text-text-muted truncate text-sm">{courseName}</span>
                <span>
                  <SeatStatusPill status={seat.status} purchaseStatus={purchaseStatus} />
                </span>
                <span className="text-text-muted text-sm">
                  {seat.invitedAt ? formatDate(seat.invitedAt) : "—"}
                </span>
              </Link>
            );
          })}
          {rows.length === 0 ? (
            <div className="flex flex-col items-center gap-1.5 py-10 text-center">
              <p className="font-display text-lg font-bold">
                {q ? "No encontramos a nadie" : "No hay invitaciones en este filtro"}
              </p>
              <p className="text-text-muted text-sm">
                {q
                  ? "Probá con otro email."
                  : "Quienes aceptan la invitación pasan a la lista de participantes."}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
