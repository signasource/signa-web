import { api } from "@/lib/api/client";
import type {
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
    params: { query?: string; status?: string; page?: number; size?: number },
  ) => api<Page<OrganizationMemberSummary>>(`/organizations/${orgId}/members`, { query: params }),
};
