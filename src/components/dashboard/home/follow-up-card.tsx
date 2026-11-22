"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/dashboard/icons";
import { InfoButton } from "@/components/dashboard/info-popover";
import { Avatar, Card, CardTitle, ProgressBar, pillButton } from "@/components/dashboard/ui";
import { avatarSrc } from "@/lib/avatar-url";
import { organizationsApi } from "@/lib/api/organizations";
import type { HomeFollowUpParticipant } from "@/lib/api/types";
import { formatDate } from "@/lib/dashboard-format";
import {
  canRemind,
  followUpCourseDetail,
  followUpLabels,
  followUpProgressText,
} from "@/lib/home-metrics";

const VISIBLE = 6;

/** Who needs a nudge, highest priority first, each with a reminder button (and one for all). */
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
  const [notice, setNotice] = useState<string | null>(null);
  const remind = useMutation({
    mutationFn: (userId: string) => organizationsApi.remindMember(orgId!, userId),
    onSuccess: async () => {
      setNotice("Mandamos el recordatorio.");
      await queryClient.invalidateQueries({ queryKey: homeKey });
    },
    onError: () => setNotice(null),
  });
  const remindable = participants.filter((p) => canRemind(p.nextReminderAvailableAt));
  const remindAll = useMutation({
    mutationFn: async (userIds: string[]) => {
      const results = await Promise.allSettled(
        userIds.map((id) => organizationsApi.remindMember(orgId!, id)),
      );
      return {
        sent: results.filter((r) => r.status === "fulfilled").length,
        failed: results.filter((r) => r.status === "rejected").length,
      };
    },
    onSuccess: async ({ sent, failed }) => {
      setNotice(
        failed === 0
          ? `Mandamos ${sent} ${sent === 1 ? "recordatorio" : "recordatorios"}.`
          : `Mandamos ${sent} y no pudimos mandar ${failed}. Probá de nuevo más tarde.`,
      );
      await queryClient.invalidateQueries({ queryKey: homeKey });
    },
  });
  const busy = remind.isPending || remindAll.isPending;
  const shown = expanded ? participants : participants.slice(0, VISIBLE);

  return (
    <Card delay={delay} className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <CardTitle>Requieren seguimiento</CardTitle>
          <p className="text-text-muted mt-0.5 text-[13px]">Los más urgentes, primero.</p>
        </div>
        <InfoButton label="¿Quiénes aparecen acá?" className="mt-1">
          <p className="text-text text-[13px] leading-relaxed">
            Participantes con un curso sin terminar y con el acceso vigente, cuando:
          </p>
          <ul className="text-text-muted flex list-disc flex-col gap-1.5 pl-4 text-[13px] leading-relaxed">
            <li>Les quedan menos de 3 días de acceso y todavía no terminaron el curso.</li>
            <li>Les quedan menos de 7 días de acceso y completaron menos del 50% del curso.</li>
            <li>
              No tuvieron actividad en los últimos 7 días (a quien empezó hace menos de 7 días se le
              da ese margen).
            </li>
          </ul>
          <p className="text-text-muted text-[13px] leading-relaxed">
            La barra muestra el porcentaje de lecciones completadas de esos cursos, según el filtro
            de cursos elegido.
          </p>
        </InfoButton>
      </div>

      {participants.length > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-text-muted text-[13px]">
            {participants.length} {participants.length === 1 ? "persona" : "personas"}
          </span>
          <button
            type="button"
            disabled={remindable.length === 0 || busy}
            onClick={() => remindAll.mutate(remindable.map((p) => p.userId))}
            className={pillButton}
          >
            <Icon name="mail" className="size-3.5" />
            {remindAll.isPending
              ? "Enviando…"
              : remindable.length === 0
                ? "Todos recibieron un recordatorio"
                : `Enviar recordatorio a todos (${remindable.length})`}
          </button>
        </div>
      ) : null}

      {notice ? (
        <p role="status" className="text-success-dark text-sm font-bold">
          {notice}
        </p>
      ) : null}
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
            const progressText = followUpProgressText(p);
            return (
              <li key={p.userId} className="border-fill flex gap-3 border-b py-3.5 last:border-b-0">
                <Avatar
                  seed={p.userId}
                  name={p.name}
                  lastName={p.lastName}
                  src={avatarSrc(p.avatarUrl)}
                />
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <div className="flex items-start justify-between gap-3">
                    <Link
                      href={memberHref(p.userId)}
                      className="truncate pt-1 text-[15px] font-bold hover:underline"
                    >
                      {p.name} {p.lastName}
                    </Link>
                    <button
                      type="button"
                      disabled={!available || busy}
                      title={
                        available || !p.nextReminderAvailableAt
                          ? undefined
                          : `Podés mandar otro recordatorio el ${formatDate(p.nextReminderAvailableAt)}`
                      }
                      onClick={() => remind.mutate(p.userId)}
                      className={`${pillButton} shrink-0`}
                    >
                      <Icon name={available ? "mail" : "check"} className="size-3.5" />
                      {sending ? "Enviando…" : available ? "Enviar recordatorio" : "Enviado"}
                    </button>
                  </div>
                  <span className="flex flex-wrap gap-1">
                    {followUpLabels(p).map((label) => (
                      <span
                        key={label}
                        className="bg-shop-amber-light text-shop-amber-dark rounded-full px-2 py-0.5 text-[11px] font-extrabold whitespace-nowrap"
                      >
                        {label}
                      </span>
                    ))}
                  </span>
                  <div className="flex items-center gap-2.5" title={followUpCourseDetail(p)}>
                    <ProgressBar
                      percent={p.progressPercentage}
                      className="h-2 w-24 shrink-0"
                      label={progressText}
                    />
                    <span className="text-text-muted min-w-0 text-xs">{progressText}</span>
                  </div>
                </div>
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
