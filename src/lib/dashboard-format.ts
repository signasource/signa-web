import type { MemberActivityStatus } from "@/lib/api/types";

const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const DAY_MS = 86_400_000;
export const ACTIVE_WINDOW_DAYS = 7;

function parse(iso: string): Date {
  return new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
}

export function formatDate(iso: string): string {
  const d = parse(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatDayMonth(iso: string): string {
  const d = parse(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

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

export function progressTone(percent: number): ProgressTone {
  if (percent >= 100) return "success";
  if (percent < 25) return "warning";
  return "primary";
}

/**
 * What the "current module" column says. A finished course has no module left, so it reads as
 * finished instead of naming one; with several courses the module also says which course it is.
 */
export function currentModuleLabel(
  member: {
    activityStatus: MemberActivityStatus;
    currentModule: string | null;
    currentCourse: string | null;
  },
  showCourse: boolean,
): { text: string; detail: string | null; finished: boolean } {
  if (member.activityStatus === "COMPLETED") {
    return {
      text: showCourse ? "Terminó todo" : "Terminó el curso",
      detail: null,
      finished: true,
    };
  }
  if (member.currentModule) {
    return {
      text: member.currentModule,
      detail: showCourse ? member.currentCourse : null,
      finished: false,
    };
  }
  if (member.activityStatus === "NOT_STARTED") {
    return { text: "Todavía no empezó", detail: null, finished: false };
  }
  return { text: "—", detail: null, finished: false };
}

export function parseEmails(raw: string): string[] {
  return raw
    .split(/[\s,;]+/)
    .map((e) => e.trim())
    .filter(Boolean);
}

export function isEmail(value: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value);
}
