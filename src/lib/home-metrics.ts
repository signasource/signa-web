import type { HomeFollowUpParticipant, OrganizationInvitation } from "@/lib/api/types";
import { daysSince, formatDayMonth, formatRelativeDays } from "@/lib/dashboard-format";

const DAY_MS = 86_400_000;

/**
 * Invitations that can still be accepted, the ones about to expire first (then by email). Expired
 * invitations are left out: nobody can accept them or be reminded.
 */
export function pendingInvitations(
  rows: OrganizationInvitation[],
  now: Date = new Date(),
): OrganizationInvitation[] {
  const time = (iso: string | null) => (iso ? new Date(iso).getTime() : Number.POSITIVE_INFINITY);
  return rows
    .filter((row) => row.seat.status === "INVITED" && time(row.invitationDeadline) > now.getTime())
    .sort(
      (a, b) =>
        time(a.invitationDeadline) - time(b.invitationDeadline) ||
        a.seat.email.localeCompare(b.seat.email),
    );
}

/** Whether a reminder can be sent now; `null` means no cooldown is running. */
export function canRemind(nextReminderAvailableAt: string | null, now: Date = new Date()): boolean {
  return !nextReminderAvailableAt || new Date(nextReminderAvailableAt).getTime() <= now.getTime();
}

/** "Vence hoy", "Vence mañana", "Vence en N días", counted in whole calendar days. */
export function formatExpiresIn(iso: string, now: Date = new Date()): string {
  const start = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.max(0, Math.round((start(new Date(iso)) - start(now)) / DAY_MS));
  if (days === 0) return "Vence hoy";
  if (days === 1) return "Vence mañana";
  return `Vence en ${days} días`;
}

/** One short label per reason, in the order the API ranks them. */
export function followUpLabels(
  participant: HomeFollowUpParticipant,
  now: Date = new Date(),
): string[] {
  const expires = participant.accessExpiresAt
    ? formatExpiresIn(participant.accessExpiresAt, now).toLowerCase()
    : "vence pronto";
  return participant.reasons.map((reason) => {
    switch (reason) {
      case "ACCESS_EXPIRING":
        return `Acceso: ${expires}`;
      case "EXPIRING_WITH_LOW_PROGRESS":
        return `Menos del 50% · ${expires}`;
      case "INACTIVE": {
        const days = daysSince(participant.lastActivityAt, now);
        return days === null
          ? "Nunca empezó"
          : `Sin actividad · ${formatRelativeDays(days).toLowerCase()}`;
      }
    }
  });
}

/** "Últ. vez hoy", "Últ. vez ayer", "Últ. vez hace 3 días". */
export function formatLastSeen(iso: string | null, now: Date = new Date()): string {
  const days = daysSince(iso, now);
  return days === null ? "Sin actividad" : `Últ. vez ${formatRelativeDays(days).toLowerCase()}`;
}

/** "La salud", "La salud y En la cafetería", "A, B y C". */
function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} y ${names.at(-1)}`;
}

/**
 * What the follow-up progress bar means: lessons completed of the courses that put the person on
 * the list (already narrowed by the course filter) and when the soonest access ends.
 * "13% completado de La salud · acceso hasta el 24 nov".
 */
export function followUpProgressText(participant: HomeFollowUpParticipant): string {
  const courses = joinNames(participant.courses.map((c) => c.courseName));
  const base = courses
    ? `${participant.progressPercentage}% completado de ${courses}`
    : `${participant.progressPercentage}% completado`;
  return participant.accessExpiresAt
    ? `${base} · acceso hasta el ${formatDayMonth(participant.accessExpiresAt)}`
    : base;
}

/** Tooltip of the follow-up bar: one line per course, "La salud: 13% · vence el 24 nov". */
export function followUpCourseDetail(participant: HomeFollowUpParticipant): string {
  return participant.courses
    .map(
      (c) =>
        `${c.courseName}: ${c.progressPercentage}%` +
        (c.accessExpiresAt ? ` · vence el ${formatDayMonth(c.accessExpiresAt)}` : ""),
    )
    .join("\n");
}
