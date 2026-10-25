"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { PurchaseStatusPill } from "@/components/dashboard/purchase-status";
import { adminApi, type AdminPurchase } from "@/lib/api/admin";
import type { PurchaseStatus } from "@/lib/api/types";
import { formatMoney } from "@/lib/purchases";
import { cn } from "@/lib/utils";

const TABS: { label: string; value: PurchaseStatus | "ALL" }[] = [
  { label: "Pendientes de pago", value: "PENDING_PAYMENT" },
  { label: "Pagadas", value: "PAID" },
  { label: "Canceladas", value: "CANCELLED" },
  { label: "Todas", value: "ALL" },
];

function ConfirmPayment({ item }: { item: AdminPurchase }) {
  const qc = useQueryClient();
  const [reference, setReference] = useState("");
  const confirm = useMutation({
    mutationFn: () => adminApi.confirmPayment(item.purchase.id, reference.trim()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "purchases"] }),
  });

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-2">
        <input
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          maxLength={100}
          placeholder="Referencia del pago"
          aria-label="Referencia del pago"
          className="border-border bg-surface w-44 rounded-lg border px-3 py-1.5 text-sm"
        />
        <button
          type="button"
          disabled={confirm.isPending}
          onClick={() => confirm.mutate()}
          className="bg-primary rounded-xl px-3 py-1.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
        >
          {confirm.isPending ? "Confirmando…" : "Confirmar pago"}
        </button>
      </div>
      {confirm.error ? (
        <span className="text-danger text-xs">No pudimos confirmar el pago.</span>
      ) : null}
    </div>
  );
}

export default function AdminPurchasesPage() {
  const [tab, setTab] = useState<PurchaseStatus | "ALL">("PENDING_PAYMENT");
  const { data, isPending, error } = useQuery({
    queryKey: ["admin", "purchases", tab],
    queryFn: () => adminApi.purchases(tab === "ALL" ? undefined : tab),
  });

  return (
    <div className="min-w-0">
      <div className="mb-6">
        <h1 className="font-display text-text text-2xl font-bold">Compras de cupos</h1>
        <p className="text-text-muted mt-0.5 text-sm">
          Confirmá el pago de una compra para que se envíen las invitaciones. Cuando esté integrado
          Mercado Pago, se confirman solas.
        </p>
      </div>

      <div className="border-border mb-6 flex gap-1 border-b">
        {TABS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setTab(value)}
            className={cn(
              "px-4 py-2 text-sm font-semibold transition-colors",
              tab === value
                ? "border-primary text-primary border-b-2"
                : "text-text-muted hover:text-text",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {isPending ? (
        <p className="text-text-muted">Cargando…</p>
      ) : error ? (
        <p className="text-danger">No pudimos cargar los datos.</p>
      ) : (
        <div className="border-border bg-surface overflow-x-auto rounded-2xl border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-border bg-fill text-text-muted border-b">
                <th className="px-5 py-3 text-left font-semibold">Organización</th>
                <th className="px-5 py-3 text-left font-semibold">Curso</th>
                <th className="px-5 py-3 text-left font-semibold">Cupos</th>
                <th className="px-5 py-3 text-left font-semibold">Total</th>
                <th className="px-5 py-3 text-left font-semibold">Estado</th>
                <th className="px-5 py-3 text-right font-semibold">Pago</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-text-muted px-5 py-10 text-center">
                    No hay compras con este filtro.
                  </td>
                </tr>
              )}
              {data.map((item) => (
                <tr key={item.purchase.id} className="border-border border-b last:border-0">
                  <td className="px-5 py-4">
                    <p className="text-text font-semibold">{item.organizationName}</p>
                    <p className="text-text-muted mt-0.5 text-xs">
                      {new Date(item.purchase.createdAt).toLocaleDateString("es-AR")}
                    </p>
                  </td>
                  <td className="text-text px-5 py-4">{item.purchase.courseName}</td>
                  <td className="text-text-muted px-5 py-4">
                    {item.purchase.seats} × {item.purchase.durationDays} días
                  </td>
                  <td className="text-text px-5 py-4 font-semibold">
                    {formatMoney(item.purchase.totalAmount, item.purchase.currency)}
                  </td>
                  <td className="px-5 py-4">
                    <PurchaseStatusPill status={item.purchase.status} />
                  </td>
                  <td className="px-5 py-4 text-right">
                    {item.purchase.status === "PENDING_PAYMENT" ? (
                      <ConfirmPayment item={item} />
                    ) : (
                      <span className="text-text-muted text-xs">
                        {item.purchase.paidAt
                          ? `${new Date(item.purchase.paidAt).toLocaleDateString("es-AR")}${item.paymentReference ? ` · ${item.paymentReference}` : ""}`
                          : "—"}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
