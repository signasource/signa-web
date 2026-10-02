import type { MemberStatus } from "@/lib/api/types";

const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const DAY_MS = 86_400_000;
export const ACTIVE_WINDOW_DAYS = 7;

function parse(iso: string): Date {
  return new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
}

/** "2 oct 2026" — local-time calendar date. Pass an ISO instant or a yyyy-mm-dd date. */
export function formatDate(iso: string): string {
  const d = parse(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** "5 oct" — week labels for charts. */
export function formatDayMonth(iso: string): string {
  const d = parse(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/** Whole calendar days between `iso` and `now`, or null when there is no date. */
export function daysSince(iso: string | null, now: Date = new Date()): number | null {
  if (!iso) return null;
  const start = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  return Math.max(0, Math.round((start(now) - start(parse(iso))) / DAY_MS));
}

export function formatRelativeDays(days: number | null): string {
  if (days === null) return "Nunca";
  if (days === 0) return "Hoy";
  if (days === 1) return "Ayer";
  return `Hace ${days} días`;
}

export function formatMinutes(total: number): string {
  const h = Math.floor(total / 60);
  const m = Math.round(total % 60);
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

export function formatDecimal(value: number): string {
  return value.toFixed(1).replace(".", ",");
}

export function initials(name: string, lastName: string): string {
  return `${name.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export type ProgressTone = "success" | "warning" | "primary";

/** Done → green, barely started → orange, otherwise brand violet. */
export function progressTone(percent: number): ProgressTone {
  if (percent >= 100) return "success";
  if (percent < 25) return "warning";
  return "primary";
}

export type DisplayStatus = "completed" | "active" | "inactive" | "notStarted" | "removed";

export function memberDisplayStatus(member: {
  status: MemberStatus;
  progressPercentage: number;
  lastActivityAt: string | null;
}): DisplayStatus {
  if (member.status === "REMOVED") return "removed";
  if (member.progressPercentage >= 100) return "completed";
  const days = daysSince(member.lastActivityAt);
  if (days === null || member.progressPercentage === 0) return "notStarted";
  return days > ACTIVE_WINDOW_DAYS ? "inactive" : "active";
}

/** Splits "a@x.com, b@x.com\nc@x.com" into trimmed, non-empty entries. */
export function parseEmails(raw: string): string[] {
  return raw
    .split(/[\s,;]+/)
    .map((e) => e.trim())
    .filter(Boolean);
}

export function isEmail(value: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value);
}
