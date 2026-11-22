import { describe, expect, it } from "vitest";
import type { CourseTraining } from "@/lib/api/types";
import { activityLegend, trainingTotal, visibleTraining } from "@/lib/participants";

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
  const all = { courseId: "ALL", status: "ALL" as const };

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

  it("filters by course and by state", () => {
    expect(
      ids(
        visibleTraining(ROWS, { courseId: "b", status: "ALL" }, { by: "course", direction: "asc" }),
      ),
    ).toEqual(["b"]);
    expect(
      ids(
        visibleTraining(
          ROWS,
          { courseId: "ALL", status: "INVITATION_PENDING" },
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

describe("trainingTotal", () => {
  const NOW = new Date("2026-11-22T12:00:00Z");
  const row = (over: Partial<CourseTraining>): CourseTraining => ({
    courseId: "c",
    courseName: "Curso",
    status: "ACTIVE",
    progressPercentage: 0,
    lastActivityAt: null,
    startedAt: null,
    expiresAt: null,
    ...over,
  });

  it("averages progress and picks latest activity, earliest start and nearest future expiry", () => {
    const t = trainingTotal(
      [
        row({
          progressPercentage: 40,
          lastActivityAt: "2026-11-20T10:00:00Z",
          startedAt: "2026-10-01T10:00:00Z",
          expiresAt: "2026-12-30T10:00:00Z",
        }),
        row({
          status: "INACTIVE",
          progressPercentage: 15,
          lastActivityAt: "2026-11-01T10:00:00Z",
          startedAt: "2026-09-01T10:00:00Z",
          expiresAt: "2026-12-01T10:00:00Z",
        }),
        row({ status: "INVITATION_PENDING", progressPercentage: 0 }),
      ],
      NOW,
    );
    expect(t).toMatchObject({
      courseId: null,
      status: "ACTIVE",
      progressPercentage: 28,
      lastActivityAt: "2026-11-20T10:00:00Z",
      startedAt: "2026-09-01T10:00:00Z",
      expiresAt: "2026-12-01T10:00:00Z",
    });
  });

  it("is completed only if every course is, and expired when nothing has access left", () => {
    const done = row({ status: "COMPLETED", progressPercentage: 100 });
    expect(trainingTotal([done, done], NOW).status).toBe("COMPLETED");
    const expired = row({
      status: "ACCESS_EXPIRED",
      lastActivityAt: "2026-09-01T10:00:00Z",
      expiresAt: "2026-10-01T10:00:00Z",
    });
    const t = trainingTotal([done, expired], NOW);
    expect(t.status).toBe("ACCESS_EXPIRED");
    expect(t.expiresAt).toBe("2026-10-01T10:00:00Z");
  });

  it("is inactive after 7 quiet days, not started without activity", () => {
    const old = row({ status: "INACTIVE", lastActivityAt: "2026-11-10T10:00:00Z" });
    expect(trainingTotal([old], NOW).status).toBe("INACTIVE");
    expect(trainingTotal([row({ status: "NOT_STARTED" })], NOW).status).toBe("NOT_STARTED");
  });

  it("counts pending invitations only when there is nothing else", () => {
    expect(trainingTotal([row({ status: "INVITATION_PENDING" })], NOW).status).toBe(
      "INVITATION_PENDING",
    );
    expect(trainingTotal([], NOW).status).toBe("NOT_STARTED");
  });
});
