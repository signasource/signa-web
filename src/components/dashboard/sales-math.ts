import { rate1 } from "@/components/dashboard/usage-math";
import type { Sale } from "@/lib/api/metrics";

/**
 * Which counter a list of sales backs: "Ingresos" (the purchases that were not refunded) or "Tasa
 * de reembolsos" (the refunded ones, the numerator of the rate). "Dinero reembolsado" has no list.
 */
export type SalesView = "income" | "refund_rate";

/**
 * The "Negocio" counters, worked out from the purchases paid in the window so the list behind each
 * one adds up to it. A purchase counts in the period it was paid; refunds are always for the whole
 * amount. `refundRate` is by count (refunded purchases ÷ all purchases), as a percentage.
 */
export function salesTotals(sales: Sale[]) {
  let net = 0;
  let orgNet = 0;
  let refunded = 0;
  let refundedCount = 0;
  for (const s of sales) {
    if (s.refunded) {
      refunded += s.amount;
      refundedCount += 1;
    } else {
      net += s.amount;
      if (s.type === "SEATS") orgNet += s.amount;
    }
  }
  return {
    count: sales.length,
    netCount: sales.length - refundedCount,
    net,
    orgNet,
    usersNet: net - orgNet,
    refunded,
    refundedCount,
    refundRate: rate1(refundedCount, sales.length),
  };
}

/** The purchases behind a counter, newest first. */
export function salesForView(sales: Sale[], view: SalesView): Sale[] {
  const newestFirst = [...sales].sort((a, b) => b.paidAt.localeCompare(a.paidAt));
  return newestFirst.filter((s) => (view === "income" ? !s.refunded : s.refunded));
}

/** The short label of a purchase kind, for the list's "Tipo" column. */
export const SALE_TYPE_LABEL: Record<Sale["type"], string> = {
  SEATS: "Cupos",
  GEMS: "Gemas",
  COURSE: "Curso",
};
