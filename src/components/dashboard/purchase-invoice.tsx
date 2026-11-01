"use client";

import { useState } from "react";
import { CourseSigns } from "@/components/dashboard/course-signs";
import { Card, CardTitle, ErrorState, pillButton, primaryButton } from "@/components/dashboard/ui";
import type { CatalogCourse, PurchaseQuote } from "@/lib/api/types";
import { formatMoney } from "@/lib/purchases";
import { cn } from "@/lib/utils";

type Props = {
  course: CatalogCourse;
  quote: PurchaseQuote;
  emails: string[];
  invitationDays: number;
  /** Omitted once the purchase exists: editing it would leave the created one behind. */
  onBack?: () => void;
  onConfirm: () => void;
  confirming: boolean;
  error: string | null;
};

/** Summary of what the admin is about to pay, shown before going to Mercado Pago. */
export function PurchaseInvoice({
  course,
  quote,
  emails,
  invitationDays,
  onBack,
  onConfirm,
  confirming,
  error,
}: Props) {
  const [showSigns, setShowSigns] = useState(false);
  const [showEmails, setShowEmails] = useState(false);
  const money = (amount: number) => formatMoney(amount, quote.currency);
  const seatsLabel = `${quote.seats} ${quote.seats === 1 ? "cupo" : "cupos"}`;

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] items-start gap-4">
      <Card className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <CardTitle>Resumen de la compra</CardTitle>
          <p className="text-text-muted text-sm">
            Revisá los datos antes de pagar. El pago se hace en Mercado Pago.
          </p>
        </div>

        <dl className="flex flex-col text-sm">
          <div className="border-fill flex justify-between gap-3 border-b py-2.5">
            <dt className="text-text-muted">Curso</dt>
            <dd className="text-right font-extrabold">{course.name}</dd>
          </div>
          <div className="border-fill flex flex-col gap-2 border-b py-2.5">
            <div className="flex justify-between gap-3">
              <dt className="text-text-muted">Señas incluidas</dt>
              <dd className="text-right font-extrabold">{quote.signCount}</dd>
            </div>
            <button
              type="button"
              aria-expanded={showSigns}
              onClick={() => setShowSigns((value) => !value)}
              className="text-primary-dark self-start text-[13px] font-bold hover:underline"
            >
              {showSigns ? "Ocultar las señas" : "Ver las señas"}
            </button>
            {showSigns ? <CourseSigns course={course} /> : null}
          </div>
          <div className="border-fill flex flex-col gap-2 border-b py-2.5">
            <div className="flex justify-between gap-3">
              <dt className="text-text-muted">Cupos</dt>
              <dd className="text-right font-extrabold">{seatsLabel}</dd>
            </div>
            <button
              type="button"
              aria-expanded={showEmails}
              onClick={() => setShowEmails((value) => !value)}
              className="text-primary-dark self-start text-[13px] font-bold hover:underline"
            >
              {showEmails ? "Ocultar los emails" : "Ver los emails"}
            </button>
            {showEmails ? (
              <ul className="text-text-muted flex max-h-48 flex-col gap-0.5 overflow-y-auto text-[13px]">
                {emails.map((email) => (
                  <li key={email}>{email}</li>
                ))}
              </ul>
            ) : null}
          </div>
          <div className="border-fill flex justify-between gap-3 border-b py-2.5">
            <dt className="text-text-muted">Duración del acceso</dt>
            <dd className="text-right font-extrabold">{quote.durationDays} días por persona</dd>
          </div>
        </dl>
      </Card>

      <Card className="flex flex-col gap-3">
        <CardTitle>Detalle del pago</CardTitle>
        <dl className="flex flex-col text-sm">
          <div className="border-fill flex justify-between gap-3 border-b py-2">
            <dt className="text-text-muted">Precio por cupo</dt>
            <dd className="font-extrabold">{money(quote.listPricePerSeat)}</dd>
          </div>
          <div className="border-fill flex justify-between gap-3 border-b py-2">
            <dt className="text-text-muted">
              Subtotal ({seatsLabel} × {money(quote.listPricePerSeat)})
            </dt>
            <dd className="font-extrabold">{money(quote.subtotal)}</dd>
          </div>
          {quote.discountPercent > 0 ? (
            <div className="border-fill text-success-dark flex justify-between gap-3 border-b py-2">
              <dt>Descuento por volumen ({quote.discountPercent}%)</dt>
              <dd className="font-extrabold">−{money(quote.discountAmount)}</dd>
            </div>
          ) : null}
          <div className="flex items-baseline justify-between gap-3 py-2">
            <dt className="text-text-muted">Total</dt>
            <dd className="font-display text-2xl font-extrabold">{money(quote.totalAmount)}</dd>
          </div>
        </dl>
        <p className="text-text-muted text-[13px] text-pretty">
          Cuando Mercado Pago confirme el pago, mandamos una invitación a cada email. Tienen{" "}
          {invitationDays} días para aceptarla y los {quote.durationDays} días de acceso de cada
          persona empiezan cuando la acepta.
        </p>
        {error ? <ErrorState>{error}</ErrorState> : null}
        <button type="button" disabled={confirming} onClick={onConfirm} className={primaryButton}>
          {confirming ? "Yendo a Mercado Pago…" : `Pagar ${money(quote.totalAmount)}`}
        </button>
        {onBack ? (
          <button
            type="button"
            disabled={confirming}
            onClick={onBack}
            className={cn(pillButton, "self-center")}
          >
            Volver y editar
          </button>
        ) : null}
      </Card>
    </div>
  );
}
