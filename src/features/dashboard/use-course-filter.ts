"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { useAuth } from "@/features/auth/auth-context";
import { FROM_PARAM, TO_PARAM } from "@/features/dashboard/use-period-filter";
import type { CourseSummary } from "@/lib/api/types";

export const COURSE_PARAM = "curso";

/**
 * The course the panel is filtered by, kept in the URL (`?curso=<id>`) so it survives moving
 * between sections and can be shared. `null` means every contracted course; an id the
 * organization did not contract is ignored.
 */
export function useCourseFilter(): {
  courses: CourseSummary[];
  course: CourseSummary | null;
  courseId: string | undefined;
  setCourseId: (id: string | null) => void;
} {
  const { organization } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const courses = organization?.courses ?? [];
  const course = courses.find((c) => c.id === params.get(COURSE_PARAM)) ?? null;

  const setCourseId = useCallback(
    (id: string | null) => {
      const next = new URLSearchParams(params.toString());
      if (id) next.set(COURSE_PARAM, id);
      else next.delete(COURSE_PARAM);
      const query = next.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [params, pathname, router],
  );

  return { courses, course, courseId: course?.id, setCourseId };
}

const FILTER_PARAMS = [COURSE_PARAM, FROM_PARAM, TO_PARAM];

/** Appends the current course and period filters to a dashboard link. */
export function useWithFilters(): (href: string) => string {
  const params = useSearchParams();
  const kept = new URLSearchParams();
  for (const key of FILTER_PARAMS) {
    const value = params.get(key);
    if (value) kept.set(key, value);
  }
  const search = kept.toString();
  return useCallback((href: string) => (search ? `${href}?${search}` : href), [search]);
}
