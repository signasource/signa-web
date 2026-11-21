"use client";

import Link from "next/link";
import { useState } from "react";
import { Avatar, Card, CardTitle } from "@/components/dashboard/ui";
import { avatarSrc } from "@/lib/avatar-url";
import type { HomeActiveParticipant } from "@/lib/api/types";
import { daysSince, formatRelativeDays } from "@/lib/dashboard-format";

const VISIBLE = 6;
const NUMBER = new Intl.NumberFormat("es-AR");

/** Who did learning activities in the window, most active first. */
export function ActiveParticipantsCard({
  participants,
  windowDays,
  memberHref,
  delay,
}: {
  participants: HomeActiveParticipant[];
  windowDays: number;
  memberHref: (userId: string) => string;
  delay?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? participants : participants.slice(0, VISIBLE);

  return (
    <Card delay={delay} className="flex flex-col gap-3">
      <div>
        <CardTitle>Participantes activos</CardTitle>
        <p className="text-text-muted mt-0.5 text-[13px]">
          Con actividad en los últimos {windowDays} días. Los más activos, primero.
        </p>
      </div>
      {participants.length === 0 ? (
        <p className="text-text-muted text-sm">
          Nadie tuvo actividad en los últimos {windowDays} días.
        </p>
      ) : (
        <ol className="flex flex-col">
          {shown.map((p) => (
            <li key={p.userId} className="border-fill border-b last:border-b-0">
              <Link
                href={memberHref(p.userId)}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-2.5"
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <Avatar
                    seed={p.userId}
                    name={p.name}
                    lastName={p.lastName}
                    src={avatarSrc(p.avatarUrl)}
                  />
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-[15px] font-bold">
                      {p.name} {p.lastName}
                    </span>
                    <span className="text-text-muted text-xs">
                      {NUMBER.format(p.activities)}{" "}
                      {p.activities === 1 ? "actividad" : "actividades"} · {p.activeDays}{" "}
                      {p.activeDays === 1 ? "día" : "días"} · avance {p.progressPercentage}%
                    </span>
                  </span>
                </span>
                <span className="text-success-dark text-right text-sm font-bold">
                  {formatRelativeDays(daysSince(p.lastActivityAt))}
                </span>
              </Link>
            </li>
          ))}
        </ol>
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
