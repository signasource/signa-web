import type { HomeFollowUpParticipant, OrganizationInvitation } from "@/lib/api/types";
import { daysSince, formatRelativeDays } from "@/lib/dashboard-format";

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
  return participant.reasons.map((reason) => {
    switch (reason) {
      case "ACCESS_EXPIRING":
        return participant.accessExpiresAt
          ? `Acceso: ${formatExpiresIn(participant.accessExpiresAt, now).toLowerCase()}`
          : "Acceso por vencer";
      case "INACTIVE": {
        const days = daysSince(participant.lastActivityAt, now);
        return days === null
          ? "Nunca empezó"
          : `Sin actividad · ${formatRelativeDays(days).toLowerCase()}`;
      }
      case "LOW_PROGRESS":
        return participant.expectedProgressPercentage === null
          ? "Poco avance"
          : `Poco avance · debería ir por ${participant.expectedProgressPercentage}%`;
    }
  });
}
