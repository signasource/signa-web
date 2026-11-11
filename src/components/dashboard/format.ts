/** Shared formatters for the usage dashboard (dates, relative ages, license expiry tones). */

const SHORT_DATE = new Intl.DateTimeFormat("es-AR", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

/** A short UTC date ("12 dic 2026") from an ISO-8601 instant; "—" when absent/unparseable. */
export function fmtShortDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : SHORT_DATE.format(d);
}

/** Whole days between now and an ISO instant (negative = in the past); `null` when absent. */
export function daysUntil(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return Math.round((d.getTime() - Date.now()) / 86_400_000);
}

/** Whole days since an ISO instant in the past; `null` when absent. */
export function daysSince(iso: string | null | undefined): number | null {
  const until = daysUntil(iso);
  return until == null ? null : -until;
}

export type ExpiryTone = "danger" | "warning" | "neutral";

/** A license expiry reads as a renewal risk when it's close: ≤15 d danger, ≤30 d warning. */
export function expiryTone(iso: string | null | undefined): ExpiryTone {
  const d = daysUntil(iso);
  if (d == null) return "neutral";
  if (d <= 15) return "danger";
  if (d <= 30) return "warning";
  return "neutral";
}
