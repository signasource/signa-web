// DTO shapes mirror signa-api (camelCase after the client's key conversion).
// Canonical reference: docs/api/types.md

export type AuthResponse = { accessToken: string; refreshToken: string };

export type MemberRole = "ADMIN" | "MEMBER";
export type MemberStatus = "ACTIVE" | "REMOVED";

export type CourseSummary = {
  id: string;
  name: string;
  description: string | null;
  coverUrl: string | null;
  isFree: boolean;
  signLanguageCode: string;
};

export type MyOrganization = {
  id: string;
  name: string;
  role: MemberRole;
  joinedAt: string;
  courses: CourseSummary[];
};

export type RedeemInviteCodeResponse = {
  organizationName: string;
  courses: CourseSummary[];
  alreadyMember: boolean;
  accessExpiresAt: string | null;
  role: MemberRole;
};

export type WeeklyPerformance = {
  /** ISO date (yyyy-mm-dd) of the week's first day. */
  weekStart: string;
  exerciseAttempts: number;
  correctPercentage: number;
};

export type OrganizationOverview = {
  participation: {
    totalParticipants: number;
    activeParticipants: number;
    inactiveParticipants: number;
    participantsStarted: number;
    activeWindowDays: number;
    averageActiveDaysLast30: number;
    participantsWithStreak: number;
    longestCurrentStreak: number;
  };
  progress: {
    averageProgressPercentage: number;
    completedLessons: number;
    pendingLessons: number;
    modulesCompleted: number;
    participantsCompletedAll: number;
    totalLearningMinutes: number;
    averageLearningMinutes: number;
  };
  performance: {
    exerciseAttempts: number;
    correctPercentage: number;
    signRecognitionAttempts: number;
    signRecognitionCorrectPercentage: number;
    weeklyEvolution: WeeklyPerformance[];
  };
};

export type OrganizationMemberSummary = {
  userId: string;
  name: string;
  lastName: string;
  email: string;
  status: MemberStatus;
  joinedAt: string;
  lastActivityAt: string | null;
  progressPercentage: number;
  currentModule: string | null;
};

export type MemberCourseProgress = {
  courseId: string;
  courseName: string;
  totalLessons: number;
  completedLessons: number;
  progressPercentage: number;
};

export type MemberProgress = {
  userId: string;
  name: string;
  lastName: string;
  email: string;
  status: MemberStatus;
  joinedAt: string;
  lastActivityAt: string | null;
  progressPercentage: number;
  completedLessons: number;
  totalLessons: number;
  modulesCompleted: number;
  currentModule: string | null;
  exerciseAttempts: number;
  correctAnswers: number;
  correctPercentage: number;
  signsLearned: number;
  currentStreak: number;
  learningMinutes: number;
  activeDaysLast30: number;
  courses: MemberCourseProgress[];
};

export type ModuleStats = {
  courseId: string;
  courseName: string;
  topicId: string;
  title: string;
  order: number;
  totalLessons: number;
  participantsCompleted: number;
  participantsInProgress: number;
  completionPercentage: number;
  exerciseAttempts: number;
  correctPercentage: number;
};

export type InviteCode = {
  id: string;
  code: string;
  organizationId: string;
  /** Set for invite-by-email codes; null for shareable codes. */
  email: string | null;
  memberRole: MemberRole;
  expiresAt: string | null;
  maxUses: number | null;
  useCount: number;
  active: boolean;
};

export type Page<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
};
