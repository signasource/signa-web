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

export type AdminSignReportGroup = {
  signId: string;
  signMeaning: string;
  signLanguage: string;
  handedness: string;
  reportCount: number;
  topReason: ReportReason;
  status: ReportStatus;
  lastReportAt: string | null;
  reports: {
    id: string;
    username: string;
    reason: ReportReason;
    description: string | null;
    status: ReportStatus;
    createdAt: string;
  }[];
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
  openReports: number;
  lessonCount: number;
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

  signReports: (status?: ReportStatus) =>
    api<AdminSignReportGroup[]>("/admin/sign-reports", {
      query: status ? { status } : undefined,
    }),

  updateSignReportGroup: (signId: string, status: ReportStatus, adminNote?: string) =>
    api<AdminSignReportGroup>(`/admin/sign-reports/signs/${signId}`, {
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

  admins: () => api<AdminUser[]>("/admin/admins"),

  createAdmin: (data: { email: string; name: string; lastName: string; password: string }) =>
    api<AdminUser>("/admin/admins", { method: "POST", body: data }),

  courses: () => api<AdminCourse[]>("/admin/courses"),

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
