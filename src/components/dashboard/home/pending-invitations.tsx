"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import { Icon } from "@/components/dashboard/icons";
import { ErrorState, LoadingState, pillButton } from "@/components/dashboard/ui";
import { invitationsKey, useInvitedSeats } from "@/features/dashboard/use-invited-seats";
import { organizationsApi } from "@/lib/api/organizations";
import { formatDate } from "@/lib/dashboard-format";
import { canRemind, formatExpiresIn, pendingInvitations } from "@/lib/home-metrics";
import { isErasedEmail, seatEmailLabel } from "@/lib/purchases";
import { cn } from "@/lib/utils";

export const invitationSummaryKey = (orgId: string | undefined, courseId: string | undefined) => [
  ...invitationsKey(orgId),
  "summary",
  courseId ?? null,
];

/**
 * Invitations still waiting for an answer, with the acceptance rate below, for the course filter
 * (every course when none is chosen). Opens the list to remind people.
 */
export function PendingInvitationsCard({
  orgId,
  courseId,
  delay,
}: {
  orgId: string | undefined;
  courseId: string | undefined;
  delay?: number;
}) {
  const [open, setOpen] = useState(false);
  const summary = useQuery({
    queryKey: invitationSummaryKey(orgId, courseId),
    queryFn: () => organizationsApi.invitationSummary(orgId!, courseId),
    enabled: Boolean(orgId),
    refetchOnWindowFocus: true,
  });

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={!summary.data}
        aria-haspopup="dialog"
        className="border-border bg-surface dash-card-enter hover:border-text-muted flex cursor-pointer flex-col rounded-2xl border p-[18px] text-left transition-colors disabled:cursor-default"
        style={delay !== undefined ? ({ "--delay": `${delay}ms` } as CSSProperties) : undefined}
      >
        <span className="text-text-muted text-[13px] font-bold">Invitaciones pendientes</span>
        {summary.isPending ? (
          <span className="mt-3">
            <LoadingState>Cargando invitaciones…</LoadingState>
          </span>
        ) : summary.error ? (
          <span className="mt-3">
            <ErrorState>No pudimos cargar las invitaciones.</ErrorState>
          </span>
        ) : (
          <>
            <span className="font-display dash-stat-pop mt-1.5 text-4xl leading-10 font-extrabold tracking-tight">
              {summary.data.pending}
            </span>
            <span className="text-text-muted mt-1.5 text-[13px]">
              {summary.data.sent === 0
                ? "Todavía no enviaste invitaciones"
                : `Tasa de aceptación: ${summary.data.acceptancePercentage}% (${summary.data.accepted} de ${summary.data.sent})`}
            </span>
            <span className="text-primary-dark mt-auto inline-flex items-center gap-0.5 pt-3 text-[13px] font-bold">
              Ver listado
              <Icon name="chevronForward" className="size-3.5" />
            </span>
          </>
        )}
      </button>
      {open ? (
        <PendingInvitationsDialog
          orgId={orgId}
          courseId={courseId}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}

function PendingInvitationsDialog({
  orgId,
  courseId,
  onClose,
}: {
  orgId: string | undefined;
  courseId: string | undefined;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const { isPending, error, rows } = useInvitedSeats(orgId, courseId);
  const [notice, setNotice] = useState<string | null>(null);
  const remind = useMutation({
    mutationFn: ({ purchaseId, seatId }: { purchaseId: string; seatId: string }) =>
      organizationsApi.remindSeat(orgId!, purchaseId, seatId),
    onSuccess: async () => {
      setNotice("Mandamos el recordatorio.");
      await queryClient.invalidateQueries({ queryKey: invitationsKey(orgId) });
    },
    onError: () => setNotice(null),
  });
  const remindAll = useMutation({
    mutationFn: async (seats: { purchaseId: string; seatId: string }[]) => {
      const results = await Promise.allSettled(
        seats.map((s) => organizationsApi.remindSeat(orgId!, s.purchaseId, s.seatId)),
      );
      return {
        sent: results.filter((r) => r.status === "fulfilled").length,
        failed: results.filter((r) => r.status === "rejected").length,
      };
    },
    onSuccess: async ({ sent, failed }) => {
      setNotice(
        failed === 0
          ? `Mandamos ${sent} ${sent === 1 ? "recordatorio" : "recordatorios"}.`
          : `Mandamos ${sent} y no pudimos mandar ${failed}. Probá de nuevo más tarde.`,
      );
      await queryClient.invalidateQueries({ queryKey: invitationsKey(orgId) });
    },
  });
  const busy = remind.isPending || remindAll.isPending;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const pending = pendingInvitations(rows);
  const remindable = pending.filter(({ seat }) => canRemind(seat.nextReminderAvailableAt));

  return (
    <div
      onClick={onClose}
      className="bg-text/45 fixed inset-0 z-50 flex items-center justify-center p-5"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pending-invitations-title"
        onClick={(e) => e.stopPropagation()}
        className="bg-background flex max-h-[85vh] w-full max-w-[640px] flex-col gap-4 rounded-3xl p-7"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2
              id="pending-invitations-title"
              className="font-display text-2xl font-bold tracking-tight"
            >
              Invitaciones pendientes
            </h2>
            <p className="text-text-muted mt-1 text-sm">
              Las que vencen antes, primero. Después del vencimiento ya no se pueden aceptar.
            </p>
          </div>
          <button
            type="button"
            autoFocus
            onClick={onClose}
            aria-label="Cerrar"
            className="hover:bg-fill cursor-pointer rounded-full p-2"
          >
            <Icon name="close" className="size-5" />
          </button>
        </div>

        {pending.length > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-text-muted text-[13px]">
              {pending.length} {pending.length === 1 ? "invitación" : "invitaciones"}
            </span>
            <button
              type="button"
              disabled={remindable.length === 0 || busy}
              onClick={() =>
                remindAll.mutate(
                  remindable.map(({ seat, purchaseId }) => ({ purchaseId, seatId: seat.id })),
                )
              }
              className={pillButton}
            >
              <Icon name="mail" className="size-3.5" />
              {remindAll.isPending
                ? "Enviando…"
                : remindable.length === 0
                  ? "Todas recibieron un recordatorio"
                  : `Enviar recordatorio a todas (${remindable.length})`}
            </button>
          </div>
        ) : null}

        {notice ? (
          <p role="status" className="text-success-dark text-sm font-bold">
            {notice}
          </p>
        ) : null}
        {remind.error ? (
          <p role="alert" className="text-danger text-sm">
            No pudimos mandar el recordatorio. Probá de nuevo más tarde.
          </p>
        ) : null}

        <div className="-mx-2 overflow-y-auto px-2">
          {isPending ? <LoadingState>Cargando invitaciones…</LoadingState> : null}
          {error ? <ErrorState>No pudimos cargar las invitaciones.</ErrorState> : null}
          {!isPending && !error && pending.length === 0 ? (
            <p className="text-text-muted py-6 text-center text-sm">
              No hay invitaciones esperando respuesta.
            </p>
          ) : null}
          <ul className="flex flex-col">
            {pending.map(({ seat, purchaseId, courseName, invitationDeadline }) => {
              const reminded = seat.lastReminderAt ?? seat.autoReminderSentAt;
              const available = canRemind(seat.nextReminderAvailableAt);
              const sending = remind.isPending && remind.variables?.seatId === seat.id;
              return (
                <li
                  key={seat.id}
                  className="border-fill flex flex-wrap items-center justify-between gap-3 border-b py-3 last:border-b-0"
                >
                  <div className="flex min-w-0 flex-col">
                    <Link
                      href={`/dashboard/purchases/${purchaseId}`}
                      className={cn(
                        "truncate text-[15px] font-bold hover:underline",
                        isErasedEmail(seat.email) && "text-text-muted italic",
                      )}
                    >
                      {seatEmailLabel(seat.email)}
                    </Link>
                    <span className="text-text-muted text-xs">
                      {courseName}
                      {reminded ? ` · Último recordatorio el ${formatDate(reminded)}` : ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {invitationDeadline ? (
                      <span className="text-shop-amber-dark text-sm font-bold whitespace-nowrap">
                        {formatExpiresIn(invitationDeadline)}
                      </span>
                    ) : null}
                    <button
                      type="button"
                      disabled={!available || busy}
                      title={
                        available || !seat.nextReminderAvailableAt
                          ? undefined
                          : `Podés mandar otro recordatorio el ${formatDate(seat.nextReminderAvailableAt)}`
                      }
                      onClick={() => remind.mutate({ purchaseId, seatId: seat.id })}
                      className={pillButton}
                    >
                      <Icon name="mail" className="size-3.5" />
                      {sending
                        ? "Enviando…"
                        : available
                          ? "Enviar recordatorio"
                          : "Recordatorio enviado"}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
