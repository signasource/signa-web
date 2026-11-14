import { api } from "@/lib/api/client";
import type { Page, Purchase, PurchaseDetail, PurchaseStatus } from "@/lib/api/types";

// ── Unified admin purchases ───────────────────────────────────────────────────

export type PurchaseType = "SEATS" | "GEMS" | "COURSE";
export type UnifiedPurchaseStatus = "PENDING_PAYMENT" | "PAID" | "CANCELLED" | "REFUNDED";
export type ManualPaymentMethod = "MERCADO_PAGO" | "TRANSFER" | "DEPOSIT" | "CASH" | "OTHER";

export type AdminPurchaseListItem = {
  id: string;
  type: PurchaseType;
  productName: string;
  productDetail: string;
  buyerName: string;
  buyerSub: string;
  buyerEmail: string;
  amount: number;
  currency: string;
  status: UnifiedPurchaseStatus;
  createdAt: string;
  paidAt: string | null;
  refundedAt: string | null;
  mpOrderId: string | null;
  paymentMethod: ManualPaymentMethod | null;
  manualRef: string | null;
  confirmedByName: string | null;
  confirmedAt: string | null;
  externalRef: string;
  pendingRefundRequest: boolean;
};

export type AdminPurchaseDetail = AdminPurchaseListItem & {
  organizationId: string | null;
  seats: number | null;
  durationDays: number | null;
  discountPercent: number | null;
  gems: number | null;
  refundRequests: AdminRefundRequest[];
};

export type RefundRequestStatus = "PENDING" | "RESOLVED";
export type RefundRequestReason =
  "NOT_RECEIVED" | "MISTAKE" | "DUPLICATE" | "TECHNICAL" | "NOT_AS_EXPECTED" | "OTHER";

export type AdminRefundRequest = {
  id: string;
  purchaseType: PurchaseType;
  purchaseId: string;
  reason: RefundRequestReason;
  channel: string;
  message: string;
  note: string | null;
  status: RefundRequestStatus;
  resolvedByName: string | null;
  resolvedAt: string | null;
  createdAt: string;
  requesterName: string;
  requesterUsername: string;
  requesterEmail: string;
  productName: string;
  productDetail: string;
  amount: number;
  currency: string;
  purchaseStatus: UnifiedPurchaseStatus;
  purchasePaidAt: string | null;
};

export type AdminMe = {
  id: string;
  name: string;
  lastName: string;
  email: string;
  /** Profile photo as a data URL; null when none. */
  avatar: string | null;
};

export type OrganizationStatus = "PENDING" | "ACTIVE" | "REJECTED" | "SUSPENDED";

export type AdminOrganization = {
  id: string;
  name: string;
  status: OrganizationStatus;
  cuit: string | null;
  contactEmail: string;
  contactPhone: string | null;
  createdAt: string;
  activeMembers: number;
  adminName: string | null;
  adminEmail: string | null;
};

export type AdminPurchase = {
  organizationId: string;
  organizationName: string;
  paymentReference: string | null;
  purchase: Purchase;
};

export type AdminStats = {
  activeOrganizations: number;
  pendingOrganizations: number;
  openSignReports: number;
  totalUsers: number;
  activeUsersLast7Days: number;
  waitlistCount: number;
  totalSigns: number;
};

export type ReportStatus = "PENDING" | "REVIEWED" | "RESOLVED" | "REJECTED";
export type ReportReason =
  | "INCORRECT_SIGN"
  | "UNCLEAR_ANIMATION"
  | "WRONG_MEANING"
  | "MISSING_CONTEXT"
  | "REGIONAL_VARIANT"
  | "TECHNICAL_PROBLEM"
  | "OTHER";

export type AdminSignReport = {
  id: string;
  signId: string;
  signMeaning: string;
  signLanguage: string;
  handedness: string;
  username: string;
  reason: ReportReason;
  description: string | null;
  status: ReportStatus;
  adminNote: string | null;
  resolvedBy: string | null;
  resolvedAt: string | null;
  createdAt: string;
};

