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

/** `GET /users/me`: the signed-in account. */
export type UserProfile = {
  id: string;
  email: string;
  username: string;
  name: string;
  lastName: string | null;
  /** Path to the profile photo on the API; null when none. See `avatarSrc`. */
  avatarUrl: string | null;
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
    averagePendingLessons: number;
  };
  performance: {
    exerciseAttempts: number;
    correctPercentage: number;
    signRecognitionAttempts: number;
    signRecognitionCorrectPercentage: number;
    hasCameraExercises: boolean;
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
  /** Path to the profile photo on the API; null when none. See `avatarSrc`. */
  avatarUrl: string | null;
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
  avatarUrl: string | null;
};

/** `REFUNDED`: paid and then given back (withdrawal, refund in Mercado Pago or chargeback). */
export type PurchaseStatus = "PENDING_PAYMENT" | "PAID" | "CANCELLED" | "REFUNDED";
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
  hasCameraRecognition: boolean;
  hasAnimations: boolean;
  hasVideos: boolean;
  /** Modules in learning order with the words of the signs each one introduces. */
  modules: CatalogModule[];
};

export type CatalogModule = { title: string; signs: string[] };

/** One sign's animation as served by `POST /signs/media`. */
export type SignMedia = {
  meaning: string;
  url: string;
  format: "glb" | "mp4";
  lateralUrl: string | null;
};

/** From `minSeats` seats on, the price per seat gets `percent` off. */
export type VolumeDiscount = { minSeats: number; percent: number };

export type PurchaseCatalog = {
  courses: CatalogCourse[];
  currency: string;
  volumeDiscounts: VolumeDiscount[];
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
  listPricePerSeat: number;
  discountPercent: number;
  pricePerSeat: number;
  /** `listPricePerSeat × seats`. */
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
  /** Business rule about refunds, to show before paying. */
  refundRule: string;
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
  listPricePerSeat: number;
  discountPercent: number;
  pricePerSeat: number;
  totalAmount: number;
  currency: string;
  status: PurchaseStatus;
  createdAt: string;
  paidAt: string | null;
  invitationDeadline: string | null;
  /** Last moment the organization can cancel for a full refund; null once it can't. */
  refundableUntil: string | null;
  cancelledAt: string | null;
  refundedAt: string | null;
  seatCounts: SeatCounts;
  /** True when the organization has a pending refund request for this purchase. */
  hasRefundRequest: boolean;
  /** True once any invitee accepted their seat: the purchase can no longer be refunded. */
  hasAcceptedSeats: boolean;
  /** How it was paid: Mercado Pago, by hand (manual confirmation), or null while unpaid. */
  paymentMethod: "MERCADO_PAGO" | "MANUAL" | null;
};

/**
 * `GET /organizations/{id}/purchases/{purchaseId}/progress`: the people who accepted a seat of the
 * purchase and how they are doing in its course. `averageProgress` is of those who started.
 */
