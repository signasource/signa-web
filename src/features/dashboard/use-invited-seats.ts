"use client";

import { useQueries, useQuery } from "@tanstack/react-query";
import { organizationsApi } from "@/lib/api/organizations";
import type { PurchaseDetail } from "@/lib/api/types";
import { hasInvitedSeats, invitedSeatsOf, type InvitedSeat } from "@/lib/purchases";

/**
 * Seats whose person has not accepted yet. They are not members, so they come from the purchases:
 * the list plus one detail per purchase that can still hold pending people. Accepting turns the
 * seat `ACTIVE`, which drops it from here and lists the person as a participant.
 */
export function useInvitedSeats(orgId: string | undefined, courseId: string | undefined) {
  const purchases = useQuery({
    queryKey: ["organization", orgId, "purchases"],
    queryFn: () => organizationsApi.purchases(orgId!),
    enabled: Boolean(orgId),
    refetchOnWindowFocus: true,
  });

  const withSeats = (purchases.data ?? []).filter(
    (p) => hasInvitedSeats(p) && (!courseId || p.courseId === courseId),
  );
  const details = useQueries({
    queries: withSeats.map((p) => ({
      queryKey: ["organization", orgId, "purchases", p.id],
      queryFn: () => organizationsApi.purchase(orgId!, p.id),
      enabled: Boolean(orgId),
    })),
  });

  const isPending = purchases.isPending || details.some((d) => d.isPending);
  const error = purchases.error ?? details.find((d) => d.error)?.error ?? null;
  const loaded: PurchaseDetail[] = details.flatMap((d) => (d.data ? [d.data] : []));
  const rows: InvitedSeat[] = loaded.flatMap((d) => invitedSeatsOf(d));

  return { isPending, error, rows };
}