export type SignReportFilters = {
  status?: ReportStatus;
  reason?: ReportReason;
  signQuery?: string;
  from?: string;
  to?: string;
};

export type UserRole = "USER" | "ADMIN" | "ORG_ADMIN";

export type AdminUser = {
  id: string;
  email: string;
  username: string;
  name: string;
  lastName: string;
  role: UserRole;
  enabled: boolean;
  verified: boolean;
  organizationName: string | null;
  authProvider: "GOOGLE" | "EMAIL";
  currentStreak: number;
  lastStreakDate: string | null;
  avatar: string | null;
};

export type AdminWaitlistEntry = {
  id: number;
  email: string;
  createdAt: string;
};

export type AdminCourseVersion = {
  id: string;
  version: number;
  status: string;
  publishedAt: string | null;
};

export type AdminCourse = {
  id: string;
  name: string;
  description: string | null;
  signLanguageCode: string;
  versions: AdminCourseVersion[];
  enrollmentCount: number;
};

export type Handedness = "ONE_HANDED" | "TWO_HANDED";
/** Which video of an .mp4 sign: the front one (also the only file of a .glb sign) or the side one. */
export type SignView = "front" | "lateral";
export type AnimationFormat = "glb" | "mp4";

export type AdminSign = {
  id: string;
  meaning: string;
  handedness: string;
  hasAnimation: boolean;
  hasYoutube: boolean;
  animationFormat: AnimationFormat | null;
  /** Last upload from the sign editor; null = imported default. */
  animationUpdatedAt: string | null;
  openReports: number;
  /** Distinct lessons (draft or published versions) that reference the sign. */
  lessonCount: number;
};

/** A lesson that references a sign, in any course version. */
export type AdminSignUsage = {
  courseId: string;
  courseName: string;
  courseVersionId: string;
  version: string;
  versionStatus: CourseVersionStatus;
  topicTitle: string;
  lessonId: string;
  lessonName: string;
  blockTypes: string[];
};

export type AdminSignDetail = {
  id: string;
  meaning: string;
  handedness: Handedness;
  signLanguageCode: string;
  /** Object key in the media bucket (e.g. `lsa/hola.glb`), not a URL. */
  animationUrl: string | null;
  hasAnimation: boolean;
  animationFormat: AnimationFormat | null;
  /** Public URL to load the animation from (cache-busted after an upload). */
  mediaUrl: string | null;
  /**
   * Whether the file at `animationUrl` exists (null = could not check). Imported signs point at
   * `lsa/<meaning>.glb` even when nobody uploaded it, and then the app shows nothing.
   */
  mediaAvailable: boolean | null;
  /** Side-view video of an .mp4 sign: bucket key and public URL. Null for .glb signs. */
  lateralAnimationUrl: string | null;
  lateralMediaUrl: string | null;
  animationUpdatedAt: string | null;
  youtubeUrl: string | null;
  openReports: number;
  usages: AdminSignUsage[];
};

/** Partial update: omitted fields stay; `youtubeUrl: ""` clears it. Renaming cascades to lessons. */
export type UpdateSignInput = {
  meaning?: string;
  handedness?: Handedness;
  youtubeUrl?: string;
};

export type CourseVersionStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export type AdminCourseVersionListItem = {
  id: string;
  courseId: string;
  courseName: string;
  version: string;
  status: CourseVersionStatus;
  publishedAt: string | null;
  basedOnVersion: string | null;
  isFree: boolean;
  price: number | null;
  unitCount: number;
  lessonCount: number;
  blockCount: number;
  signCount: number;
  updatedAt: string | null;
  updatedBy: string | null;
  updatedByName: string | null;
  updatedByAvatar: string | null;
  color: string | null;
};

export type BlockConfig = Record<string, unknown>;

export type AdminBlock = {
  id: string;
  type: string;
  order: number;
  xpReward: number | null;
  config: BlockConfig;
};

