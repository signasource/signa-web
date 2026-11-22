import type { RefundRequestReason } from "@/lib/api/types";

/**
 * The reasons a buyer picks when asking for a refund — the same list for organization seats, gems
 * and courses (`signa-api` `RefundRequestReason`, mirrored in `signa-mobile`). A reason is required
 * for every refund; the comment is optional. Labels are in the buyer's voice.
 */
export const REFUND_REASON_OPTIONS: { value: RefundRequestReason; label: string }[] = [
  { value: "MISTAKE", label: "Me equivoqué al comprar" },
  { value: "DUPLICATE", label: "Compra duplicada" },
  { value: "NOT_RECEIVED", label: "No recibí lo que esperaba" },
  { value: "NOT_AS_EXPECTED", label: "El curso no era lo esperado" },
  { value: "TECHNICAL", label: "Problemas técnicos" },
  { value: "OTHER", label: "Otro motivo" },
];

export const REFUND_REASON_VALUES = REFUND_REASON_OPTIONS.map((o) => o.value) as [
  RefundRequestReason,
  ...RefundRequestReason[],
];

/**
 * Back-office labels for every reason a refund can carry: the buyer's reasons, the automatic ones
 * of a seat payment, and the two the "Motivos de reembolso" metric adds (`CHARGEBACK` for a
 * disputed charge, `UNSPECIFIED` for a refund made outside Signa or before a reason was required).
 */
const ADMIN_REFUND_REASON_LABEL: Record<string, string> = {
  NOT_RECEIVED: "No recibí lo que compré",
  MISTAKE: "Compré por error",
  DUPLICATE: "Me cobraron dos veces",
  TECHNICAL: "Problema técnico",
  NOT_AS_EXPECTED: "No era lo que esperaba",
  OTHER: "Otro",
  PURCHASE_CANCELLED: "Pago de una compra cancelada",
  ALREADY_PAID: "Pago duplicado",
  AMOUNT_MISMATCH: "Monto distinto al de la compra",
  BUYER_REQUESTED: "Arrepentimiento de la organización",
  EXTERNAL_REFUND: "Reembolsado desde Mercado Pago",
  CHARGEBACK: "Contracargo",
  UNSPECIFIED: "Sin motivo registrado",
};

/** The back-office label of a refund reason (legacy requests may have none). */
export function refundReasonLabel(reason: string | null | undefined): string {
  if (!reason) return "Sin motivo";
  return ADMIN_REFUND_REASON_LABEL[reason] ?? reason;
}
