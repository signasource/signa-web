import { api } from "@/lib/api/client";
import type { AcceptedInvitation, InvitationPreview } from "@/lib/api/types";

export const invitationsApi = {
  preview: (token: string) =>
    api<InvitationPreview>(`/invitations/${encodeURIComponent(token)}`, { anonymous: true }),

  accept: (token: string) =>
    api<AcceptedInvitation>(`/invitations/${encodeURIComponent(token)}/accept`, {
      method: "POST",
    }),
};