export type AdminLesson = {
  id: string;
  name: string;
  description: string | null;
  blocks: AdminBlock[];
};

export type AdminTopic = {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  lessons: AdminLesson[];
};

export type AdminCourseVersionDetail = {
  id: string;
  courseId: string;
  version: string;
  status: CourseVersionStatus;
  publishedAt: string | null;
  basedOnVersion: string | null;
  name: string;
  description: string | null;
  isFree: boolean;
  price: number | null;
  updatedAt: string | null;
  updatedBy: string | null;
  color: string | null;
  topics: AdminTopic[];
};

export type SaveCourseVersionPayload = {
  name: string;
  description: string | null;
  isFree: boolean;
  price: number | null;
  color: string | null;
  topics: Array<{
    id?: string | null;
    title: string;
    subtitle: string | null;
    description: string | null;
    lessons: Array<{
      id?: string | null;
      name: string;
      description: string | null;
      blocks: Array<{
        id?: string | null;
        type: string;
        xpReward: number | null;
        config: BlockConfig;
      }>;
    }>;
  }>;
};

export type UpdateAdminInput = {
  name?: string;
  lastName?: string;
  email?: string;
  password?: string;
  avatar?: string;
};

export const adminApi = {
  me: () => api<AdminMe>("/admin/me"),

  stats: () => api<AdminStats>("/admin/stats"),

  organizations: (params?: { status?: OrganizationStatus[]; page?: number; size?: number }) =>
    api<Page<AdminOrganization>>("/admin/organizations", {
      query: params as Record<string, string | number | boolean | undefined>,
    }),

  organization: (id: string) => api<AdminOrganization>(`/admin/organizations/${id}`),

  updateOrganizationStatus: (id: string, status: OrganizationStatus) =>
    api<AdminOrganization>(`/admin/organizations/${id}/status`, {
      method: "PATCH",
      body: { status },
    }),

  purchases: (status?: PurchaseStatus) =>
    api<AdminPurchase[]>("/admin/purchases", { query: { status } }),

  confirmPayment: (purchaseId: string, paymentReference?: string) =>
    api<PurchaseDetail>(`/admin/purchases/${purchaseId}/confirm-payment`, {
      method: "POST",
      body: { paymentReference: paymentReference || undefined },
    }),

  signReports: (filters?: SignReportFilters) =>
    api<AdminSignReport[]>("/admin/sign-reports", {
      query: filters as Record<string, string | number | boolean | undefined>,
    }),

  updateSignReport: (reportId: string, status: ReportStatus, adminNote?: string) =>
    api<AdminSignReport>(`/admin/sign-reports/${reportId}`, {
      method: "PATCH",
      body: { status, adminNote },
    }),

  users: (params?: { query?: string; role?: UserRole; page?: number; size?: number }) =>
    api<Page<AdminUser>>("/admin/users", {
      query: params as Record<string, string | number | boolean | undefined>,
    }),

  user: (id: string) => api<AdminUser>(`/admin/users/${id}`),

  updateUser: (id: string, data: { role?: UserRole; enabled?: boolean }) =>
    api<AdminUser>(`/admin/users/${id}`, { method: "PATCH", body: data }),

  deleteUser: (id: string) => api(`/admin/users/${id}`, { method: "DELETE" }),

  admins: () => api<AdminUser[]>("/admin/admins"),

  createAdmin: (data: {
    email: string;
    name: string;
    lastName: string;
    password: string;
    /** Optional profile photo as a data URL. */
    avatar?: string;
  }) => api<AdminUser>("/admin/admins", { method: "POST", body: data }),

  /** Partial update: omitted fields stay; `avatar: ""` removes the photo. */
  updateAdmin: (id: string, data: UpdateAdminInput) =>
    api<AdminUser>(`/admin/admins/${id}`, { method: "PATCH", body: data }),

  courses: () => api<AdminCourse[]>("/admin/courses"),

  courseVersions: () => api<AdminCourseVersionListItem[]>("/admin/course-versions"),

  courseVersion: (id: string) => api<AdminCourseVersionDetail>(`/admin/course-versions/${id}`),

  createCourse: (name: string) =>
    api<AdminCourseVersionDetail>("/admin/course-versions", {
      method: "POST",
      body: { name },
    }),

  forkCourseVersion: (id: string) =>
    api<AdminCourseVersionDetail>(`/admin/course-versions/${id}/fork`, { method: "POST" }),

  saveCourseVersion: (id: string, payload: SaveCourseVersionPayload) =>
    api<AdminCourseVersionDetail>(`/admin/course-versions/${id}`, {
      method: "PUT",
      body: payload,
    }),

  publishCourseVersion: (id: string) =>
    api<AdminCourseVersionDetail>(`/admin/course-versions/${id}/publish`, { method: "POST" }),

  archiveCourseVersion: (id: string) =>
    api<AdminCourseVersionDetail>(`/admin/course-versions/${id}/archive`, { method: "POST" }),

  deleteCourseVersion: (id: string) => api(`/admin/course-versions/${id}`, { method: "DELETE" }),

  signAnimation: (meaning: string) =>
    api<{ url: string }>(`/signs/${encodeURIComponent(meaning)}/animation`),

  signs: (params?: { query?: string; page?: number; size?: number }) =>
    api<Page<AdminSign>>("/admin/signs", {
      query: params as Record<string, string | number | boolean | undefined>,
    }),

  sign: (id: string) => api<AdminSignDetail>(`/admin/signs/${id}`),

  createSign: (data: { meaning: string; handedness: Handedness; youtubeUrl?: string }) =>
    api<AdminSignDetail>("/admin/signs", { method: "POST", body: data }),

  updateSign: (id: string, data: UpdateSignInput) =>
    api<AdminSignDetail>(`/admin/signs/${id}`, { method: "PATCH", body: data }),

  /**
   * Replaces the sign's animation (max 50 MB); live in the app right away. `front`: a .glb or the
   * front .mp4 (a .glb drops the lateral video). `lateral`: the side-view .mp4 of an .mp4 sign.
   */
  uploadSignAnimation: (id: string, file: File, view: SignView = "front") => {
    const formData = new FormData();
    formData.append("file", file);
    return api<AdminSignDetail>(`/admin/signs/${id}/animation`, {
      method: "POST",
      formData,
      query: { view },
    });
  },

  removeSignLateral: (id: string) =>
    api<AdminSignDetail>(`/admin/signs/${id}/animation/lateral`, { method: "DELETE" }),

  deleteSign: (id: string) => api(`/admin/signs/${id}`, { method: "DELETE" }),

  waitlist: (params?: { page?: number; size?: number }) =>
    api<Page<AdminWaitlistEntry>>("/admin/waitlist", {
      query: params as Record<string, string | number | boolean | undefined>,
    }),

  // ── Unified purchases ──────────────────────────────────────────────────────

  allPurchases: () => api<AdminPurchaseListItem[]>("/admin/purchases"),

  purchaseDetail: (id: string, type: PurchaseType) =>
    api<AdminPurchaseDetail>(`/admin/purchases/${id}`, { query: { type } }),

  confirmPaymentFull: (
    purchaseId: string,
    data: { paymentReference?: string; paymentMethod?: ManualPaymentMethod; paymentDate?: string },
  ) =>
    api<AdminPurchaseDetail>(`/admin/purchases/${purchaseId}/confirm-payment`, {
      method: "POST",
      body: data,
    }),

  // ── Refund requests ────────────────────────────────────────────────────────

  refundRequests: () => api<AdminRefundRequest[]>("/admin/refund-requests"),

  refundRequest: (id: string) => api<AdminRefundRequest>(`/admin/refund-requests/${id}`),

  updateRefundRequest: (id: string, data: { action?: "RESOLVE" | "REOPEN"; note?: string }) =>
    api<AdminRefundRequest>(`/admin/refund-requests/${id}`, {
      method: "PATCH",
      body: data,
    }),
};
