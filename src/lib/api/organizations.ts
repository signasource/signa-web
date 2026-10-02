import { api } from "@/lib/api/client";
import type {
  InviteCode,
  MemberProgress,
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

  redeemInviteCode: (code: string) =>
    api<RedeemInviteCodeResponse>("/organizations/invite-codes/redeem", {
      method: "POST",
      body: { code },
    }),

  overview: (orgId: string) => api<OrganizationOverview>(`/organizations/${orgId}/overview`),

  members: (
    orgId: string,
    params: { query?: string; status?: MemberStatus; page?: number; size?: number },
  ) => api<Page<OrganizationMemberSummary>>(`/organizations/${orgId}/members`, { query: params }),

  member: (orgId: string, userId: string) =>
    api<MemberProgress>(`/organizations/${orgId}/members/${userId}`),

  removeMember: (orgId: string, userId: string) =>
    api(`/organizations/${orgId}/members/${userId}`, { method: "DELETE" }),

  modules: (orgId: string) => api<ModuleStats[]>(`/organizations/${orgId}/modules`),

  inviteCodes: (orgId: string) => api<InviteCode[]>(`/organizations/${orgId}/invite-codes`),

  createInviteCode: (orgId: string) =>
    api<InviteCode>(`/organizations/${orgId}/invite-codes`, { method: "POST", body: {} }),

  deactivateInviteCode: (orgId: string, inviteCodeId: string) =>
    api(`/organizations/${orgId}/invite-codes/${inviteCodeId}`, { method: "DELETE" }),

  inviteByEmail: (orgId: string, email: string) =>
    api<InviteCode>(`/organizations/${orgId}/invitations`, { method: "POST", body: { email } }),
};
