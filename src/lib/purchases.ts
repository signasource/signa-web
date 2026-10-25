import { z } from "zod";
import type { PurchaseStatus, RefundReason, SeatStatus, VolumeDiscount } from "@/lib/api/types";
import { isEmail, parseEmails } from "@/lib/dashboard-format";

export const PURCHASE_STATUS_LABEL: Record<PurchaseStatus, string> = {
  PENDING_PAYMENT: "Pendiente de pago",
  PAID: "Pagada",
  CANCELLED: "Cancelada",
};

export const SEAT_STATUS_LABEL: Record<SeatStatus, string> = {
  PENDING_PAYMENT: "Esperando el pago",
  INVITED: "Invitación enviada",
  INVITATION_EXPIRED: "Invitación vencida",
  ACTIVE: "Acceso activo",
  ACCESS_EXPIRED: "Acceso vencido",
  REVOKED: "Quitado",
  CANCELLED: "Cancelado",
};

export const REFUND_REASON_LABEL: Record<RefundReason, string> = {
  PURCHASE_CANCELLED: "Se pagó después de cancelar la compra",
  ALREADY_PAID: "La compra ya estaba pagada (pago duplicado)",
  AMOUNT_MISMATCH: "El importe no coincidía con el de la compra",
};

export const REFUNDED_MESSAGE = {
  tone: "warning" as const,
  text: "La compra estaba cancelada, así que no la activamos y te devolvimos el pago completo en Mercado Pago.",
};

export function formatMoney(amount: number, currency: string): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Best discount the seat count reaches (0 when none). */
export function volumeDiscountFor(seats: number, tiers: VolumeDiscount[]): number {
  return tiers.reduce(
    (best, tier) => (seats >= tier.minSeats ? Math.max(best, tier.percent) : best),
    0,
  );
}

/** The closest tier that would lower the price, and how many more seats it needs. */
export function nextVolumeDiscount(
  seats: number,
  tiers: VolumeDiscount[],
): { missing: number; percent: number } | null {
  const current = volumeDiscountFor(seats, tiers);
  const next = tiers
    .filter((tier) => tier.minSeats > seats && tier.percent > current)
    .sort((a, b) => a.minSeats - b.minSeats)[0];
  return next ? { missing: next.minSeats - seats, percent: next.percent } : null;
}

export type CheckoutResult = "aprobado" | "rechazado" | "pendiente";

/**
 * Mercado Pago sends the admin back to `?pago=<result>` (our back URL) plus its own params;
 * `payment_id` is the string "null" when they left without paying.
 */
export function paymentReturn(
  params: URLSearchParams,
): { result: CheckoutResult; paymentId: string | null } | null {
  const result = params.get("pago");
  if (result !== "aprobado" && result !== "rechazado" && result !== "pendiente") return null;
  const raw = params.get("payment_id") ?? params.get("collection_id");
  const paymentId = raw && /^\d+$/.test(raw) ? raw : null;
  return { result, paymentId };
}

/** What to tell the admin about a payment, by Mercado Pago's status (or our back URL result). */
export function paymentMessage(status: string): {
  tone: "success" | "warning" | "danger";
  text: string;
} {
  switch (status) {
    case "approved":
    case "aprobado":
      return {
        tone: "success",
        text: "¡Listo! Recibimos el pago y mandamos las invitaciones por email.",
      };
    case "rejected":
    case "cancelled":
    case "rechazado":
      return {
        tone: "danger",
        text: "Mercado Pago no aprobó el pago. Podés intentarlo de nuevo con otro medio de pago.",
      };
    default:
      return {
        tone: "warning",
        text: "Mercado Pago todavía está procesando el pago. Apenas se acredite, mandamos las invitaciones.",
      };
  }
}

export function uniqueEmails(raw: string): string[] {
  return [...new Set(parseEmails(raw).map((e) => e.toLowerCase()))];
}

export function emailsFromSheet(rows: unknown[][]): string[] {
  const [header, ...data] = rows;
  if (!header) return [];
  const names = header.map((cell) => String(cell ?? "").toLowerCase());
  const mailColumn = names.findIndex((name) => name.includes("mail") || name.includes("correo"));
  const column = mailColumn === -1 ? 0 : mailColumn;
  const source = mailColumn === -1 && isEmail(String(header[0] ?? "").trim()) ? rows : data;
  return source.map((row) => String(row[column] ?? "").trim()).filter((value) => isEmail(value));
}

export function daysLeft(deadline: string | null, now: Date = new Date()): number | null {
  if (!deadline) return null;
  const ms = new Date(deadline).getTime() - now.getTime();
  return ms <= 0 ? 0 : Math.ceil(ms / 86_400_000);
}

export type PurchaseLimits = { minDays: number; maxDays: number; maxSeats: number };

export function purchaseFormSchema({ minDays, maxDays, maxSeats }: PurchaseLimits) {
  return z.object({
    courseId: z.string().min(1, "Elegí un curso."),
    durationDays: z
      .number({ error: "Ingresá la cantidad de días." })
      .int("Ingresá un número entero de días.")
      .min(minDays, `El mínimo es ${minDays} días.`)
      .max(maxDays, `El máximo es ${maxDays} días.`),
    emails: z.string().superRefine((raw, ctx) => {
      const list = parseEmails(raw);
      if (list.length === 0) {
        ctx.addIssue({ code: "custom", message: "Ingresá al menos un email." });
        return;
      }
      const bad = list.find((e) => !isEmail(e));
      if (bad) {
        ctx.addIssue({ code: "custom", message: `«${bad}» no parece un email válido.` });
        return;
      }
      const seen = new Set<string>();
      const repeated = list.find((e) => {
        const key = e.toLowerCase();
        if (seen.has(key)) return true;
        seen.add(key);
        return false;
      });
      if (repeated) {
        ctx.addIssue({
          code: "custom",
          message: `«${repeated}» está repetido: cada cupo necesita un email distinto.`,
        });
        return;
      }
      if (list.length > maxSeats) {
        ctx.addIssue({ code: "custom", message: `Podés comprar hasta ${maxSeats} cupos por vez.` });
      }
    }),
  });
}

export type PurchaseForm = z.infer<ReturnType<typeof purchaseFormSchema>>;

export const seatEmailSchema = z.object({
  email: z.string().trim().refine(isEmail, "Ingresá un email válido."),
});
