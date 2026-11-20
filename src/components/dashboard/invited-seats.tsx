"use client";

import Link from "next/link";
import { useState } from "react";
import { SeatStatusPill } from "@/components/dashboard/purchase-status";
import { ErrorState, LoadingState } from "@/components/dashboard/ui";
import { useInvitedSeats } from "@/features/dashboard/use-invited-seats";
import type { SeatStatus } from "@/lib/api/types";
import { formatDate } from "@/lib/dashboard-format";
import { isErasedEmail, seatEmailLabel } from "@/lib/purchases";
import { cn } from "@/lib/utils";

type InvitedFilter = SeatStatus | "ALL";

const FILTERS: { value: InvitedFilter; label: string }[] = [
  { value: "ALL", label: "Todas" },
  { value: "INVITED", label: "Enviadas" },
  { value: "INVITATION_EXPIRED", label: "Vencidas" },
];

const GRID = "grid grid-cols-[minmax(220px,2fr)_minmax(160px,1.4fr)_150px_120px] gap-4";

/** People invited by email who have not accepted yet, with the state of each invitation. */
export function InvitedSeats({
  orgId,
  courseId,
  query,
}: {
  orgId: string | undefined;
  courseId: string | undefined;
  query: string;
}) {
  const { isPending, error, rows: all } = useInvitedSeats(orgId, courseId);
  const [filter, setFilter] = useState<InvitedFilter>("ALL");

  if (isPending) return <LoadingState>Cargando invitados…</LoadingState>;
  if (error) return <ErrorState>No pudimos cargar a los invitados.</ErrorState>;

  const q = query.trim().toLowerCase();
  const rows = all.filter(
    ({ seat }) =>
      (filter === "ALL" || seat.status === filter) && (!q || seat.email.toLowerCase().includes(q)),
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Estado de la invitación">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            aria-pressed={filter === f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              "cursor-pointer rounded-full px-3.5 py-2 text-[13px] font-extrabold transition-colors",
              filter === f.value ? "bg-text text-on-dark" : "bg-fill text-text hover:bg-fill-dark",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="border-border bg-surface overflow-x-auto rounded-2xl border">
        <div className="min-w-[640px] px-5 py-2">
          <div
            className={cn(
              GRID,
              "border-border text-text-muted border-b py-3 text-xs font-extrabold tracking-wider",
            )}
          >
            <span>EMAIL</span>
            <span>CURSO</span>
            <span>ESTADO</span>
            <span>INVITADO</span>
          </div>
          {rows.map(({ seat, purchaseId, courseName, purchaseStatus }) => {
            const reminded = seat.lastReminderAt ?? seat.autoReminderSentAt;
            return (
              <Link
                key={seat.id}
                href={`/dashboard/purchases/${purchaseId}`}
                className={cn(GRID, "border-fill hover:bg-background items-center border-b py-3")}
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
