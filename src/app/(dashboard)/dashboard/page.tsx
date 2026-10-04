"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Icon } from "@/components/dashboard/icons";
import {
  Avatar,
  Card,
  CardTitle,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeading,
  ProgressBar,
  SectionIcon,
  StatCard,
  StatRows,
  primaryButton,
} from "@/components/dashboard/ui";
import { WeeklyEvolution } from "@/components/dashboard/weekly-evolution";
import { useAuth } from "@/features/auth/auth-context";
import { organizationsApi } from "@/lib/api/organizations";
import type { OrganizationMemberSummary } from "@/lib/api/types";
import {
  ACTIVE_WINDOW_DAYS,
  daysSince,
  formatDecimal,
  formatMinutes,
  formatRelativeDays,
} from "@/lib/dashboard-format";

const NUMBER = new Intl.NumberFormat("es-AR");

function needsNudge(members: OrganizationMemberSummary[]) {
  return members
    .map((m) => ({ member: m, days: daysSince(m.lastActivityAt) }))
    .filter(
      (x): x is { member: OrganizationMemberSummary; days: number } =>
        x.days !== null && x.days > ACTIVE_WINDOW_DAYS && x.member.progressPercentage < 100,
    )
    .sort((a, b) => b.days - a.days)
    .slice(0, 4);
}

