"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/dashboard/icons";
import { PeriodSelect } from "@/components/dashboard/period-select";
import { PurchaseStatusPill, RefundRequestPill } from "@/components/dashboard/purchase-status";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeading,
  headerButton,
} from "@/components/dashboard/ui";
import { useAuth } from "@/features/auth/auth-context";
import { organizationsApi } from "@/lib/api/organizations";
import type { PurchaseStatus } from "@/lib/api/types";
import { formatDate } from "@/lib/dashboard-format";
import type { Period } from "@/lib/date-range";
import { PURCHASE_FILTERS, formatMoney, visiblePurchases } from "@/lib/purchases";
import { cn } from "@/lib/utils";

const GRID =
  "grid grid-cols-[130px_minmax(200px,2fr)_80px_110px_minmax(120px,1fr)_160px] items-center gap-4";

/**
 * The organization's purchases: only what each purchase is (date, course, seats, days, amount,
 * payment state). Filter by payment state and by the purchase date; sort by the purchase date.
 */
export default function PurchasesPage() {
  const { organization } = useAuth();
  const orgId = organization?.id;
  const canBuy = organization?.status === "ACTIVE";
  const [status, setStatus] = useState<PurchaseStatus | "ALL">("ALL");
  const [period, setPeriod] = useState<Period>(null);
  const [direction, setDirection] = useState<"asc" | "desc">("desc");

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

  const rows = data ? visiblePurchases(data, { status, period, direction }) : [];

  return (
    <section className="flex flex-col gap-5">
      <PageHeading
        title="Compras"
        subtitle="Cada compra es independiente: tiene sus cupos, su plazo de invitación y sus fechas de acceso."
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
        />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Estado del pago">
              {PURCHASE_FILTERS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  aria-pressed={status === f.value}
                  onClick={() => setStatus(f.value)}
                  className={cn(
                    "cursor-pointer rounded-full px-3.5 py-2 text-[13px] font-extrabold transition-colors",
                    status === f.value
                      ? "bg-text text-on-dark"
                      : "bg-fill text-text hover:bg-fill-dark",
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="ml-auto">
              <PeriodSelect
                value={period}
                onChange={setPeriod}
                prefix="Fecha de compra"
                hint="Filtra por el día en que se hizo la compra."
              />
            </div>
          </div>

          <div className="border-border bg-surface overflow-x-auto rounded-2xl border">
            <div className="min-w-[860px] px-5 py-2">
              <div
                className={cn(
                  GRID,
                  "border-border text-text-muted border-b py-3 text-xs font-extrabold tracking-wider",
                )}
              >
                <button
                  type="button"
                  onClick={() => setDirection((d) => (d === "desc" ? "asc" : "desc"))}
                  title="Ordenar por fecha de compra"
                  aria-label={`Ordenar por fecha de compra: ${direction === "desc" ? "más recientes primero" : "más antiguas primero"}`}
                  className="hover:text-text text-text inline-flex cursor-pointer items-center gap-1 text-left tracking-wider"
                >
                  FECHA
                  <Icon
                    name={direction === "desc" ? "arrowDown" : "arrowUp"}
                    className="size-3.5"
                  />
                </button>
                <span>CURSO</span>
                <span className="text-right">CUPOS</span>
                <span className="text-right">DURACIÓN</span>
                <span className="text-right">TOTAL</span>
                <span>ESTADO</span>
              </div>
              {rows.map((p) => (
                <Link
                  key={p.id}
                  href={`/dashboard/purchases/${p.id}`}
                  className={cn(GRID, "border-fill hover:bg-background border-b py-3.5")}
                >
                  <span className="text-text-muted text-sm">{formatDate(p.createdAt)}</span>
                  <span className="font-display text-[15px] font-bold">{p.courseName}</span>
                  <span className="text-right text-sm font-bold">{p.seats}</span>
                  <span className="text-right text-sm">{p.durationDays} días</span>
                  <span className="text-right text-sm font-extrabold">
                    {formatMoney(p.totalAmount, p.currency)}
                  </span>
                  <span>
                    {p.hasRefundRequest ? (
                      <RefundRequestPill />
                    ) : (
                      <PurchaseStatusPill status={p.status} />
                    )}
                  </span>
                </Link>
              ))}
              {rows.length === 0 ? (
                <p className="text-text-muted py-8 text-center text-sm">
                  No hay compras con estos filtros.
                </p>
              ) : null}
            </div>
          </div>
          <p className="text-text-muted text-sm font-semibold">
            {rows.length} {rows.length === 1 ? "compra" : "compras"}
          </p>
        </>
      )}
    </section>
  );
}
