import { describe, expect, it } from "vitest";
import type { CourseTraining } from "@/lib/api/types";
import { activityLegend, visibleTraining } from "@/lib/participants";

describe("activityLegend", () => {
  it("explains active and inactive for the selected course", () => {
    expect(activityLegend("LSA Salud")).toEqual({
      active: "Activo: entró a LSA Salud en los últimos 7 días.",
      inactive: "Inactivo: no entró a LSA Salud en los últimos 7 días.",
    });
  });

  it("says one course is enough to be active when every course is shown", () => {
    expect(activityLegend(null)).toEqual({
      active: "Activo: entró a al menos uno de los cursos en los últimos 7 días.",
      inactive: "Inactivo: no entró a ninguno de los cursos en los últimos 7 días.",
    });
  });
});

function course(overrides: Partial<CourseTraining>): CourseTraining {
  return {
    courseId: "c",
    courseName: "Curso",
    status: "ACTIVE",
    progressPercentage: 0,
    lastActivityAt: null,
    startedAt: null,
    expiresAt: null,
    ...overrides,
  };
}

const ROWS = [
  course({
    courseId: "a",
    courseName: "LSA Salud",
    status: "ACTIVE",
    progressPercentage: 40,
    expiresAt: "2026-12-10T00:00:00Z",
  }),
  course({
    courseId: "b",
    courseName: "Educación",
    status: "COMPLETED",
    progressPercentage: 100,
    expiresAt: "2026-12-01T00:00:00Z",
  }),
  course({ courseId: "c", courseName: "Cafetería", status: "INVITATION_PENDING" }),
];

describe("visibleTraining", () => {
  const ids = (rows: CourseTraining[]) => rows.map((r) => r.courseId);
  const all = { course: "", status: "ALL" as const };

  it("sorts by any column, both ways", () => {
    expect(ids(visibleTraining(ROWS, all, { by: "course", direction: "asc" }))).toEqual([
      "c",
      "b",
      "a",
    ]);
    expect(ids(visibleTraining(ROWS, all, { by: "progress", direction: "desc" }))).toEqual([
      "b",
      "a",
      "c",
    ]);
    // A missing date sorts first ascending (no expiry yet).
    expect(ids(visibleTraining(ROWS, all, { by: "expiresAt", direction: "asc" }))).toEqual([
      "c",
      "b",
      "a",
    ]);
    expect(ids(visibleTraining(ROWS, all, { by: "status", direction: "asc" }))).toEqual([
      "a",
      "c",
      "b",
    ]);
  });

  it("filters by course name ignoring accents and by state", () => {
    expect(
      ids(
        visibleTraining(
          ROWS,
          { course: "educacion", status: "ALL" },
          { by: "course", direction: "asc" },
        ),
      ),
    ).toEqual(["b"]);
    expect(
      ids(
        visibleTraining(
          ROWS,
          { course: "", status: "INVITATION_PENDING" },
          { by: "course", direction: "asc" },
        ),
      ),
    ).toEqual(["c"]);
  });

  it("does not reorder the list it was given", () => {
    const copy = [...ROWS];
    visibleTraining(ROWS, all, { by: "progress", direction: "asc" });
    expect(ROWS).toEqual(copy);
  });
});
