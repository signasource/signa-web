import { z } from "zod";
import type { PurchaseStatus, SeatStatus } from "@/lib/api/types";
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

export function formatMoney(amount: number, currency: string): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
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
