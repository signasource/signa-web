"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { metricsApi, type PerfMetrics, type RangeParams } from "@/lib/api/metrics";
import { isAllTimeRange, type DateTimeRange } from "@/lib/datetime-range";

/** How often every widget refreshes while the dashboard is "en vivo". */
export const REFRESH_MS = 30_000;

/**
 * Shared TanStack queries for the usage dashboard. Every hook takes a range or `null` (disabled), so
 * the same hook serves the selected window and the previous equal-length window used for the
 * "vs. período anterior" deltas and dashed chart lines. Keys are
 * `["admin","metrics",<kind>,…,from,to]`, so tabs reading the same endpoint share one cache entry.
 */
function options(range: DateTimeRange | null, live: boolean) {
  return {
    enabled: range !== null,
    placeholderData: keepPreviousData,
    refetchInterval: live ? REFRESH_MS : (false as const),
  };
}

/** Converts a resolved range to API params, omitting from/to for all-time queries. */
function rangeParams(range: DateTimeRange): RangeParams {
  if (isAllTimeRange(range)) return {};
  return { from: range.from, to: range.to };
}

export function useGrowthQuery(
  range: DateTimeRange | null,
  live: boolean,
  courseIds: string[] = [],
) {
  return useQuery({
    queryKey: ["admin", "metrics", "growth", range?.from, range?.to, ...courseIds],
    queryFn: () =>
      metricsApi.growth({
        ...rangeParams(range!),
        courseIds: courseIds.length > 0 ? courseIds : undefined,
      }),
    ...options(range, live),
  });
}

export function useBusinessQuery(
  range: DateTimeRange | null,
  live: boolean,
  courseIds: string[] = [],
) {
  return useQuery({
    queryKey: ["admin", "metrics", "business", range?.from, range?.to, ...courseIds],
    queryFn: () =>
      metricsApi.business({
        ...rangeParams(range!),
        courseIds: courseIds.length > 0 ? courseIds : undefined,
      }),
    ...options(range, live),
  });
}

export function useGamificationQuery(range: DateTimeRange | null, live: boolean) {
  return useQuery({
    queryKey: ["admin", "metrics", "gamification", range?.from, range?.to],
    queryFn: () => metricsApi.gamification(rangeParams(range!)),
    ...options(range, live),
  });
}

export function useLearningQuery(
  range: DateTimeRange | null,
  live: boolean,
  courseIds: string[] = [],
) {
  return useQuery({
    queryKey: ["admin", "metrics", "learning", range?.from, range?.to, ...courseIds],
    queryFn: () =>
      metricsApi.learning({
        ...rangeParams(range!),
        courseIds: courseIds.length > 0 ? courseIds : undefined,
      }),
    ...options(range, live),
  });
}

/** Onboarding survey answers of the window's signups (the "Usuarios" tab). */
export function useOnboardingQuery(range: DateTimeRange | null, live: boolean) {
  return useQuery({
    queryKey: ["admin", "metrics", "onboarding", range?.from, range?.to],
    queryFn: () => metricsApi.onboarding(rangeParams(range!)),
    ...options(range, live),
  });
}

/** The "Negocio" sales detail: purchases of the window, refund reasons and course rankings. */
export function useSalesQuery(range: DateTimeRange | null, live: boolean) {
  return useQuery({
    queryKey: ["admin", "metrics", "sales", range?.from, range?.to],
    queryFn: () => metricsApi.sales(rangeParams(range!)),
    ...options(range, live),
  });
}

export function usePerfWidget(
  widget: string,
  range: DateTimeRange | null,
  step: number,
  live: boolean,
) {
  return useQuery<PerfMetrics>({
    queryKey: ["admin", "metrics", "perf", widget, range?.from, range?.to, step],
    queryFn: () => metricsApi.perf(widget, { ...rangeParams(range!), step }),
    ...options(range, live),
  });
}
