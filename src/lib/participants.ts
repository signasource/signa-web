import type { CourseTraining, TrainingStatus } from "@/lib/api/types";

/**
 * Participant states in the organization panel. In the list a person is only active or inactive:
 * whether they entered the selected course in the last 7 days — with every course selected,
 * entering any of them is enough, and inactive means none.
 */

/** What "Activo" / "Inactivo" mean, for the selected course or for every course. */
export function activityLegend(courseName: string | null): { active: string; inactive: string } {
  if (courseName) {
    return {
      active: `Activo: entró a ${courseName} en los últimos 7 días.`,
      inactive: `Inactivo: no entró a ${courseName} en los últimos 7 días.`,
    };
  }
  return {
    active: "Activo: entró a al menos uno de los cursos en los últimos 7 días.",
    inactive: "Inactivo: no entró a ninguno de los cursos en los últimos 7 días.",
  };
}

/** Columns of the participant's course table that can be sorted. */
export type TrainingSort =
  "course" | "status" | "progress" | "lastActivity" | "startedAt" | "expiresAt";

/** Natural reading order of the states, for sorting by "Estado". */
const STATUS_ORDER: TrainingStatus[] = [
  "ACTIVE",
  "INACTIVE",
  "NOT_STARTED",
  "INVITATION_PENDING",
  "COMPLETED",
  "ACCESS_EXPIRED",
];

function compare(a: CourseTraining, b: CourseTraining, by: TrainingSort): number {
  const time = (v: string | null) => (v ? Date.parse(v) : Number.NEGATIVE_INFINITY);
  switch (by) {
    case "course":
      return (a.courseName ?? "").localeCompare(b.courseName ?? "", "es");
    case "status":
      return STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status);
    case "progress":
      return a.progressPercentage - b.progressPercentage;
    case "lastActivity":
      return time(a.lastActivityAt) - time(b.lastActivityAt);
    case "startedAt":
      return time(a.startedAt) - time(b.startedAt);
    case "expiresAt":
      return time(a.expiresAt) - time(b.expiresAt);
  }
}

/**
 * The course rows a participant's table shows: filtered by course (`"ALL"` or a course id) and
 * state, then sorted (ties by course name). Does not touch the list it gets.
 */
export function visibleTraining(
  rows: CourseTraining[],
  filters: { courseId: string; status: TrainingStatus | "ALL" },
  sort: { by: TrainingSort; direction: "asc" | "desc" },
): CourseTraining[] {
  const sign = sort.direction === "asc" ? 1 : -1;
  return rows
    .filter((r) => filters.courseId === "ALL" || r.courseId === filters.courseId)
    .filter((r) => filters.status === "ALL" || r.status === filters.status)
    .sort((a, b) => sign * compare(a, b, sort.by) || compare(a, b, "course"));
}

const ACTIVE_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * The "Todos los cursos" row for the course rows on screen, with the API's rule
 * (`OrganizationMemberQueryService.totalTraining`): average progress, latest activity, earliest
 * start, nearest upcoming expiry (else the latest past one). State: completed if all are, active if
 * there was activity in the last 7 days, expired if nothing is left with access, not started if
 * never started, else inactive. Pending invitations count only when there is nothing else.
 */
export function trainingTotal(rows: CourseTraining[], now: Date = new Date()): CourseTraining {
  const empty = { courseId: null, courseName: null, progressPercentage: 0 } as const;
  const taken = rows.filter((r) => r.status !== "INVITATION_PENDING");
  if (taken.length === 0) {
    return {
      ...empty,
      status: rows.length === 0 ? "NOT_STARTED" : "INVITATION_PENDING",
      lastActivityAt: null,
      startedAt: null,
      expiresAt: null,
    };
  }
  const times = (pick: (r: CourseTraining) => string | null) =>
    taken
      .map(pick)
      .filter((t): t is string => t !== null)
      .sort((a, b) => Date.parse(a) - Date.parse(b));
  const activity = times((r) => r.lastActivityAt);
  const starts = times((r) => r.startedAt);
  const expiries = times((r) => r.expiresAt);
  const lastActivityAt = activity.at(-1) ?? null;
  const expiresAt = expiries.find((e) => Date.parse(e) > now.getTime()) ?? expiries.at(-1) ?? null;

  let status: TrainingStatus;
  if (taken.every((r) => r.status === "COMPLETED")) status = "COMPLETED";
  else if (lastActivityAt && Date.parse(lastActivityAt) >= now.getTime() - ACTIVE_DAYS * DAY_MS)
    status = "ACTIVE";
  else if (taken.every((r) => r.status === "COMPLETED" || r.status === "ACCESS_EXPIRED"))
    status = "ACCESS_EXPIRED";
  else if (!lastActivityAt) status = "NOT_STARTED";
  else status = "INACTIVE";

  return {
    ...empty,
    status,
    progressPercentage: Math.round(
      taken.reduce((n, r) => n + r.progressPercentage, 0) / taken.length,
    ),
    lastActivityAt,
    startedAt: starts[0] ?? null,
    expiresAt,
  };
}
