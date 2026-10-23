import { api } from "@/lib/api/client";
import type { Period } from "@/lib/date-range";
import type {
  InviteCode,
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
    memberLimit: number;
    adminName: string;
    adminPassword: string;
  }) =>
    api<{ organizationId: string; organizationName: string; status: string }>(
      "/organizations/register",
      { method: "POST", body: data, anonymous: true },
    ),

  getPricing: () =>
    api<{ pricePerPerson: number; currency: string }>("/organizations/pricing", {
      anonymous: true,
    }),

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

  inviteCodes: (orgId: string) => api<InviteCode[]>(`/organizations/${orgId}/invite-codes`),

  createInviteCode: (orgId: string) =>
    api<InviteCode>(`/organizations/${orgId}/invite-codes`, { method: "POST", body: {} }),

  deactivateInviteCode: (orgId: string, inviteCodeId: string) =>
    api(`/organizations/${orgId}/invite-codes/${inviteCodeId}`, { method: "DELETE" }),

  inviteByEmail: (orgId: string, email: string) =>
    api<InviteCode>(`/organizations/${orgId}/invitations`, { method: "POST", body: { email } }),
};