export default function DashboardOverviewPage() {
  const { organization } = useAuth();
  const orgId = organization?.id;
  const courseName = organization?.courses[0]?.name;

  const overview = useQuery({
    queryKey: ["organization", orgId, "overview"],
    queryFn: () => organizationsApi.overview(orgId!),
    enabled: Boolean(orgId),
  });
  const modules = useQuery({
    queryKey: ["organization", orgId, "modules"],
    queryFn: () => organizationsApi.modules(orgId!),
    enabled: Boolean(orgId),
  });
  const members = useQuery({
    queryKey: ["organization", orgId, "members", { status: "ACTIVE", size: 100 }],
    queryFn: () => organizationsApi.members(orgId!, { status: "ACTIVE", size: 100 }),
    enabled: Boolean(orgId),
  });

  if (overview.isPending) return <LoadingState>Cargando métricas…</LoadingState>;
  if (overview.error) return <ErrorState>No pudimos cargar las métricas.</ErrorState>;

  const { participation, progress, performance } = overview.data;
  const moduleList = modules.data ?? [];
  const startedPct = (n: number) =>
    participation.totalParticipants ? (n / participation.totalParticipants) * 100 : 0;
  const funnel = [
    { label: "Inscriptas", value: participation.totalParticipants, tone: "bg-primary-medallion" },
    { label: "Iniciaron", value: participation.participantsStarted, tone: "bg-accent-violet" },
    { label: "Completaron", value: progress.participantsCompletedAll, tone: "bg-success" },
  ];
  const nudges = needsNudge(members.data?.content ?? []);

  return (
    <section className="flex flex-col gap-6">
      <PageHeading title="Resumen">
        <div className="flex flex-wrap gap-2">
          {courseName ? (
            <span className="bg-shop-amber-light text-shop-amber-dark rounded-full px-3.5 py-2 text-[13px] font-extrabold">
              Curso: {courseName}
            </span>
          ) : null}
          {modules.data ? (
            <span className="bg-fill rounded-full px-3.5 py-2 text-[13px] font-bold">
              {moduleList.length} módulos contratados
            </span>
          ) : null}
        </div>
      </PageHeading>

      {participation.totalParticipants === 0 ? (
        <EmptyState
          mascot
          title="Todavía no hay participantes"
          body="Invitá a tu equipo para que empiece la capacitación. Las métricas aparecen acá apenas alguien complete su primera lección."
          action={
            <Link href="/dashboard/invitations" className={primaryButton}>
              Invitar personas
            </Link>
          }
        />
      ) : (
        <div className="dash-page-enter flex flex-col gap-4">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
            <StatCard
              delay={0}
              label="Participantes"
              value={participation.totalParticipants}
              hint={`${participation.participantsStarted} iniciaron la capacitación`}
            />
            <StatCard
              delay={60}
              label={`Activos (últimos ${participation.activeWindowDays} días)`}
              value={participation.activeParticipants}
              hint={`${participation.inactiveParticipants} inactivos`}
            />
            <StatCard
              delay={120}
              label="Progreso promedio"
              value={`${progress.averageProgressPercentage}%`}
            >
              <ProgressBar
                percent={progress.averageProgressPercentage}
                tone="primary"
                label="Progreso promedio"
                className="mt-3"
              />
            </StatCard>
            <StatCard
              delay={180}
              label="Lecciones completadas"
              value={NUMBER.format(progress.completedLessons)}
              hint={`${progress.participantsCompletedAll} completaron todo el curso`}
            />
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="min-w-0 flex-[2_1_460px]">
              {performance.weeklyEvolution.length > 0 ? (
                <WeeklyEvolution weeks={performance.weeklyEvolution} delay={240} />
              ) : (
                <Card delay={240}>
                  <CardTitle>Evolución semanal</CardTitle>
                  <p className="text-text-muted mt-2 text-sm">
                    Todavía no hay actividad registrada por semana.
                  </p>
                </Card>
              )}
            </div>
            <Card delay={300} className="flex min-w-0 flex-[1_1_260px] flex-col gap-4">
              <div>
                <CardTitle>Avance del equipo</CardTitle>
                <p className="text-text-muted mt-0.5 text-[13px]">
                  Personas en cada etapa del curso
                </p>
              </div>
              <ul className="flex flex-col gap-3.5">
                {funnel.map((f) => (
                  <li key={f.label} className="flex flex-col gap-1.5">
                    <div className="flex justify-between gap-2 text-sm">
                      <span className="font-bold">{f.label}</span>
                      <span className="font-extrabold">{f.value}</span>
                    </div>
                    <div className="bg-fill h-2.5 overflow-hidden rounded-full">
                      <div
                        className={`${f.tone} h-full rounded-full`}
                        style={{ width: `${startedPct(f.value)}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,260px),1fr))] gap-4">
            <Card delay={360} className="flex flex-col gap-3.5">
              <div className="flex items-center gap-2.5">
                <SectionIcon name="people" className="bg-primary-light text-primary-dark" />
                <CardTitle>Participación</CardTitle>
              </div>
              <StatRows
                rows={[
                  {
                    label: "Días activos promedio (últimos 30)",
                    value: formatDecimal(participation.averageActiveDaysLast30),
                  },
                  { label: "Con racha activa", value: participation.participantsWithStreak },
                  {
                    label: "Racha más larga",
                    value: (
                      <>
                        <Icon name="flame" className="text-streak-orange size-4" />
                        {participation.longestCurrentStreak} días
                      </>
                    ),
                  },
                  {
                    label: "Sin iniciar",
                    value: participation.totalParticipants - participation.participantsStarted,
                  },
                ]}
              />
            </Card>
            <Card delay={420} className="flex flex-col gap-3.5">
              <div className="flex items-center gap-2.5">
                <SectionIcon name="trend" className="bg-course-teal-light text-avatar-teal-dark" />
                <CardTitle>Progreso</CardTitle>
              </div>
              <StatRows
                rows={[
                  { label: "Módulos completados", value: progress.modulesCompleted },
                  { label: "Lecciones pendientes", value: NUMBER.format(progress.pendingLessons) },
                  {
                    label: "Tiempo total de aprendizaje",
                    value: formatMinutes(progress.totalLearningMinutes),
                  },
                  {
                    label: "Tiempo promedio por persona",
                    value: formatMinutes(progress.averageLearningMinutes),
                  },
                ]}
              />
            </Card>
            <Card delay={480} className="flex flex-col gap-3.5">
              <div className="flex items-center gap-2.5">
                <SectionIcon name="hand" className="bg-shop-amber-light text-shop-amber-dark" />
                <CardTitle>Desempeño</CardTitle>
              </div>
              <StatRows
                rows={[
                  {
                    label: "Ejercicios realizados",
                    value: NUMBER.format(performance.exerciseAttempts),
                  },
                  { label: "Respuestas correctas", value: `${performance.correctPercentage}%` },
                  {
                    label: "Intentos de reconocimiento de señas",
                    value: NUMBER.format(performance.signRecognitionAttempts),
                  },
                  {
                    label: "Señas reconocidas correctamente",
                    value: `${performance.signRecognitionCorrectPercentage}%`,
                  },
                ]}
              />
            </Card>
          </div>

          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] gap-4">
            <Card delay={540} className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
                <CardTitle>Desempeño por módulo</CardTitle>
                <Link
                  href="/dashboard/modules"
                  className="text-primary-dark text-sm font-bold hover:underline"
                >
                  Ver contenidos
                </Link>
              </div>
              {modules.isPending ? <LoadingState /> : null}
              {modules.error ? <ErrorState>No pudimos cargar los módulos.</ErrorState> : null}
              {modules.data && moduleList.length === 0 ? (
                <p className="text-text-muted text-sm">Todavía no hay módulos para mostrar.</p>
              ) : null}
              <ul className="flex flex-col">
                {moduleList.map((m, index) => (
                  <li
                    key={m.topicId}
                    className="border-fill grid grid-cols-[28px_minmax(0,1fr)_120px_44px] items-center gap-3 border-b py-2.5 last:border-b-0"
                  >
                    <span className="bg-primary text-on-primary font-display flex size-7 items-center justify-center rounded-full text-[13px] font-extrabold">
                      {index + 1}
                    </span>
                    <span className="truncate text-sm font-bold">{m.title}</span>
                    <ProgressBar
                      percent={m.correctPercentage}
                      tone={m.correctPercentage >= 85 ? "success" : "primary"}
                      label={`Respuestas correctas en ${m.title}`}
                    />
                    <span className="text-right text-sm font-extrabold">
                      {m.correctPercentage}%
                    </span>
                  </li>
                ))}
              </ul>
              <p className="text-text-muted text-[13px]">
                Porcentaje de respuestas correctas en los ejercicios de cada módulo.
              </p>
            </Card>

            <Card delay={600} className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle>Necesitan un empujón</CardTitle>
                  <p className="text-text-muted mt-0.5 text-[13px]">
                    Sin actividad hace más de {ACTIVE_WINDOW_DAYS} días
                  </p>
                </div>
                <Link
                  href="/dashboard/members"
                  className="text-primary-dark text-sm font-bold hover:underline"
                >
                  Ver todos
                </Link>
              </div>
              {members.isPending ? <LoadingState /> : null}
              {members.error ? (
                <ErrorState>No pudimos cargar a los participantes.</ErrorState>
              ) : null}
              {members.data && nudges.length === 0 ? (
                <p className="text-text-muted text-sm">
                  Nadie está inactivo por ahora. ¡Buen ritmo!
                </p>
              ) : null}
              <ul className="flex flex-col">
                {nudges.map(({ member, days }) => (
                  <li key={member.userId} className="border-fill border-b last:border-b-0">
                    <Link
                      href={`/dashboard/members/${member.userId}`}
                      className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_92px] items-center gap-3 py-2.5"
                    >
                      <span className="flex min-w-0 items-center gap-2.5 text-[15px] font-bold">
                        <Avatar
                          seed={member.userId}
                          name={member.name}
                          lastName={member.lastName}
                        />
                        <span className="truncate">
                          {member.name} {member.lastName.charAt(0)}.
                        </span>
                      </span>
                      <span className="flex items-center gap-2">
                        <ProgressBar
                          percent={member.progressPercentage}
                          className="flex-1"
                          label={`Avance de ${member.name}`}
                        />
                        <span className="w-[38px] text-sm font-extrabold">
                          {member.progressPercentage}%
                        </span>
                      </span>
                      <span className="text-shop-amber-dark text-right text-sm font-bold">
                        {formatRelativeDays(days)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
      )}
    </section>
  );
}
