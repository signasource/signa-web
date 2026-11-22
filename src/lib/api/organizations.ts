import { api } from "@/lib/api/client";
import type { Period } from "@/lib/date-range";
import type {
  CatalogCourse,
  InvitationSummary,
  MemberActivityStatus,
  MemberProgress,
  MemberSort,
  MemberStatus,
  ModuleStats,
  MyOrganization,
  OrganizationHome,
  OrganizationInvitation,
  OrganizationMemberSummary,
  OrganizationOverview,
  Page,
  ParticipantActivity,
  ParticipantSummary,
  ParticipantTraining,
  ParticipantReminder,
  Purchase,
  PaymentSync,
  PurchaseCatalog,
  PurchaseCheckout,
  PurchaseDetail,
  PurchaseProgress,
  PurchaseQuote,
  RedeemInviteCodeResponse,
  RefundRequestReason,
  UserRefundRequestResponse,
} from "@/lib/api/types";

/** Query params for a period; none for the whole history. */
function periodQuery(period: Period | undefined): { from?: string; to?: string } {
  return period ? { from: period.from, to: period.to } : {};
}

export const organizationsApi = {
  me: () => api<MyOrganization>("/organizations/me"),

  register: (data: {
    orgName: string;
    cuit: string;
    contactEmail: string;
    contactPhone: string;
    adminName: string;
    adminPassword: string;
  }) =>
    api<{ organizationId: string; organizationName: string; status: string }>(
      "/organizations/register",
      { method: "POST", body: data, anonymous: true },
    ),

  redeemInviteCode: (code: string) =>
    api<RedeemInviteCodeResponse>("/organizations/invite-codes/redeem", {
      method: "POST",
      body: { code },
    }),

  overview: (orgId: string, params: { courseId?: string; period?: Period }) =>
    api<OrganizationOverview>(`/organizations/${orgId}/overview`, {
      query: { courseId: params.courseId, ...periodQuery(params.period) },
    }),

  home: (orgId: string, courseId?: string) =>
    api<OrganizationHome>(`/organizations/${orgId}/home`, { query: { courseId } }),

  members: (
    orgId: string,
    params: {
      query?: string;
      status?: MemberStatus;
      activity?: MemberActivityStatus;
      courseId?: string;
      period?: Period;
      sort?: { by: MemberSort; direction: "asc" | "desc" };
      page?: number;
      size?: number;
    },
  ) => {
    const { sort, period, ...rest } = params;
    return api<Page<OrganizationMemberSummary>>(`/organizations/${orgId}/members`, {
      query: {
        ...rest,
        ...periodQuery(period),
        sort: sort ? `${sort.by},${sort.direction}` : undefined,
      },
    });
  },

  /**
   * The participant list: `period` only picks who joined in it; state is active/inactive over the
   * last 7 days; `includeCompleted: false` hides who completed the selected course(s).
   */
  participants: (
    orgId: string,
    params: {
      query?: string;
      activity?: ParticipantActivity;
      courseId?: string;
      period?: Period;
      includeCompleted: boolean;
      sort?: { by: MemberSort; direction: "asc" | "desc" };
      page?: number;
      size?: number;
    },
  ) => {
    const { sort, period, ...rest } = params;
    return api<Page<ParticipantSummary>>(`/organizations/${orgId}/members/roster`, {
      query: {
        ...rest,
        ...periodQuery(period),
        sort: sort ? `${sort.by},${sort.direction}` : undefined,
      },
    });
  },

  /** One participant's training, course by course, plus a total row. */
  participantTraining: (orgId: string, userId: string) =>
    api<ParticipantTraining>(`/organizations/${orgId}/members/${userId}/training`),

  member: (orgId: string, userId: string, period?: Period) =>
    api<MemberProgress>(`/organizations/${orgId}/members/${userId}`, {
      query: periodQuery(period),
    }),

  remindMember: (orgId: string, userId: string) =>
    api<ParticipantReminder>(`/organizations/${orgId}/members/${userId}/reminders`, {
      method: "POST",
    }),

  removeMember: (orgId: string, userId: string) =>
    api(`/organizations/${orgId}/members/${userId}`, { method: "DELETE" }),

  modules: (orgId: string, params: { courseId?: string; period?: Period }) =>
    api<ModuleStats[]>(`/organizations/${orgId}/modules`, {
      query: { courseId: params.courseId, ...periodQuery(params.period) },
    }),

  catalog: () => api<PurchaseCatalog>("/organizations/catalog", { anonymous: true }),

  quote: (params: { courseId: string; seats: number; durationDays: number }) =>
    api<PurchaseQuote>("/organizations/catalog/quote", { query: params, anonymous: true }),

  purchases: (orgId: string) => api<Purchase[]>(`/organizations/${orgId}/purchases`),

  purchase: (orgId: string, purchaseId: string) =>
    api<PurchaseDetail>(`/organizations/${orgId}/purchases/${purchaseId}`),

  /** How the people of a purchase are doing in its course (completed, rate, average progress). */
  purchaseProgress: (orgId: string, purchaseId: string) =>
    api<PurchaseProgress>(`/organizations/${orgId}/purchases/${purchaseId}/progress`),

  /** The purchase's course as the buy screen showed it, from the version that was bought. */
  purchasedCourse: (orgId: string, purchaseId: string) =>
    api<CatalogCourse>(`/organizations/${orgId}/purchases/${purchaseId}/course`),

  createPurchase: (
    orgId: string,
    data: { courseId: string; durationDays: number; emails: string[] },
  ) => api<PurchaseDetail>(`/organizations/${orgId}/purchases`, { method: "POST", body: data }),

  cancelPurchase: (orgId: string, purchaseId: string) =>
    api<PurchaseDetail>(`/organizations/${orgId}/purchases/${purchaseId}/cancel`, {
      method: "POST",
    }),

  checkout: (orgId: string, purchaseId: string) =>
    api<PurchaseCheckout>(`/organizations/${orgId}/purchases/${purchaseId}/checkout`, {
      method: "POST",
    }),

  /** Cancels a paid purchase within the withdrawal period: a reason is required, the comment optional. */
  withdrawPurchase: (
    orgId: string,
    purchaseId: string,
    data: { reason: RefundRequestReason; message?: string },
  ) =>
    api<PurchaseDetail>(`/organizations/${orgId}/purchases/${purchaseId}/refund`, {
      method: "POST",
      body: { reason: data.reason, message: data.message?.trim() || null },
    }),

  syncPayment: (orgId: string, purchaseId: string) =>
    api<PaymentSync>(`/organizations/${orgId}/purchases/${purchaseId}/payments/sync`, {
      method: "POST",
    }),

  createPurchaseRefundRequest: (
    orgId: string,
    purchaseId: string,
    data: { reason: RefundRequestReason; message?: string },
  ) =>
    api<UserRefundRequestResponse>(
      `/organizations/${orgId}/purchases/${purchaseId}/refund-request`,
      { method: "POST", body: data },
    ),

  invitations: (orgId: string, courseId?: string) =>
    api<OrganizationInvitation[]>(`/organizations/${orgId}/invitations`, {
      query: { courseId },
    }),

  invitationSummary: (orgId: string, courseId?: string) =>
    api<InvitationSummary>(`/organizations/${orgId}/invitations/summary`, {
      query: { courseId },
    }),

  updateSeatEmail: (orgId: string, purchaseId: string, seatId: string, email: string) =>
    api<PurchaseDetail>(`/organizations/${orgId}/purchases/${purchaseId}/seats/${seatId}`, {
      method: "PATCH",
      body: { email },
    }),

  remindSeat: (orgId: string, purchaseId: string, seatId: string) =>
    api<PurchaseDetail>(
      `/organizations/${orgId}/purchases/${purchaseId}/seats/${seatId}/reminders`,
      { method: "POST" },
    ),
};
