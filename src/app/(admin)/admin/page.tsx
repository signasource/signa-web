"use client";

import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/api/admin";

function StatCard({
  label,
  value,
  color = "primary",
}: {
  label: string;
  value: number | undefined;
  color?: "primary" | "warning" | "danger" | "success";
}) {
  const colorMap = {
    primary: "bg-primary/10 text-primary",
    warning: "bg-warning/10 text-warning",
    danger: "bg-danger/10 text-danger",
    success: "bg-success/10 text-success",
  };
  return (
    <div className="border-border bg-surface rounded-2xl border p-6">
      <p className="text-text-muted text-sm">{label}</p>
      <p className={`font-display mt-2 text-3xl font-bold ${colorMap[color]}`}>
        {value !== undefined ? value.toLocaleString("es-AR") : "—"}
      </p>
    </div>
  );
}

export default function AdminResumenPage() {
  const {
    data: stats,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: adminApi.stats,
  });

  if (isLoading) {
    return (
      <div>
        <h1 className="font-display text-text mb-6 text-2xl font-bold">Resumen</h1>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-fill h-32 animate-pulse rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1 className="font-display text-text mb-6 text-2xl font-bold">Resumen</h1>
        <p className="text-danger text-sm">Error al cargar las métricas.</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-text mb-2 text-2xl font-bold">Resumen</h1>
      <p className="text-text-muted mb-8 text-sm">Estado general de la plataforma.</p>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard
          label="Organizaciones activas"
          value={stats?.activeOrganizations}
          color="success"
        />
        <StatCard
          label="Solicitudes pendientes"
          value={stats?.pendingOrganizations}
          color="warning"
        />
        <StatCard label="Reportes abiertos" value={stats?.openSignReports} color="danger" />
        <StatCard label="Usuarios totales" value={stats?.totalUsers} color="primary" />
        <StatCard
          label="Usuarios activos (7 días)"
          value={stats?.activeUsersLast7Days}
          color="primary"
        />
        <StatCard label="Lista de espera" value={stats?.waitlistCount} color="primary" />
      </div>
    </div>
  );
}
