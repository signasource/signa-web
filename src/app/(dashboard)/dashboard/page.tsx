"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { CourseSelect } from "@/components/dashboard/course-select";
import { ActiveParticipantsCard } from "@/components/dashboard/home/active-participants-card";
import { FollowUpCard } from "@/components/dashboard/home/follow-up-card";
import {
  PendingInvitationsCard,
  invitationSummaryKey,
} from "@/components/dashboard/home/pending-invitations";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeading,
  ProgressBar,
  StatCard,
  primaryButton,
} from "@/components/dashboard/ui";
import { useAuth } from "@/features/auth/auth-context";
import { useCourseFilter, useWithFilters } from "@/features/dashboard/use-course-filter";
import { organizationsApi } from "@/lib/api/organizations";
import type { InvitationSummary } from "@/lib/api/types";

export default function DashboardOverviewPage() {
  const { organization } = useAuth();
  const orgId = organization?.id;
  const { courseId } = useCourseFilter();
  const withFilters = useWithFilters();
  const memberHref = (userId: string) => withFilters(`/dashboard/members/${userId}`);

  const homeKey = ["organization", orgId, "home", courseId ?? null] as const;
  const home = useQuery({
    queryKey: homeKey,
    queryFn: () => organizationsApi.home(orgId!, courseId),
    enabled: Boolean(orgId),
    placeholderData: keepPreviousData,
  });
  // Shared with the pending invitations card (same key): decides the empty state.
  const invitations = useQuery<InvitationSummary>({
    queryKey: invitationSummaryKey(orgId, courseId),
    queryFn: () => organizationsApi.invitationSummary(orgId!, courseId),
    enabled: Boolean(orgId),
  });

  if (home.isPending) return <LoadingState>Cargando métricas…</LoadingState>;
  if (home.error) return <ErrorState>No pudimos cargar las métricas.</ErrorState>;

  const data = home.data;
  const nobodyYet = data.participants === 0 && invitations.data?.sent === 0 && !courseId;

  return (
    <section className="flex flex-col gap-6">
      <PageHeading title="Resumen">
        <CourseSelect />
      </PageHeading>

      {nobodyYet ? (
        <EmptyState
          mascot
          title="Todavía no hay participantes"
          body="Comprá cupos para tu equipo: cada persona recibe una invitación por email. Las métricas aparecen acá apenas alguien la acepte."
          action={
            <Link href="/dashboard/purchases" className={primaryButton}>
              Comprar cupos
            </Link>
          }
        />
      ) : (
        <div className="dash-page-enter flex flex-col gap-4">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] gap-4">
            <PendingInvitationsCard orgId={orgId} courseId={courseId} delay={0} />
            <StatCard
              delay={60}
              label="Progreso promedio"
              value={`${data.averageProgressPercentage}%`}
              hint={
                data.startedParticipants === 0
                  ? "Nadie inició la capacitación todavía"
                  : `Entre ${data.startedParticipants} ${data.startedParticipants === 1 ? "participante que inició" : "participantes que iniciaron"}`
              }
            >
              <ProgressBar
                percent={data.averageProgressPercentage}
                tone="primary"
                label="Progreso promedio"
                className="mt-3"
              />
              <p className="text-text-muted mt-2.5 text-[13px]">
                Capacitaciones completadas:{" "}
                <span className="text-text font-extrabold">
                  {data.completedParticipants} ({data.completedPercentage}%)
                </span>
              </p>
            </StatCard>
          </div>

          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] items-start gap-4">
            <FollowUpCard
              orgId={orgId}
              participants={data.followUp}
              homeKey={homeKey}
              memberHref={memberHref}
              delay={120}
            />
            <ActiveParticipantsCard
              participants={data.activeParticipants}
              windowDays={data.activeWindowDays}
              memberHref={memberHref}
              delay={180}
            />
          </div>
        </div>
      )}
    </section>
  );
}
