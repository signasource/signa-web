import { api } from "@/lib/api/client";
import type { Period } from "@/lib/date-range";
import type {
  MemberActivityStatus,
  MemberProgress,
  MemberSort,
  MemberStatus,
  ModuleStats,
  MyOrganization,
  OrganizationActivity,
  OrganizationMemberSummary,
  OrganizationOverview,
  Page,
  Purchase,
  PaymentSync,
  PurchaseCatalog,
  PurchaseCheckout,
  PurchaseDetail,
  PurchaseQuote,
  RedeemInviteCodeResponse,
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
    contactPhone?: string;
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

  activity: (orgId: string, params: { courseId?: string; period?: Period }) =>
    api<OrganizationActivity>(`/organizations/${orgId}/activity`, {
      query: { courseId: params.courseId, ...periodQuery(params.period) },
    }),

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

  member: (orgId: string, userId: string, period?: Period) =>
    api<MemberProgress>(`/organizations/${orgId}/members/${userId}`, {
      query: periodQuery(period),
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

  syncPayment: (orgId: string, purchaseId: string, paymentId: string) =>
    api<PaymentSync>(`/organizations/${orgId}/purchases/${purchaseId}/payments/sync`, {
      method: "POST",
      body: { paymentId },
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
