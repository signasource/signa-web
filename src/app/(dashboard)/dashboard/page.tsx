"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/auth-context";
import { organizationsApi } from "@/lib/api/organizations";

export default function DashboardOverviewPage() {
  const { organization } = useAuth();
  const orgId = organization?.id;
  const { data, isPending, error } = useQuery({
    queryKey: ["organization", orgId, "overview"],
    queryFn: () => organizationsApi.overview(orgId!),
    enabled: Boolean(orgId),
  });

  if (isPending) return <p className="text-text-muted">Cargando métricas…</p>;
  if (error) return <p className="text-danger">No pudimos cargar las métricas.</p>;

  const { participation, progress } = data;
  const stats = [
    { label: "Participantes", value: participation.totalParticipants },
    { label: "Activos (últimos 7 días)", value: participation.activeParticipants },
    { label: "Progreso promedio", value: `${progress.averageProgressPercentage}%` },
    { label: "Lecciones completadas", value: progress.completedLessons },
  ];

  return (
    <section className="flex flex-col gap-6">
      <h1 className="font-display text-3xl font-bold">Resumen</h1>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="border-border bg-surface rounded-2xl border p-4">
            <p className="text-text-muted text-sm">{stat.label}</p>
            <p className="font-display text-3xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
