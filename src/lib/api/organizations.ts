import { api } from "@/lib/api/client";
import type {
  InviteCode,
  MemberActivityStatus,
  MemberProgress,
  MemberSort,
  MemberStatus,
  ModuleStats,
  MyOrganization,
  OrganizationMemberSummary,
  OrganizationOverview,
  Page,
  RedeemInviteCodeResponse,
} from "@/lib/api/types";

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

  overview: (orgId: string, courseId?: string) =>
    api<OrganizationOverview>(`/organizations/${orgId}/overview`, { query: { courseId } }),

  members: (
    orgId: string,
    params: {
      query?: string;
      status?: MemberStatus;
      activity?: MemberActivityStatus;
      courseId?: string;
      sort?: { by: MemberSort; direction: "asc" | "desc" };
      page?: number;
      size?: number;
    },
  ) => {
    const { sort, ...rest } = params;
    return api<Page<OrganizationMemberSummary>>(`/organizations/${orgId}/members`, {
      query: { ...rest, sort: sort ? `${sort.by},${sort.direction}` : undefined },
    });
  },

  member: (orgId: string, userId: string) =>
    api<MemberProgress>(`/organizations/${orgId}/members/${userId}`),

  removeMember: (orgId: string, userId: string) =>
    api(`/organizations/${orgId}/members/${userId}`, { method: "DELETE" }),

  modules: (orgId: string, courseId?: string) =>
    api<ModuleStats[]>(`/organizations/${orgId}/modules`, { query: { courseId } }),

  inviteCodes: (orgId: string) => api<InviteCode[]>(`/organizations/${orgId}/invite-codes`),

  createInviteCode: (orgId: string) =>
    api<InviteCode>(`/organizations/${orgId}/invite-codes`, { method: "POST", body: {} }),

  deactivateInviteCode: (orgId: string, inviteCodeId: string) =>
    api(`/organizations/${orgId}/invite-codes/${inviteCodeId}`, { method: "DELETE" }),

  inviteByEmail: (orgId: string, email: string) =>
    api<InviteCode>(`/organizations/${orgId}/invitations`, { method: "POST", body: { email } }),
};
