import type { AdminCourseVersionDetail, AdminCourseVersionListItem } from "@/lib/api/admin";

/**
 * Deep links into the course editor (`/admin/courses?course=<id>&lesson=<id>`), used by the usage
 * dashboard's "Abrir" / "Ver lección" actions and the sign editor's "Abrir lección". `version` pins
 * the exact course version (otherwise the published one, else the latest).
 */
export function courseLessonHref(courseId: string, lessonId?: string, versionId?: string): string {
  const params = new URLSearchParams({ course: courseId });
  if (lessonId) params.set("lesson", lessonId);
  if (versionId) params.set("version", versionId);
  return `/admin/courses?${params.toString()}`;
}

/** Where a lesson sits in a version's outline (topic and lesson indexes), or `null`. */
export function findLesson(
  detail: Pick<AdminCourseVersionDetail, "topics">,
  lessonId: string,
): { topic: number; lesson: number } | null {
  for (let t = 0; t < detail.topics.length; t += 1) {
    const l = detail.topics[t]!.lessons.findIndex((lesson) => lesson.id === lessonId);
    if (l >= 0) return { topic: t, lesson: l };
  }
  return null;
}

/** The version a link to a course opens: its published one, else the most recently updated. */
export function pickVersionForCourse(
  versions: AdminCourseVersionListItem[],
  courseId: string,
): AdminCourseVersionListItem | null {
  const ofCourse = versions.filter((v) => v.courseId === courseId);
  return (
    ofCourse.find((v) => v.status === "PUBLISHED") ??
    [...ofCourse].sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""))[0] ??
    null
  );
}
