import { api } from "@/lib/api/client";
import type { Page, Purchase, PurchaseDetail, PurchaseStatus } from "@/lib/api/types";

export type AdminMe = {
  id: string;
  name: string;
  lastName: string;
  email: string;
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

export type AdminSign = {
  id: string;
  meaning: string;
  handedness: string;
  hasAnimation: boolean;
  animationFormat: "glb" | "mp4" | null;
  openReports: number;
  lessonCount: number;
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
  topics: AdminTopic[];
};

export type SaveCourseVersionPayload = {
  name: string;
  description: string | null;
  isFree: boolean;
  price: number | null;
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

export type ContentImportTrigger = "STARTUP" | "MANUAL";
export type ContentImportStatus = "SUCCESS" | "FAILED";

export type ContentImportRun = {
  id: string;
  startedAt: string;
  finishedAt: string;
  trigger: ContentImportTrigger;
  status: ContentImportStatus;
  triggeredBy: string | null;
  coursesProcessed: number;
  created: number;
  updated: number;
  unchanged: number;
  details: string | null;
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

  createAdmin: (data: { email: string; name: string; lastName: string; password: string }) =>
    api<AdminUser>("/admin/admins", { method: "POST", body: data }),

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

  signs: (params?: { query?: string; page?: number; size?: number }) =>
    api<Page<AdminSign>>("/admin/signs", {
      query: params as Record<string, string | number | boolean | undefined>,
    }),

  waitlist: (params?: { page?: number; size?: number }) =>
    api<Page<AdminWaitlistEntry>>("/admin/waitlist", {
      query: params as Record<string, string | number | boolean | undefined>,
    }),

  importContent: () => api<ContentImportRun>("/admin/content/import", { method: "POST" }),

  contentImportRuns: (params?: { page?: number; size?: number }) =>
    api<Page<ContentImportRun>>("/admin/content/import-runs", {
      query: params as Record<string, string | number | boolean | undefined>,
    }),
};
