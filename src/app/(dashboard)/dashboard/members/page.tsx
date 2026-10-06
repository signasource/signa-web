"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "@/components/dashboard/icons";
import {
  Avatar,
  ErrorState,
  LoadingState,
  PageHeading,
  ProgressBar,
  StatusPill,
  pillButton,
  primaryButton,
} from "@/components/dashboard/ui";
import { useAuth } from "@/features/auth/auth-context";
import { organizationsApi } from "@/lib/api/organizations";
import type { MemberStatus } from "@/lib/api/types";
import {
  daysSince,
  formatDate,
  formatRelativeDays,
  memberDisplayStatus,
} from "@/lib/dashboard-format";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 8;
const FILTERS: { status: MemberStatus; label: string }[] = [
  { status: "ACTIVE", label: "Activos" },
  { status: "REMOVED", label: "Quitados" },
];
const GRID =
  "grid grid-cols-[minmax(240px,2.2fr)_112px_minmax(170px,1.4fr)_minmax(170px,1.5fr)_116px_116px] gap-4";

function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return debounced;
}

export default function MembersPage() {
  const { organization } = useAuth();
  const orgId = organization?.id;
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<MemberStatus>("ACTIVE");
  const [page, setPage] = useState(0);
  const query = useDebounced(search.trim(), 300);

  const { data, isPending, error } = useQuery({
    queryKey: ["organization", orgId, "members", { query, status, page, size: PAGE_SIZE }],
    queryFn: () =>
      organizationsApi.members(orgId!, {
        query: query || undefined,
        status,
        page,
        size: PAGE_SIZE,
      }),
    enabled: Boolean(orgId),
    placeholderData: keepPreviousData,
  });

  const total = data?.totalElements ?? 0;
  const from = page * PAGE_SIZE + 1;
  const to = Math.min(total, page * PAGE_SIZE + PAGE_SIZE);

  return (
    <section className="flex flex-col gap-5">
      <PageHeading
        title="Participantes"
        subtitle={
          data && status === "ACTIVE" && !query
            ? `${data.totalElements} ${data.totalElements === 1 ? "persona con acceso" : "personas con acceso"}${organization?.courses[0] ? ` a ${organization.courses[0].name}` : ""}`
            : undefined
        }
      >
        <Link href="/dashboard/invitations" className={primaryButton}>
          <Icon name="personAdd" />
          Invitar personas
        </Link>
      </PageHeading>

      <div className="flex flex-col gap-3">
        <label className="border-border bg-surface flex h-[42px] items-center gap-2 rounded-lg border px-3">
          <Icon name="search" className="text-text-muted" />
          <span className="sr-only">Buscar participantes</span>
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder="Buscá por nombre, apellido o email"
            className="min-w-0 flex-1 bg-transparent text-[15px] outline-none"
          />
        </label>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Estado">
          {FILTERS.map((f) => (
            <button
              key={f.status}
              type="button"
              aria-pressed={status === f.status}
              onClick={() => {
                setStatus(f.status);
                setPage(0);
              }}
              className={cn(
                "cursor-pointer rounded-full px-3.5 py-2 text-[13px] font-extrabold",
                status === f.status ? "bg-text text-on-dark" : "bg-fill text-text",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {isPending ? <LoadingState>Cargando participantes…</LoadingState> : null}
      {error ? <ErrorState>No pudimos cargar a los participantes.</ErrorState> : null}

      {data ? (
        <>
          <div className="border-border bg-surface overflow-x-auto rounded-2xl border">
            <div className="min-w-[940px] px-5 py-2">
              <div
                className={cn(
                  GRID,
                  "border-border text-text-muted border-b py-3 text-xs font-extrabold tracking-wider",
                )}
              >
                <span>PERSONA</span>
                <span>ESTADO</span>
                <span>MÓDULO ACTUAL</span>
                <span>AVANCE DEL CURSO</span>
                <span>ÚLTIMA VEZ</span>
                <span>INCORPORACIÓN</span>
              </div>
              {data.content.map((m) => (
                <Link
                  key={m.userId}
                  href={`/dashboard/members/${m.userId}`}
                  className={cn(GRID, "border-fill hover:bg-background items-center border-b py-3")}
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <Avatar seed={m.userId} name={m.name} lastName={m.lastName} />
                    <span className="flex min-w-0 flex-col">
                      <span className="text-[15px] font-bold">
                        {m.name} {m.lastName}
                      </span>
                      <span className="text-text-muted truncate text-[13px]">{m.email}</span>
                    </span>
                  </span>
                  <span>
                    <StatusPill status={memberDisplayStatus(m)} />
                  </span>
                  <span className="truncate text-sm">
                    {m.progressPercentage >= 100 ? "Curso completo" : (m.currentModule ?? "—")}
                  </span>
                  <span className="flex items-center gap-2.5">
                    <ProgressBar
                      percent={m.progressPercentage}
                      className="flex-1"
                      label={`Avance de ${m.name}`}
                    />
                    <span className="w-10 text-sm font-extrabold">{m.progressPercentage}%</span>
                  </span>
                  <span className="text-text-muted text-sm">
                    {formatRelativeDays(daysSince(m.lastActivityAt))}
                  </span>
                  <span className="text-text-muted text-sm">{formatDate(m.joinedAt)}</span>
                </Link>
              ))}
              {data.content.length === 0 ? (
                <div className="flex flex-col items-center gap-1.5 py-10 text-center">
                  <p className="font-display text-lg font-bold">
                    {query ? "No encontramos a nadie" : "No hay personas en este filtro"}
                  </p>
                  <p className="text-text-muted text-sm">
                    {query
                      ? "Probá con otro nombre o email."
                      : "Cambiá el filtro para ver al resto del equipo."}
                  </p>
                </div>
              ) : null}
            </div>
          </div>

          {total > 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-text-muted text-sm">
                Mostrando {from}–{to} de {total}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  className={pillButton}
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  <Icon name="chevronBack" className="size-3.5" />
                  Anterior
                </button>
                <button
                  type="button"
                  className={pillButton}
                  disabled={page >= data.totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Siguiente
                  <Icon name="chevronForward" className="size-3.5" />
                </button>
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
