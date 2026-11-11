import { describe, expect, it } from "vitest";
import { courseLessonHref, findLesson, pickVersionForCourse } from "@/lib/course-deep-link";
import type { AdminCourseVersionListItem, AdminTopic } from "@/lib/api/admin";

const topic = (id: string, lessons: string[]): AdminTopic => ({
  id,
  title: id,
  subtitle: null,
  description: null,
  lessons: lessons.map((l) => ({ id: l, name: l, description: null, blocks: [] })),
});

const version = (
  id: string,
  courseId: string,
  status: AdminCourseVersionListItem["status"],
  updatedAt: string | null,
) => ({ id, courseId, status, updatedAt }) as AdminCourseVersionListItem;

describe("course deep links", () => {
  it("builds the editor link", () => {
    expect(courseLessonHref("c1", "l2")).toBe("/admin/courses?course=c1&lesson=l2");
    expect(courseLessonHref("c1")).toBe("/admin/courses?course=c1");
  });

  it("finds a lesson's topic and position", () => {
    const detail = { topics: [topic("t1", ["a", "b"]), topic("t2", ["c"])] };
    expect(findLesson(detail, "c")).toEqual({ topic: 1, lesson: 0 });
    expect(findLesson(detail, "b")).toEqual({ topic: 0, lesson: 1 });
    expect(findLesson(detail, "zzz")).toBeNull();
  });

  it("opens the published version, else the latest one", () => {
    const versions = [
      version("v1", "c1", "DRAFT", "2026-11-01"),
      version("v2", "c1", "PUBLISHED", "2026-10-01"),
      version("v3", "c2", "DRAFT", "2026-10-01"),
      version("v4", "c2", "ARCHIVED", "2026-11-05"),
    ];
    expect(pickVersionForCourse(versions, "c1")?.id).toBe("v2");
    expect(pickVersionForCourse(versions, "c2")?.id).toBe("v4");
    expect(pickVersionForCourse(versions, "none")).toBeNull();
  });
});
