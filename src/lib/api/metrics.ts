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

/** Daily-resolution series point (`YYYY-MM-DD`) — used by the Learning/Gamification series. */
export type DailyCount = { day: string; count: number };

/**
 * Adaptive-resolution series point: `t` is the bucket's start instant (ISO-8601). The bucket size
 * (minute/hour/day) follows the from/to span; the Growth series use these.
 */
export type SeriesCount = { t: string; count: number };
export type SeriesAmount = { t: string; amount: number };

/**
 * One weekly retention cohort. Horizon counts/percentages are `null` when the cohort's whole week
 * is not yet observable at that horizon (render "—" instead of a misleading 0%).
 */
export type CohortRetention = {
  weekStart: string;
  cohortSize: number;
  d1: number | null;
  d1Percent: number | null;
  d7: number | null;
  d7Percent: number | null;
  d30: number | null;
  d30Percent: number | null;
};

/** Global growth & business metrics — the "Negocio & crecimiento" apartado. */
export type GrowthMetrics = {
  users: {
    total: number;
    newInRange: number;
    /** New users in the previous equal-length window, or `null` for the whole history. */
    previousNewInRange: number | null;
    activatedInRange: number;
    activationPercent: number;
    daily: SeriesCount[];
  };
  engagement: {
    dau: number;
    wau: number;
    mau: number;
    stickinessPercent: number;
    activeInRange: number;
    previousActiveInRange: number | null;
    dailyActive: SeriesCount[];
  };
  sessions: {
    total: number;
    users: number;
    perUser: number;
    averageDurationSeconds: number;
    daily: SeriesCount[];
  };
  retention: CohortRetention[];
  waitlist: { total: number; newInRange: number; daily: SeriesCount[] };
  revenue: {
    paidAmount: number;
    paidCount: number;
    averageTicket: number;
    refundedAmount: number;
    refundRatePercent: number;
    daily: SeriesAmount[];
  };
  /** Real-money gem economy (end users, no org): money in/out plus gems granted. */
  gems: {
    purchases: number;
    gemsGranted: number;
    paidAmount: number;
    refundedAmount: number;
    refundedCount: number;
    daily: SeriesAmount[];
  };
  /** Individual paid-course purchases bought directly by end users (no organization). */
  courseSales: {
    purchases: number;
    paidAmount: number;
    refundedAmount: number;
    refundedCount: number;
    daily: SeriesAmount[];
  };
  seats: { sold: number; active: number; utilizationPercent: number };
  organizations: CountItem[];
  orgs: {
    newInRange: number;
    pending: number;
    avgUsersPerOrg: number;
    avgRevenuePerOrg: number;
    purchasesInRange: number;
    dailyPurchases: SeriesCount[];
    utilization: OrgUtilization[];
    conversion: { freeCourseUsers: number; paidCourseUsers: number; conversionPercent: number };
  };
  paidCourseUsers: number;
};

/** One organization's B2B license utilization row (contracted vs. used seats). */
export type OrgUtilization = {
  orgId: string;
  name: string;
  members: number;
  seatsSold: number;
  seatsActive: number;
  occupancyPercent: number;
  revenue: number;
};

/** Global learning & content metrics — the "Aprendizaje & contenido" apartado. */
export type LearningMetrics = {
  courses: {
    courseId: string;
    courseName: string;
    enrolled: number;
    completed: number;
    total: number;
    completionPercent: number;
  }[];
  enrollmentFunnel: CountItem[];
  hardestLessons: {
    lessonId: string;
    lessonName: string;
    evaluated: number;
    correct: number;
    accuracyPercent: number;
  }[];
  learnedSigns: number;
  learnedSignsDaily: DailyCount[];
  reports: {
    resolvedCount: number;
    averageResolutionHours: number;
    mostReported: { meaning: string; count: number }[];
  };
  imports: CountItem[];
  lessons: { started: number; completed: number; completionPercent: number };
  exercises: {
    attempted: number;
    correct: number;
    successPercent: number;
    averageAttempts: number;
  };
  /** Onboarding steps (registrados → … → completaron 2+ lecciones), as of the window's close. */
  onboardingFunnel: CountItem[];
  lessonRanking: {
    lessonId: string;
    lessonName: string;
    started: number;
    completed: number;
    completionPercent: number;
    abandonmentPercent: number;
  }[];
  highestErrorExercises: ExerciseDifficulty[];
  mostRetriedExercises: ExerciseDifficulty[];
  /** Daily accuracy (correct / evaluated) — the correct-answer evolution over the window. */
  dailyAccuracy: { day: string; evaluated: number; correct: number; accuracyPercent: number }[];
  /** Signs ranked by error rate across SELECT_MEANING / SELECT_SIGN blocks, worst first. */
  hardestSigns: SignDifficulty[];
};

/** One sign ranked by difficulty across exercise blocks that test it. */
export type SignDifficulty = {
  sign: string;
  evaluated: number;
  correct: number;
  errorPercent: number;
  averageAttempts: number;
};

/** One exercise (lesson block) in a difficulty ranking. */
export type ExerciseDifficulty = {
  blockId: string;
  label: string;
  evaluated: number;
  correct: number;
  errorPercent: number;
  averageAttempts: number;
};

/** A named count (an achievement, an XP tier). */
export type NameCount = { name: string; count: number };

/** Global gamification & engagement metrics — the "Gamificación" apartado. */
export type GamificationMetrics = {
  xp: {
    total: number;
    perActiveUser: number;
    activeUsers: number;
    daily: DailyCount[];
    /** XP per active user in the previous equal-length window; `null` for whole-history range. */
    previousPerActiveUser: number | null;
  };
  streaks: {
    averageCurrentStreak: number;
    averageStreakActive: number;
    usersOverSevenDays: number;
    activeStreakers: number;
    maxStreak: number;
  };
  achievements: {
    unlocked: number;
    unlockRatePercent: number;
    daily: DailyCount[];
    topUnlocked: NameCount[];
    leastUnlocked: NameCount[];
  };
  challenges: { type: string; completed: number; claimed: number; claimRatePercent: number }[];
  gifts: { sent: number; claimed: number };
  shop: {
    totalGemsSpent: number;
    gemsCredited: number;
    redemptionRatePercent: number;
    topItems: { title: string; purchases: number; gemsSpent: number }[];
    dailySpent: DailyCount[];
  };
  /** Users bucketed by total XP (experience tiers). */
  xpDistribution: NameCount[];
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

  growth: (params: RangeParams) => api<GrowthMetrics>("/admin/metrics/growth", { query: params }),

  learning: (params: RangeParams) =>
    api<LearningMetrics>("/admin/metrics/learning", { query: params }),

  gamification: (params: RangeParams) =>
    api<GamificationMetrics>("/admin/metrics/gamification", { query: params }),

  perf: (widget: string, params: RangeParams & { step?: number }) =>
    api<PerfMetrics>(`/admin/metrics/perf/${widget}`, { query: params }),
};
