"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Card, CardTitle, ErrorState, pillButton, primaryButton } from "@/components/dashboard/ui";
import type { Purchase } from "@/lib/api/types";
import { formatDate } from "@/lib/dashboard-format";
import {
  formatMoney,
  REFUND_RULE,
  withdrawalSchema,
  type WithdrawalForm,
  type WithdrawalInput,
} from "@/lib/purchases";
import { REFUND_REASON_OPTIONS } from "@/lib/refund-reasons";
import { cn } from "@/lib/utils";

type Props = {
  purchase: Purchase;
  onConfirm: (values: WithdrawalForm) => void;
  pending: boolean;
  error: string | null;
};

/**
 * Cancels a paid purchase within the withdrawal period. The consequences are spelled out with the
 * real numbers before the admin confirms, because they cannot be undone.
 */
export function WithdrawPurchase({ purchase, onConfirm, pending, error }: Props) {
  const [confirming, setConfirming] = useState(false);
  const form = useForm<WithdrawalInput, unknown, WithdrawalForm>({
    resolver: zodResolver(withdrawalSchema),
    defaultValues: { reason: undefined, message: "" },
  });
  const total = formatMoney(purchase.totalAmount, purchase.currency);
  const active = purchase.seatCounts.active;
  const invited = purchase.seatCounts.invited;
  const until = purchase.refundableUntil ? formatDate(purchase.refundableUntil) : "";
  // Confirmed by SIGNA by hand: there is no Mercado Pago payment to give back, so the withdrawal
  // becomes a refund request that SIGNA pays back by hand (and only then the purchase is cancelled).
  const manual = purchase.paymentMethod === "MANUAL";

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 basis-72 flex-col gap-1">
          <CardTitle>Anular la compra</CardTitle>
          <p className="text-text-muted text-sm text-pretty">
            Tenés tiempo hasta el {until} para anularla.{" "}
            {manual
              ? `Como el pago lo confirmó SIGNA, te devolvemos ${total} completos a mano: te escribimos por email para coordinar la devolución.`
              : `Te devolvemos ${total} completos a través de Mercado Pago.`}{" "}
            {REFUND_RULE}
          </p>
        </div>
        {confirming ? null : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className={cn(pillButton, "text-danger")}
          >
            Anular compra
          </button>
        )}
      </div>

      {confirming ? (
        <form
          noValidate
          onSubmit={form.handleSubmit(onConfirm)}
          className="border-danger/30 bg-danger-light/40 flex flex-col gap-3 rounded-2xl border p-4"
        >
          <p className="text-sm font-bold">Al anular la compra:</p>
          <ul className="flex list-disc flex-col gap-1 pl-5 text-sm">
            <li>
              {manual
                ? `SIGNA te devuelve ${total} a mano y te escribe por email para coordinarlo. Cuando confirme la devolución, se anula la compra:`
                : `Te devolvemos ${total} al medio de pago con el que pagaste.`}
            </li>
            <li>
              {active === 0
                ? "Nadie activó el curso todavía."
                : `${active} ${active === 1 ? "persona pierde" : "personas pierden"} el acceso al curso. Su progreso se conserva.`}
            </li>
            <li>
              {invited === 0
                ? "No hay invitaciones pendientes."
                : `Se ${invited === 1 ? "anula 1 invitación pendiente" : `anulan ${invited} invitaciones pendientes`}: el link deja de funcionar.`}
            </li>
            <li>Les avisamos por email a todas las personas afectadas. No se puede deshacer.</li>
          </ul>
          <label className="flex flex-col gap-1 text-sm font-medium">
            Motivo
            <select
              id="withdraw-reason"
              defaultValue=""
              aria-invalid={Boolean(form.formState.errors.reason)}
              className="border-border bg-surface rounded-lg border px-3 py-2 text-[15px]"
              {...form.register("reason")}
            >
              <option value="" disabled>
                Elegí un motivo
              </option>
              {REFUND_REASON_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          {form.formState.errors.reason ? (
            <span role="alert" className="text-danger text-sm">
              {form.formState.errors.reason.message}
            </span>
          ) : null}
          <label className="flex flex-col gap-1 text-sm font-medium">
            Comentario (opcional)
            <textarea
              id="withdraw-message"
              rows={2}
              maxLength={500}
              placeholder="Por ejemplo: compramos el curso equivocado"
              aria-invalid={Boolean(form.formState.errors.message)}
              className="border-border bg-surface resize-y rounded-lg border px-3 py-2 text-[15px]"
              {...form.register("message")}
            />
          </label>
          {form.formState.errors.message ? (
            <span role="alert" className="text-danger text-sm">
              {form.formState.errors.message.message}
            </span>
          ) : null}
          {error ? <ErrorState>{error}</ErrorState> : null}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="submit"
              disabled={pending}
              className={cn(primaryButton, "bg-danger px-4 py-2 text-sm")}
            >
              {pending ? "Anulando y reembolsando…" : `Sí, anular y reembolsar ${total}`}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => setConfirming(false)}
              className={pillButton}
            >
              No, volver
            </button>
          </div>
        </form>
      ) : null}
    </Card>
  );
}
