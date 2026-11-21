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
 * The course rows a participant's table shows: filtered by course name (case and accents
 * ignored) and state, then sorted (ties by course name). Does not touch the list it gets.
 */
export function visibleTraining(
  rows: CourseTraining[],
  filters: { course: string; status: TrainingStatus | "ALL" },
  sort: { by: TrainingSort; direction: "asc" | "desc" },
): CourseTraining[] {
  const plain = (s: string) =>
    s
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase();
  const needle = plain(filters.course.trim());
  const sign = sort.direction === "asc" ? 1 : -1;
  return rows
    .filter((r) => !needle || plain(r.courseName ?? "").includes(needle))
    .filter((r) => filters.status === "ALL" || r.status === filters.status)
    .sort((a, b) => sign * compare(a, b, sort.by) || compare(a, b, "course"));
}
