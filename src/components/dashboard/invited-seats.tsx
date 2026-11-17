"use client";

import { useQueries, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { SeatStatusPill } from "@/components/dashboard/purchase-status";
import { ErrorState, LoadingState } from "@/components/dashboard/ui";
import { organizationsApi } from "@/lib/api/organizations";
import { formatDate } from "@/lib/dashboard-format";
import { hasInvitedSeats, invitedSeatsOf, isErasedEmail, seatEmailLabel } from "@/lib/purchases";

/** Seats bought but not accepted yet (they are not members), listed from the purchases. */
export function InvitedSeats({
  orgId,
  courseId,
  query,
}: {
  orgId: string | undefined;
  courseId: string | undefined;
  query: string;
}) {
  const purchases = useQuery({
    queryKey: ["organization", orgId, "purchases"],
    queryFn: () => organizationsApi.purchases(orgId!),
    enabled: Boolean(orgId),
  });

  const withSeats = (purchases.data ?? []).filter(
    (p) => hasInvitedSeats(p) && (!courseId || p.courseId === courseId),
  );
  const details = useQueries({
    queries: withSeats.map((p) => ({
      queryKey: ["organization", orgId, "purchases", p.id],
      queryFn: () => organizationsApi.purchase(orgId!, p.id),
      enabled: Boolean(orgId),
    })),
  });

  if (purchases.isPending || details.some((d) => d.isPending)) {
    return <LoadingState>Cargando invitados…</LoadingState>;
  }
  if (purchases.error || details.some((d) => d.error)) {
    return <ErrorState>No pudimos cargar a los invitados.</ErrorState>;
  }

  const rows = details.flatMap((d) => (d.data ? invitedSeatsOf(d.data, query) : []));

  return (
    <div className="border-border bg-surface overflow-x-auto rounded-2xl border">
      <div className="min-w-[640px] px-5 py-2">
        <div className="border-border text-text-muted grid grid-cols-[minmax(220px,2fr)_minmax(160px,1.4fr)_150px_120px] gap-4 border-b py-3 text-xs font-extrabold tracking-wider">
          <span>EMAIL</span>
          <span>CURSO</span>
          <span>ESTADO</span>
          <span>INVITADO</span>
        </div>
        {rows.map(({ seat, purchase }) => (
          <Link
            key={seat.id}
            href={`/dashboard/purchases/${purchase.id}`}
            className="border-fill hover:bg-background grid grid-cols-[minmax(220px,2fr)_minmax(160px,1.4fr)_150px_120px] items-center gap-4 border-b py-3"
          >
            <span
              className={
                isErasedEmail(seat.email)
                  ? "text-text-muted truncate text-[15px] font-bold italic"
                  : "truncate text-[15px] font-bold"
              }
            >
              {seatEmailLabel(seat.email)}
            </span>
            <span className="text-text-muted truncate text-sm">{purchase.courseName}</span>
            <span>
              <SeatStatusPill status={seat.status} purchaseStatus={purchase.status} />
            </span>
            <span className="text-text-muted text-sm">
              {seat.invitedAt ? formatDate(seat.invitedAt) : "—"}
            </span>
          </Link>
        ))}
        {rows.length === 0 ? (
          <div className="flex flex-col items-center gap-1.5 py-10 text-center">
            <p className="font-display text-lg font-bold">
              {query ? "No encontramos a nadie" : "No hay invitaciones pendientes"}
            </p>
            <p className="text-text-muted text-sm">
              {query
                ? "Probá con otro email."
                : "Quienes aceptan la invitación pasan a la lista de participantes."}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
