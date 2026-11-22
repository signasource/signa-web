"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { fmtShortDate } from "@/components/dashboard/format";
import { Icon } from "@/components/dashboard/icons";
import { fmtMoney } from "@/components/dashboard/perf-format";
import {
  SALE_TYPE_LABEL,
  salesForView,
  salesTotals,
  type SalesView,
} from "@/components/dashboard/sales-math";
import { NUMBER } from "@/components/dashboard/usage-business";
import { pct1 } from "@/components/dashboard/usage-math";
import { SortTh } from "@/components/admin/sort-th";
import { adminPurchaseHref } from "@/lib/admin-purchase-link";
import type { Sale } from "@/lib/api/metrics";
import { refundReasonLabel } from "@/lib/refund-reasons";
import { nextSort, sortRows, type SortDir, type SortValue } from "@/lib/table-sort";

type SaleSort = "paidAt" | "type" | "product" | "buyer" | "amount" | "reason";

/** What each column of the list orders by, and its first direction. */
const SALE_SORT: Record<SaleSort, { key: (s: Sale) => SortValue; first: SortDir }> = {
  paidAt: { key: (s) => s.paidAt, first: "desc" },
  type: { key: (s) => SALE_TYPE_LABEL[s.type], first: "asc" },
  product: { key: (s) => s.productName, first: "asc" },
  buyer: { key: (s) => s.buyerName, first: "asc" },
  amount: { key: (s) => s.amount, first: "desc" },
  reason: { key: (s) => (s.refundReason ? refundReasonLabel(s.refundReason) : null), first: "asc" },
};

const TH = "px-0 pt-0 pb-2 pl-3 text-xs font-bold";

const TITLE: Record<SalesView, string> = {
  income: "Compras que suman a los ingresos",
  refund_rate: "Compras reembolsadas",
};

/** The line under the title that ties the list to the number on the card. */
function summary(view: SalesView, sales: Sale[]): string {
  const t = salesTotals(sales);
  const paid = (n: number) =>
    `${NUMBER.format(n)} ${n === 1 ? "compra pagada" : "compras pagadas"} en el período`;
  if (view === "income") {
    return `${paid(t.netCount)} y no ${t.netCount === 1 ? "reembolsada" : "reembolsadas"} · ${fmtMoney(t.net)}`;
  }
  return `De ${paid(t.count)}, ${t.refundedCount === 1 ? "se reembolsó" : "se reembolsaron"} ${NUMBER.format(t.refundedCount)} (${pct1(t.refundRate)})`;
}

/**
 * The purchases behind a "Negocio" counter (Ingresos, or the refunded ones behind Tasa de
 * reembolsos), opened by clicking the card. Each row links to the purchase in the back-office
 * "Compras" page. Rendered in a portal: the dashboard cards keep a transform (their enter
 * animation), which would trap a fixed overlay inside the card. Escape, the backdrop or the ✕
 * close it; focus moves to the ✕ on open and back to the card on close.
 */
export function SalesListDialog({
  view,
  sales,
  onClose,
}: {
  view: SalesView;
  sales: Sale[];
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const [sort, setSort] = useState<{ by: SaleSort; dir: SortDir }>({ by: "paidAt", dir: "desc" });
  const rows = sortRows(salesForView(sales, view), SALE_SORT[sort.by].key, sort.dir);
  const onSort = (field: SaleSort) => setSort((s) => nextSort(s, field, SALE_SORT[field].first));
  const total = rows.reduce((sum, s) => sum + s.amount, 0);
  const refunds = view === "refund_rate";

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previous?.focus?.();
    };
  }, [onClose]);

  return createPortal(
    <div
      className="bg-ink-900/50 fixed inset-0 z-60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="bg-surface flex max-h-[85vh] w-[920px] max-w-full flex-col gap-3 rounded-2xl p-5 shadow-[0_24px_60px_rgba(30,23,20,.25)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="font-display text-xl font-extrabold">
              {TITLE[view]}
            </h2>
            <p className="text-text-muted mt-0.5 text-[13px] text-pretty">{summary(view, sales)}</p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="text-text-muted hover:bg-fill hover:text-text -mt-1 -mr-1 grid size-9 shrink-0 cursor-pointer place-items-center rounded-full"
          >
            <Icon name="close" className="size-5" />
          </button>
        </div>

        {rows.length === 0 ? (
          <p className="text-text-muted py-6 text-center text-sm">
            No hay compras para mostrar en este período.
          </p>
        ) : (
          <div className="min-h-0 overflow-auto">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead className="bg-surface sticky top-0">
                <tr className="text-text-muted text-left text-xs font-bold">
                  <SortTh
                    label="Pagada"
                    field="paidAt"
                    sort={sort}
                    onSort={onSort}
                    className={`${TH} pl-0`}
                  />
                  <SortTh label="Tipo" field="type" sort={sort} onSort={onSort} className={TH} />
                  <SortTh
                    label="Producto"
                    field="product"
                    sort={sort}
                    onSort={onSort}
                    className={TH}
                  />
                  <SortTh
                    label="Comprador"
                    field="buyer"
                    sort={sort}
                    onSort={onSort}
                    className={TH}
                  />
                  <SortTh
                    label="Importe"
                    field="amount"
                    sort={sort}
                    onSort={onSort}
                    align="right"
                    className={TH}
                  />
                  {refunds ? (
                    <SortTh
                      label="Motivo"
                      field="reason"
                      sort={sort}
                      onSort={onSort}
                      className={TH}
                    />
                  ) : null}
                  <th className="pb-2 pl-3">
                    <span className="sr-only">Detalle</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => (
                  <tr key={`${s.type}:${s.id}`} className="border-fill border-t align-top">
                    <td className="py-2 whitespace-nowrap">{fmtShortDate(s.paidAt)}</td>
                    <td className="py-2 pl-3">{SALE_TYPE_LABEL[s.type]}</td>
                    <td className="py-2 pl-3">
                      <span className="font-extrabold">{s.productName}</span>
                      <span className="text-text-muted block text-xs">{s.productDetail}</span>
                    </td>
                    <td className="py-2 pl-3">{s.buyerName}</td>
                    <td className="py-2 pl-3 text-right font-extrabold whitespace-nowrap">
                      {fmtMoney(s.amount)}
                    </td>
                    {refunds ? (
                      <td className="py-2 pl-3">
                        <span className="text-danger font-bold">
                          {refundReasonLabel(s.refundReason)}
                        </span>
                        <span className="text-text-muted block text-xs">
                          {s.refundedAt ? `el ${fmtShortDate(s.refundedAt)}` : ""}
                        </span>
                      </td>
                    ) : null}
                    <td className="py-2 pl-3 text-right whitespace-nowrap">
                      <Link
                        href={adminPurchaseHref(s.id, s.type)}
                        aria-label={`Ver la compra de ${s.buyerName}: ${s.productName}`}
                        className="border-border hover:bg-fill text-primary inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-extrabold"
                      >
                        Ver compra
                        <Icon name="chevronForward" className="size-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-border border-t-2">
                  <td colSpan={4} className="py-2 font-bold">
                    Total ({NUMBER.format(rows.length)})
                  </td>
                  <td className="py-2 pl-3 text-right font-extrabold whitespace-nowrap">
                    {fmtMoney(total)}
                  </td>
                  <td colSpan={refunds ? 2 : 1} />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