export type PurchaseProgress = {
  participants: number;
  started: number;
  completed: number;
  completionPercentage: number;
  averageProgress: number;
  seats: { seatId: string; progressPercentage: number }[];
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

/** `GET /organizations/{id}/invitations`: an invitation not yet accepted, with its purchase. */
export type OrganizationInvitation = {
  purchaseId: string;
  courseId: string;
  courseName: string;
  purchaseStatus: PurchaseStatus;
  /** The purchase's: after it the invitation can no longer be accepted. */
  invitationDeadline: string | null;
  seat: Seat;
};

/**
 * `GET /organizations/{id}/invitations/summary[?courseId=]`: invitations of paid purchases (never
 * refunded ones).
 */
export type InvitationSummary = {
  sent: number;
  accepted: number;
  /** Still acceptable (not expired). */
  pending: number;
  /** `accepted / sent`, rounded; 0 when nothing was sent. */
  acceptancePercentage: number;
};

export type HomeActiveParticipant = {
  userId: string;
  name: string;
  lastName: string;
  avatarUrl: string | null;
  /** Lesson blocks answered or viewed in the window. */
  activities: number;
  /** Distinct days (Argentine time) with activity in the window. */
  activeDays: number;
  lastActivityAt: string;
  progressPercentage: number;
};

/**
 * Why someone needs follow-up, in priority order: an unfinished course ends in less than 3 days; one
 * ends in less than 7 days with less than 50 % done; no activity in the last 7 days.
 */
export type FollowUpReason = "ACCESS_EXPIRING" | "EXPIRING_WITH_LOW_PROGRESS" | "INACTIVE";

/** One unfinished course of someone who needs follow-up. */
export type HomeFollowUpCourse = {
  courseId: string;
  courseName: string;
  /** Lessons completed of their version of the course. */
  progressPercentage: number;
  /** Null when the access doesn't end. */
  accessExpiresAt: string | null;
};

export type HomeFollowUpParticipant = {
  userId: string;
  name: string;
  lastName: string;
  avatarUrl: string | null;
  /** In priority order. */
  reasons: FollowUpReason[];
  /** The courses still running that they have not finished. */
  courses: HomeFollowUpCourse[];
  /** Over those courses together. */
  progressPercentage: number;
  lastActivityAt: string | null;
  /** Soonest end among those courses; null when none ends. */
  accessExpiresAt: string | null;
  lastReminderAt: string | null;
  /** Null when a reminder can be sent now. */
  nextReminderAvailableAt: string | null;
};

/**
 * `GET /organizations/{id}/home`: only people whose access comes from a paid purchase count (a
 * refunded access leaves every figure, activity included).
 */
export type OrganizationHome = {
  participants: number;
  startedParticipants: number;
  /** Among `startedParticipants` only. */
  averageProgressPercentage: number;
  completedParticipants: number;
  /** `completedParticipants / participants`. */
  completedPercentage: number;
  activeWindowDays: number;
  /** Most active first. */
  activeParticipants: HomeActiveParticipant[];
  /** Highest priority first. */
  followUp: HomeFollowUpParticipant[];
};

/** `POST /organizations/{id}/members/{userId}/reminders`. */
export type ParticipantReminder = { lastReminderAt: string; nextReminderAvailableAt: string };

export type RefundReason =
  | "PURCHASE_CANCELLED"
  | "ALREADY_PAID"
  | "AMOUNT_MISMATCH"
  | "BUYER_REQUESTED"
  | "EXTERNAL_REFUND"
  | "CHARGEBACK";

/** A Mercado Pago payment that could not pay the purchase and was given back in full. */
export type PurchaseRefund = {
  amount: number;
  currency: string;
  reason: RefundReason;
  status: "PENDING" | "REFUNDED";
  createdAt: string;
  refundedAt: string | null;
  /** The reason the organization gave when it cancelled (withdrawals only). */
  note: string | null;
};

export type PurchaseDetail = { purchase: Purchase; seats: Seat[]; refunds: PurchaseRefund[] };

/** Mercado Pago Checkout Pro URL to send the admin to. */
export type PurchaseCheckout = { checkoutUrl: string };

/** Mercado Pago order status of the purchase's last checkout (`approved`, `failed`, `canceled`, `action_required`…) and the purchase. */
export type PaymentSync = { paymentStatus: string; purchase: PurchaseDetail };

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

export type RefundRequestReason =
  "NOT_RECEIVED" | "MISTAKE" | "DUPLICATE" | "TECHNICAL" | "NOT_AS_EXPECTED" | "OTHER";

export type UserRefundRequestResponse = {
  id: string;
  purchaseType: string;
  purchaseId: string;
  reason: RefundRequestReason | null;
  message: string | null;
  status: string;
  createdAt: string;
  productName: string | null;
  amount: number | null;
  currency: string | null;
};

/** Participant list state: learning activity in the selected course(s) in the last 7 days. */
export type ParticipantActivity = "ACTIVE" | "INACTIVE";

/** One row of the participant list (`GET /organizations/{id}/members/roster`). */
export type ParticipantSummary = {
  userId: string;
  name: string;
  lastName: string;
  email: string;
  joinedAt: string;
  lastActivityAt: string | null;
  progressPercentage: number;
  activity: ParticipantActivity;
  completed: boolean;
  avatarUrl: string | null;
};

/** Where a participant stands in a course (or, in the total row, across all of them). */
export type TrainingStatus =
  "INVITATION_PENDING" | "NOT_STARTED" | "ACTIVE" | "INACTIVE" | "COMPLETED" | "ACCESS_EXPIRED";

/** A participant's training in one course; the total row has `courseId`/`courseName` null. */
export type CourseTraining = {
  courseId: string | null;
  courseName: string | null;
  status: TrainingStatus;
  progressPercentage: number;
  lastActivityAt: string | null;
  /** When the access began (the invitation was accepted); null for a pending invitation. */
  startedAt: string | null;
  /** When the access ends; null for a pending invitation or access with no end. */
  expiresAt: string | null;
};

/** `GET /organizations/{id}/members/{userId}/training`. */
export type ParticipantTraining = {
  userId: string;
  name: string;
  lastName: string;
  email: string;
  avatarUrl: string | null;
  status: MemberStatus;
  joinedAt: string;
  courses: CourseTraining[];
  total: CourseTraining;
};

export type Page<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
};
