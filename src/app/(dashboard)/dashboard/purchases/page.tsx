"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Icon } from "@/components/dashboard/icons";
import { PurchaseStatusPill } from "@/components/dashboard/purchase-status";
import {
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeading,
  headerButton,
  primaryButton,
} from "@/components/dashboard/ui";
import { useAuth } from "@/features/auth/auth-context";
import { organizationsApi } from "@/lib/api/organizations";
import type { Purchase } from "@/lib/api/types";
import { formatDate } from "@/lib/dashboard-format";
import { acceptedSeats, daysLeft, formatMoney } from "@/lib/purchases";

function windowLabel(purchase: Purchase): string {
  if (purchase.status === "PENDING_PAYMENT") return "Las invitaciones salen al confirmarse el pago";
  if (purchase.status === "CANCELLED") return "Compra cancelada";
  if (purchase.status === "REFUNDED") {
    return purchase.refundedAt
      ? `Anulada y reembolsada el ${formatDate(purchase.refundedAt)}`
      : "Anulada y reembolsada";
  }
  const left = daysLeft(purchase.invitationDeadline);
  if (left === null) return "";
  return left === 0
    ? `Plazo de invitación cerrado el ${formatDate(purchase.invitationDeadline!)}`
    : `Quedan ${left} ${left === 1 ? "día" : "días"} para aceptar (hasta el ${formatDate(purchase.invitationDeadline!)})`;
}

function PurchaseRow({ purchase }: { purchase: Purchase }) {
  const counts = purchase.seatCounts;
  const facts = [
    { label: "Aceptaron", value: acceptedSeats(counts) },
    { label: "Sin aceptar", value: counts.invited },
    { label: "Vencidas", value: counts.invitationExpired },
  ];
  return (
    <Link
      href={`/dashboard/purchases/${purchase.id}`}
      className="border-border bg-surface hover:border-primary/40 dash-card-enter flex flex-col gap-4 rounded-2xl border p-5 transition-colors"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <p className="font-display text-lg font-bold tracking-tight">{purchase.courseName}</p>
          <p className="text-text-muted text-[13px]">
            {purchase.seats} {purchase.seats === 1 ? "cupo" : "cupos"} · {purchase.durationDays}{" "}
            días de acceso · {formatMoney(purchase.totalAmount, purchase.currency)}
          </p>
        </div>
        <PurchaseStatusPill status={purchase.status} />
      </div>
      {purchase.status === "PAID" ? (
        <dl className="grid grid-cols-3 gap-3">
          {facts.map((fact) => (
            <div key={fact.label} className="bg-background rounded-xl px-3 py-2">
              <dt className="text-text-muted text-xs font-bold">{fact.label}</dt>
              <dd className="font-display text-xl font-extrabold">{fact.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      <p className="text-text-muted flex flex-wrap items-center justify-between gap-2 text-[13px]">
        <span>{windowLabel(purchase)}</span>
        <span>
          {purchase.paidAt
            ? `Pagada el ${formatDate(purchase.paidAt)}`
            : `Creada el ${formatDate(purchase.createdAt)}`}
        </span>
      </p>
    </Link>
  );
}

export default function PurchasesPage() {
  const { organization } = useAuth();
  const orgId = organization?.id;
  const canBuy = organization?.status === "ACTIVE";

  const { data, isPending, error } = useQuery({
    queryKey: ["organization", orgId, "purchases"],
    queryFn: () => organizationsApi.purchases(orgId!),
    enabled: Boolean(orgId),
  });

  const buy = canBuy ? (
    <Link href="/dashboard/purchases/new" className={headerButton}>
      <Icon name="add" className="size-4" />
      Comprar cupos
    </Link>
  ) : null;

  return (
    <section className="flex flex-col gap-5">
      <PageHeading
        title="Compras"
        subtitle="Cada compra es independiente: tiene sus cupos, su plazo de invitación de 10 días y sus fechas de acceso."
      >
        {buy}
      </PageHeading>

      {isPending ? (
        <LoadingState />
      ) : error ? (
        <ErrorState>No pudimos cargar los datos.</ErrorState>
      ) : data.length === 0 ? (
        <EmptyState
          mascot
          title="Todavía no compraste cupos"
          body={
            canBuy
              ? "Elegí un curso, la duración del acceso y cargá el email de cada persona. Cuando se confirme el pago les llega la invitación."
              : "Vas a poder comprar cupos apenas SIGNA valide tu organización."
          }
          action={
            canBuy ? (
              <Link href="/dashboard/purchases/new" className={primaryButton}>
                Comprar cupos
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {data.map((purchase) => (
            <PurchaseRow key={purchase.id} purchase={purchase} />
          ))}
        </div>
      )}
      <Card className="text-text-muted text-[13px] text-pretty">
        Las invitaciones son personales: solo las puede aceptar la cuenta del email que cargaste.
        Mientras no las acepten podés corregir el email o mandar un recordatorio desde el detalle de
        la compra; a los 5 días les mandamos uno automático. Un cupo que no se aceptó en plazo se
        pierde.
      </Card>
    </section>
  );
}
