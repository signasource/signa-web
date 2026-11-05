import { api } from "@/lib/api/client";

/** A named count (a status bucket, a category). */
export type CountItem = { key: string; count: number };

export type BusinessMetrics = {
  courses: { total: number; versionsByStatus: CountItem[] };
  enrollments: CountItem[];
  progress: { lessonsCompleted: number; topicsCompleted: number };
  users: { total: number; active: number };
  accuracy: {
    evaluated: number;
    correct: number;
    accuracyPercent: number;
    byBlockType: {
      type: string;
      evaluated: number;
      correct: number;
      accuracyPercent: number;
    }[];
  };
  errors: {
    signReportsByStatus: CountItem[];
    pendingSignReports: number;
    failedImports: number;
  };
  /** Day resolution (`YYYY-MM-DD`); see the datetime-note on the dashboard. */
  activity: {
    day: string;
    attempts: number;
    correct: number;
    lessonsCompleted: number;
  }[];
};

/** One Prometheus series: its label set and its points. */
export type PerfSeries = {
  labels: Record<string, string>;
  points: { t: number; v: number | null }[];
};

export type PerfMetrics = {
  widget: string;
  /** False when the Grafana read token is not configured → the client shows "sin datos". */
  available: boolean;
  series: PerfSeries[];
};

export type RangeParams = { from: string; to: string };

export const metricsApi = {
  business: (params: RangeParams) =>
    api<BusinessMetrics>("/admin/metrics/business", { query: params }),

  perf: (widget: string, params: RangeParams & { step?: number }) =>
    api<PerfMetrics>(`/admin/metrics/perf/${widget}`, { query: params }),
};
