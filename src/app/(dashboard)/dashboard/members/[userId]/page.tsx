"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/dashboard/icons";
import {
  Avatar,
  Card,
  CardTitle,
  ErrorState,
  LoadingState,
  ProgressBar,
  StatusPill,
  pillButton,
} from "@/components/dashboard/ui";
import { useAuth } from "@/features/auth/auth-context";
import { organizationsApi } from "@/lib/api/organizations";
import {
  daysSince,
  formatDate,
  formatMinutes,
  formatRelativeDays,
  memberDisplayStatus,
} from "@/lib/dashboard-format";

function Metric({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-border bg-surface rounded-2xl border p-[18px]">
      <p className="text-text-muted text-[13px] font-bold">{label}</p>
      <p className="font-display mt-1.5 flex items-center gap-1.5 text-3xl leading-9 font-extrabold tracking-tight whitespace-nowrap">
        {children}
      </p>
    </div>
  );
}

export default function MemberDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { organization } = useAuth();
  const orgId = organization?.id;
  const [confirming, setConfirming] = useState(false);

  const { data, isPending, error } = useQuery({
    queryKey: ["organization", orgId, "members", "detail", userId],
    queryFn: () => organizationsApi.member(orgId!, userId),
    enabled: Boolean(orgId),
  });

  const remove = useMutation({
    mutationFn: () => organizationsApi.removeMember(orgId!, userId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["organization", orgId] });
      router.replace("/dashboard/members");
    },
  });

  const back = (
    <Link
      href="/dashboard/members"
      className="text-text-muted flex items-center gap-1 self-start text-sm font-bold"
    >
      <Icon name="chevronBack" className="size-4" />
      Participantes
    </Link>
  );

  if (isPending)
    return (
      <>
        {back}
        <LoadingState>Cargando participante…</LoadingState>
      </>
    );
  if (error)
    return (
      <>
        {back}
        <ErrorState>No pudimos cargar al participante.</ErrorState>
      </>
    );

  const m = data;
  const started = m.progressPercentage > 0;

  return (
    <section className="flex flex-col gap-4">
      {back}

      <div className="border-border bg-surface flex flex-wrap items-center gap-[18px] rounded-3xl border p-6">
        <Avatar seed={m.userId} name={m.name} lastName={m.lastName} size="lg" />
        <div className="flex min-w-[220px] flex-1 flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="font-display text-3xl leading-9 font-bold">
              {m.name} {m.lastName}
            </h1>
            <StatusPill status={memberDisplayStatus(m)} />
          </div>
          <p className="text-text-muted text-sm">
            {m.email} · Se incorporó el {formatDate(m.joinedAt)} · Última vez:{" "}
            {formatRelativeDays(daysSince(m.lastActivityAt)).toLowerCase()}
          </p>
        </div>
        {m.status === "ACTIVE" ? (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className={`${pillButton} text-danger rounded-xl px-4 py-2.5 text-sm`}
          >
            <Icon name="personRemove" className="size-4" />
            Quitar de la organización
          </button>
        ) : null}
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,220px),1fr))] gap-3">
        <Metric label="Avance">{m.progressPercentage}%</Metric>
        <Metric label="Lecciones">
          {m.completedLessons}
          <span className="text-text-muted text-lg font-bold">/{m.totalLessons}</span>
        </Metric>
        <Metric label="Señas aprendidas">{m.signsLearned}</Metric>
        <Metric label="Respuestas correctas">{started ? `${m.correctPercentage}%` : "—"}</Metric>
        <Metric label="Racha actual">
          <Icon name="flame" className="text-streak-orange size-6" />
          {m.currentStreak} {m.currentStreak === 1 ? "día" : "días"}
        </Metric>
        <Metric label="Tiempo de aprendizaje">
          {started ? formatMinutes(m.learningMinutes) : "—"}
        </Metric>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] gap-4">
        <Card className="flex flex-col gap-2">
          <CardTitle>Progreso por curso</CardTitle>
          {m.courses.length === 0 ? (
            <p className="text-text-muted text-sm">Todavía no hay cursos asignados.</p>
          ) : null}
          {m.courses.map((c) => (
            <div
              key={c.courseId}
              className="border-fill flex flex-col gap-2 border-b py-3 last:border-b-0"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-[15px] font-bold">{c.courseName}</span>
                <span className="text-text-muted text-[13px]">
                  {c.completedLessons}/{c.totalLessons} lecciones
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <ProgressBar
                  percent={c.progressPercentage}
                  className="flex-1"
                  label={`Avance en ${c.courseName}`}
                />
                <span className="w-10 text-sm font-extrabold">{c.progressPercentage}%</span>
              </div>
            </div>
          ))}
        </Card>

        <Card className="flex flex-col gap-2">
          <CardTitle>Actividad</CardTitle>
          <dl className="flex flex-col text-sm">
            {[
              [
                "Módulo actual",
                m.progressPercentage >= 100 ? "Curso completo" : (m.currentModule ?? "—"),
              ],
              ["Módulos completados", m.modulesCompleted],
              ["Días activos (últimos 30)", m.activeDaysLast30],
              ["Ejercicios realizados", m.exerciseAttempts],
              ["Respuestas correctas", `${m.correctAnswers} de ${m.exerciseAttempts}`],
            ].map(([label, value]) => (
              <div
                key={label}
                className="border-fill flex justify-between gap-3 border-b py-2.5 last:border-b-0"
              >
                <dt className="text-text-muted">{label}</dt>
                <dd className="font-extrabold">{value}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>

      {confirming ? (
        <div
          onClick={() => !remove.isPending && setConfirming(false)}
          className="bg-text/45 fixed inset-0 z-50 flex items-center justify-center p-5"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="remove-title"
            onClick={(e) => e.stopPropagation()}
            className="bg-background flex w-full max-w-[440px] flex-col gap-3 rounded-3xl p-7"
          >
            <p id="remove-title" className="font-display text-2xl font-bold tracking-tight">
              ¿Quitar a {m.name} {m.lastName}?
            </p>
            <p className="text-text-muted text-[15px] text-pretty">
              Deja de tener acceso a los contenidos contratados por {organization?.name}. Podés
              volver a invitar a esta persona más adelante.
            </p>
            {remove.error ? <ErrorState>No pudimos quitar a la persona.</ErrorState> : null}
            <div className="mt-2 flex justify-end gap-2">
              <button
                type="button"
                disabled={remove.isPending}
                onClick={() => setConfirming(false)}
                className="border-border bg-surface cursor-pointer rounded-xl border px-5 py-3 text-[15px] font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={remove.isPending}
                onClick={() => remove.mutate()}
                className="bg-danger text-surface cursor-pointer rounded-xl px-5 py-3 text-[15px] font-bold disabled:opacity-60"
              >
                {remove.isPending ? "Quitando…" : "Quitar"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
