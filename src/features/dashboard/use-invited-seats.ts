"use client";

import { useQuery } from "@tanstack/react-query";
import { organizationsApi } from "@/lib/api/organizations";

/** Query key prefix of the invitations list, to invalidate it after changing a seat or purchase. */
export const invitationsKey = (orgId: string | undefined) => ["organization", orgId, "invitations"];

/**
 * Invitations sent and not yet accepted (pending or expired) of the organization's paid purchases.
 * They are not members: accepting turns the seat `ACTIVE`, which drops it from here and lists the
 * person as a participant.
 */
export function useInvitedSeats(orgId: string | undefined, courseId: string | undefined) {
  const { data, isPending, error } = useQuery({
    queryKey: [...invitationsKey(orgId), courseId ?? null],
    queryFn: () => organizationsApi.invitations(orgId!, courseId),
    enabled: Boolean(orgId),
    refetchOnWindowFocus: true,
  });
  return { isPending, error, rows: data ?? [] };
}
