export type AuthResponse = { accessToken: string; refreshToken: string };

export type MemberRole = "ADMIN" | "MEMBER";
export type MemberStatus = "ACTIVE" | "REMOVED";
export type MemberActivityStatus = "ACTIVE" | "INACTIVE" | "NOT_STARTED" | "COMPLETED" | "REMOVED";
export type OrganizationStatus = "PENDING" | "ACTIVE" | "REJECTED" | "SUSPENDED";

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
  status: OrganizationStatus;
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
  currentCourse: string | null;
  activityStatus: MemberActivityStatus;
};

export type MemberSort = "name" | "progress" | "lastActivity" | "joinedAt";

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
  activityStatus: MemberActivityStatus;
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

export type PurchaseStatus = "PENDING_PAYMENT" | "PAID" | "CANCELLED";
export type SeatStatus =
  | "PENDING_PAYMENT"
  | "INVITED"
  | "INVITATION_EXPIRED"
  | "ACTIVE"
  | "ACCESS_EXPIRED"
  | "REVOKED"
  | "CANCELLED";

export type CatalogCourse = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  coverUrl: string | null;
  signCount: number;
};

export type PurchaseCatalog = {
  courses: CatalogCourse[];
  currency: string;
  pricePerSignPerDay: number;
  minPricePerSeat: number;
  minDays: number;
  maxDays: number;
  invitationDays: number;
  maxSeats: number;
};

export type PurchaseQuote = {
  courseId: string;
  courseName: string;
  signCount: number;
  seats: number;
  durationDays: number;
  pricePerSeat: number;
  totalAmount: number;
  currency: string;
};

export type SeatCounts = {
  pendingPayment: number;
  invited: number;
  invitationExpired: number;
  active: number;
  accessExpired: number;
  revoked: number;
};

export type Purchase = {
  id: string;
  courseId: string;
  courseName: string;
  seats: number;
  durationDays: number;
  signCount: number;
  pricePerSeat: number;
  totalAmount: number;
  currency: string;
  status: PurchaseStatus;
  createdAt: string;
  paidAt: string | null;
  invitationDeadline: string | null;
  cancelledAt: string | null;
  seatCounts: SeatCounts;
};

export type Seat = {
  id: string;
  email: string;
  status: SeatStatus;
  invitedAt: string | null;
  lastReminderAt: string | null;
  autoReminderSentAt: string | null;
  activatedAt: string | null;
  accessExpiresAt: string | null;
  revokedAt: string | null;
  userId: string | null;
  userName: string | null;
  canEditEmail: boolean;
  nextReminderAvailableAt: string | null;
};

export type PurchaseDetail = { purchase: Purchase; seats: Seat[] };

export type InvitationPreview = {
  organizationName: string;
  courseName: string;
  email: string;
  status: SeatStatus;
  invitationDeadline: string | null;
  durationDays: number;
  accountExists: boolean;
};

export type AcceptedInvitation = {
  organizationName: string;
  courseId: string;
  courseName: string;
  activatedAt: string;
  accessExpiresAt: string;
};

export type Page<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
};

export type ActivityFigures = {
  /** Distinct people with an attempt; for a whole period it is not the sum of the days. */
  activeParticipants: number;
  exerciseAttempts: number;
  correctAnswers: number;
  correctPercentage: number;
  lessonsCompleted: number;
  learningMinutes: number;
};

export type DailyActivity = { date: string; figures: ActivityFigures };

export type OrganizationActivity = {
  from: string;
  to: string;
  totals: ActivityFigures;
  days: DailyActivity[];
};
