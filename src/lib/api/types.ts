// DTO shapes mirror signa-api (camelCase after the client's key conversion).
// Canonical reference: docs/api/types.md

export type AuthResponse = { accessToken: string; refreshToken: string };

export type MemberRole = "ADMIN" | "MEMBER";
export type MemberStatus = "ACTIVE" | "REMOVED";

export type CourseSummary = { id: string; [key: string]: unknown };

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

export type WeeklyPerformance = Record<string, unknown>;

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

export type Page<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
};
