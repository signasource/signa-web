"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/dashboard/icons";
import { Avatar, Card, CardTitle, ProgressBar, pillButton } from "@/components/dashboard/ui";
import { avatarSrc } from "@/lib/avatar-url";
import { organizationsApi } from "@/lib/api/organizations";
import type { HomeFollowUpParticipant } from "@/lib/api/types";
import { formatDate } from "@/lib/dashboard-format";
import { canRemind, followUpLabels } from "@/lib/home-metrics";

const VISIBLE = 6;

/** Who needs a nudge, highest priority first, each with a reminder button. */
export function FollowUpCard({
  orgId,
  participants,
  homeKey,
  memberHref,
  delay,
}: {
  orgId: string | undefined;
  participants: HomeFollowUpParticipant[];
  /** Query key of the home data, refreshed after a reminder. */
  homeKey: readonly unknown[];
  memberHref: (userId: string) => string;
  delay?: number;
}) {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const remind = useMutation({
    mutationFn: (userId: string) => organizationsApi.remindMember(orgId!, userId),
    onSuccess: async (_, userId) => {
      setSent(userId);
      await queryClient.invalidateQueries({ queryKey: homeKey });
    },
    onError: () => setSent(null),
  });
  const shown = expanded ? participants : participants.slice(0, VISIBLE);

  return (
    <Card delay={delay} className="flex flex-col gap-3">
      <div>
        <CardTitle>Requieren seguimiento</CardTitle>
        <p className="text-text-muted mt-0.5 text-[13px]">
          Inactivos, con poco avance o con el acceso por vencer. Los más urgentes, primero.
        </p>
      </div>
      {remind.error ? (
        <p role="alert" className="text-danger text-sm">
          No pudimos mandar el recordatorio. Probá de nuevo más tarde.
        </p>
      ) : null}
      {participants.length === 0 ? (
        <p className="text-text-muted text-sm">
          Nadie necesita seguimiento por ahora. ¡Buen ritmo!
        </p>
      ) : (
        <ul className="flex flex-col">
          {shown.map((p) => {
            const available = canRemind(p.nextReminderAvailableAt);
            const sending = remind.isPending && remind.variables === p.userId;
            return (
              <li
                key={p.userId}
                className="border-fill flex flex-wrap items-center gap-x-4 gap-y-2 border-b py-3 last:border-b-0"
              >
                <Link
                  href={memberHref(p.userId)}
                  className="flex min-w-[180px] flex-[2_1_220px] items-center gap-2.5"
                >
                  <Avatar
                    seed={p.userId}
                    name={p.name}
                    lastName={p.lastName}
                    src={avatarSrc(p.avatarUrl)}
                  />
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-[15px] font-bold hover:underline">
                      {p.name} {p.lastName}
                    </span>
                    <span className="flex flex-wrap gap-1 pt-1">
                      {followUpLabels(p).map((label) => (
                        <span
                          key={label}
                          className="bg-shop-amber-light text-shop-amber-dark rounded-full px-2 py-0.5 text-[11px] font-extrabold"
                        >
                          {label}
                        </span>
                      ))}
                    </span>
                  </span>
                </Link>
                <span className="flex min-w-[120px] flex-[1_1_120px] items-center gap-2">
                  <ProgressBar
                    percent={p.progressPercentage}
                    className="flex-1"
                    label={`Avance de ${p.name}`}
                  />
                  <span className="w-[38px] text-sm font-extrabold">{p.progressPercentage}%</span>
                </span>
                <button
                  type="button"
                  disabled={!available || remind.isPending}
                  title={
                    available || !p.nextReminderAvailableAt
                      ? undefined
                      : `Podés mandar otro recordatorio el ${formatDate(p.nextReminderAvailableAt)}`
                  }
                  onClick={() => remind.mutate(p.userId)}
                  className={pillButton}
                >
                  <Icon name={sent === p.userId ? "check" : "mail"} className="size-3.5" />
                  {sending
                    ? "Enviando…"
                    : available
                      ? "Enviar recordatorio"
                      : "Recordatorio enviado"}
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {participants.length > VISIBLE ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-primary-dark cursor-pointer self-start text-sm font-bold hover:underline"
        >
          {expanded ? "Ver menos" : `Ver los ${participants.length}`}
        </button>
      ) : null}
    </Card>
  );
}
