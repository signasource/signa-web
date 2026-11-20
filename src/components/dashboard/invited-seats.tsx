"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/dashboard/icons";
import { SeatStatusPill } from "@/components/dashboard/purchase-status";
import { SeatEmailEditor } from "@/components/dashboard/seat-email-editor";
import { ErrorState, LoadingState, pillButton } from "@/components/dashboard/ui";
import { invitationsKey, useInvitedSeats } from "@/features/dashboard/use-invited-seats";
import { ApiError } from "@/lib/api/client";
import { organizationsApi } from "@/lib/api/organizations";
import type { PurchaseDetail, SeatStatus } from "@/lib/api/types";
import { formatDate } from "@/lib/dashboard-format";
import { canRemindSeat, isErasedEmail, seatEmailLabel } from "@/lib/purchases";
import { cn } from "@/lib/utils";

type InvitedFilter = SeatStatus | "ALL";

const FILTERS: { value: InvitedFilter; label: string }[] = [
  { value: "ALL", label: "Todas" },
  { value: "INVITED", label: "Enviadas" },
  { value: "INVITATION_EXPIRED", label: "Vencidas" },
];

const GRID =
  "grid grid-cols-[minmax(220px,2fr)_minmax(140px,1.2fr)_150px_110px_minmax(210px,1.4fr)] gap-4";

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
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<InvitedFilter>("ALL");
  const [editing, setEditing] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [now] = useState(() => Date.now());

  const store = async (detail: PurchaseDetail) => {
    queryClient.setQueryData(["organization", orgId, "purchases", detail.purchase.id], detail);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["organization", orgId, "purchases"] }),
      queryClient.invalidateQueries({ queryKey: invitationsKey(orgId) }),
    ]);
  };

  const updateEmail = useMutation({
    mutationFn: (v: { purchaseId: string; seatId: string; email: string }) =>
      organizationsApi.updateSeatEmail(orgId!, v.purchaseId, v.seatId, v.email),
    onSuccess: async (detail) => {
      await store(detail);
      setEditing(null);
      setNotice("Guardamos el nuevo email.");
    },
  });

  const remind = useMutation({
    mutationFn: (v: { purchaseId: string; seatId: string }) =>
      organizationsApi.remindSeat(orgId!, v.purchaseId, v.seatId),
    onSuccess: async (detail) => {
      await store(detail);
      setNotice("Mandamos el recordatorio.");
    },
  });

  if (isPending) return <LoadingState>Cargando invitados…</LoadingState>;
  if (error) return <ErrorState>No pudimos cargar a los invitados.</ErrorState>;

  const q = query.trim().toLowerCase();
  const rows = all.filter(
    ({ seat }) =>
      (filter === "ALL" || seat.status === filter) && (!q || seat.email.toLowerCase().includes(q)),
  );

  const updateError =
    updateEmail.error instanceof ApiError && updateEmail.error.status === 409
      ? "Ese email ya tiene un cupo de este curso."
      : updateEmail.error
        ? "No pudimos cambiar el email."
        : null;
  const remindError = remind.error
    ? remind.error instanceof ApiError && remind.error.status === 400
      ? "Ya mandamos un recordatorio hace poco. Probá más tarde."
      : "No pudimos mandar el recordatorio."
    : null;

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

      {notice ? (
        <p role="status" className="text-success-dark text-sm font-semibold">
          {notice}
        </p>
      ) : null}
      {remindError ? <ErrorState>{remindError}</ErrorState> : null}

      <div className="border-border bg-surface overflow-x-auto rounded-2xl border">
        <div className="min-w-[900px] px-5 py-2">
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
            <span>ACCIONES</span>
          </div>
          {rows.map(({ seat, purchaseId, courseName, purchaseStatus }) => {
            const canRemind = canRemindSeat(seat, now);
            const reminded = seat.lastReminderAt ?? seat.autoReminderSentAt;
            return (
              <div key={seat.id} className={cn(GRID, "border-fill items-center border-b py-3")}>
                {editing === seat.id ? (
                  <div className="col-span-5">
                    <SeatEmailEditor
                      seat={seat}
                      saving={updateEmail.isPending}
                      error={updateError}
                      onCancel={() => {
                        setEditing(null);
                        updateEmail.reset();
                      }}
                      onSave={(email) => updateEmail.mutate({ purchaseId, seatId: seat.id, email })}
                    />
                  </div>
                ) : (
                  <>
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
                    <span className="flex flex-wrap items-center gap-2">
                      {seat.status === "INVITED" ? (
                        <button
                          type="button"
                          disabled={!canRemind || remind.isPending}
                          title={
                            canRemind || !seat.nextReminderAvailableAt
                              ? undefined
                              : `Podés mandar otro recordatorio el ${formatDate(seat.nextReminderAvailableAt)}`
                          }
                          onClick={() => {
                            setNotice(null);
                            remind.mutate({ purchaseId, seatId: seat.id });
                          }}
                          className={pillButton}
                        >
                          <Icon name="mail" className="size-4" />
                          Recordar
                        </button>
                      ) : null}
                      {seat.canEditEmail ? (
                        <button
                          type="button"
                          onClick={() => {
                            setNotice(null);
                            updateEmail.reset();
                            setEditing(seat.id);
                          }}
                          className={pillButton}
                        >
                          Cambiar email
                        </button>
                      ) : null}
                      <Link href={`/dashboard/purchases/${purchaseId}`} className={pillButton}>
                        Ver compra
                      </Link>
                    </span>
                  </>
                )}
              </div>
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
