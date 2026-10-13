"use client";

import { useQuery } from "@tanstack/react-query";
import { adminApi, type ReportReason } from "@/lib/api/admin";
import { useAdminAuth } from "@/features/admin/admin-auth-context";

const REASON_LABELS: Record<ReportReason, string> = {
  INCORRECT_SIGN: "Seña incorrecta",
  UNCLEAR_ANIMATION: "Animación poco clara",
  WRONG_MEANING: "Significado erróneo",
  REGIONAL_VARIANT: "Variante regional",
  MISSING_CONTEXT: "Falta contexto",
  TECHNICAL_PROBLEM: "Problema técnico",
  OTHER: "Otros",
};

const VERSION_STATUS_LABELS: Record<string, string> = {
  PUBLISHED: "Publicada",
  DRAFT: "Borrador",
  ARCHIVED: "Archivada",
};

const VERSION_STATUS_COLORS: Record<string, string> = {
  PUBLISHED: "bg-success/10 text-success-dark",
  DRAFT: "bg-warning/10 text-warning",
  ARCHIVED: "bg-fill-dark text-text-muted",
};

function StatCard({
  label,
  value,
  sub,
  color = "default",
}: {
  label: string;
  value: string | number | undefined;
  sub?: string;
  color?: "default" | "warning" | "danger" | "success";
}) {
  const colorMap = {
    default: "text-text",
    warning: "text-warning",
    danger: "text-danger",
    success: "text-success-dark",
  };
  return (
    <div className="border-border bg-surface rounded-2xl border p-5">
      <p className="text-text-muted text-xs font-medium tracking-wide uppercase">{label}</p>
      <p className={`font-display mt-2 text-3xl font-bold ${colorMap[color]}`}>
        {value !== undefined
          ? typeof value === "number"
            ? value.toLocaleString("es-AR")
            : value
          : "—"}
      </p>
      {sub && <p className="text-text-muted mt-1 text-xs">{sub}</p>}
    </div>
  );
}

export default function AdminResumenPage() {
  const { admin } = useAdminAuth();

  const { data: stats } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: adminApi.stats,
    staleTime: 60_000,
  });

  const { data: pendingOrgs } = useQuery({
    queryKey: ["admin", "organizations", "PENDING", 0],
    queryFn: () => adminApi.organizations({ status: ["PENDING"], page: 0, size: 5 }),
  });

  const { data: reports } = useQuery({
    queryKey: ["admin", "sign-reports", "PENDING"],
    queryFn: () => adminApi.signReports("PENDING"),
  });

  const { data: courses } = useQuery({
    queryKey: ["admin", "courses"],
    queryFn: adminApi.courses,
  });

  const reportsByReason = reports?.reduce(
    (acc, group) => {
      for (const r of group.reports) {
        acc[r.reason] = (acc[r.reason] ?? 0) + 1;
      }
      return acc;
    },
    {} as Record<ReportReason, number>,
  );

  const reasonOrder: ReportReason[] = [
    "INCORRECT_SIGN",
    "WRONG_MEANING",
    "REGIONAL_VARIANT",
    "UNCLEAR_ANIMATION",
    "MISSING_CONTEXT",
    "OTHER",
  ];

  const maxReasonCount = reportsByReason ? Math.max(1, ...Object.values(reportsByReason)) : 1;

  const subtitle = (() => {
    const pending = stats?.pendingOrganizations ?? 0;
    const open = stats?.openSignReports ?? 0;
    if (pending > 0 && open > 0)
      return `Tenés ${pending} organización${pending > 1 ? "es" : ""} esperando aprobación y ${open} reporte${open > 1 ? "s" : ""} de señas sin revisar.`;
    if (pending > 0)
      return `Tenés ${pending} organización${pending > 1 ? "es" : ""} esperando aprobación.`;
    if (open > 0) return `Tenés ${open} reporte${open > 1 ? "s" : ""} de señas sin revisar.`;
    return "Todo al día. No hay tareas pendientes.";
  })();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-text text-2xl font-bold">
          Hola, {admin?.name ?? "Admin"}
        </h1>
        <p className="text-text-muted mt-1 text-sm">{subtitle}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Organizaciones activas"
          value={stats?.activeOrganizations}
          color="success"
        />
        <StatCard
          label="Solicitudes pendientes"
          value={stats?.pendingOrganizations}
          color={stats?.pendingOrganizations ? "warning" : "default"}
        />
        <StatCard
          label="Reportes abiertos"
          value={stats?.openSignReports}
          color={stats?.openSignReports ? "danger" : "default"}
        />
        <StatCard
          label="Señas registradas"
          value={stats?.totalSigns}
          sub={stats ? `${stats.totalUsers.toLocaleString("es-AR")} usuarios activos` : undefined}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="border-border bg-surface rounded-2xl border">
          <div className="flex items-center justify-between border-b border-inherit px-5 py-4">
            <h2 className="text-text text-sm font-semibold">Requiere tu atención</h2>
            <a
              href="/admin/organizations"
              className="text-primary text-xs font-semibold hover:underline"
            >
              Ver todas
            </a>
          </div>
          <div className="divide-border divide-y">
            {!pendingOrgs || pendingOrgs.content.length === 0 ? (
              <p className="text-text-muted px-5 py-8 text-center text-sm">
                No hay organizaciones pendientes.
              </p>
            ) : (
              pendingOrgs.content.map((org) => (
                <div key={org.id} className="flex items-center justify-between px-5 py-4">
                  <div className="min-w-0">
                    <p className="text-text truncate text-sm font-semibold">{org.name}</p>
                    <p className="text-text-muted mt-0.5 text-xs">
                      {org.contactEmail}
                      {org.adminName && ` · ${org.adminName}`}
                    </p>
                  </div>
                  <span className="text-text-muted ml-4 shrink-0 text-xs">
                    {new Date(org.createdAt).toLocaleDateString("es-AR")}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="border-border bg-surface rounded-2xl border">
          <div className="flex items-center justify-between border-b border-inherit px-5 py-4">
            <h2 className="text-text text-sm font-semibold">Reportes abiertos por motivo</h2>
            <span className="text-text-muted text-xs">Pendientes</span>
          </div>
          <div className="space-y-3 px-5 py-4">
            {reasonOrder.map((reason) => {
              const count = reportsByReason?.[reason] ?? 0;
              return (
                <div key={reason} className="flex items-center gap-3">
                  <span className="text-text-muted w-36 shrink-0 text-xs">
                    {REASON_LABELS[reason]}
                  </span>
                  <div className="bg-fill flex-1 overflow-hidden rounded-full">
                    <div
                      className="bg-primary/60 h-2 rounded-full transition-all"
                      style={{ width: `${(count / maxReasonCount) * 100}%` }}
                    />
                  </div>
                  <span className="text-text w-4 shrink-0 text-right text-xs font-semibold">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="border-border bg-surface rounded-2xl border">
        <div className="border-b border-inherit px-5 py-4">
          <h2 className="text-text text-sm font-semibold">Estado del contenido</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-border bg-fill text-text-muted border-b">
                <th className="px-5 py-3 text-left font-semibold">Curso</th>
                <th className="px-5 py-3 text-left font-semibold">Versión</th>
                <th className="px-5 py-3 text-left font-semibold">Estado</th>
                <th className="px-5 py-3 text-right font-semibold">Inscriptos</th>
              </tr>
            </thead>
            <tbody>
              {!courses || courses.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-text-muted px-5 py-8 text-center">
                    No hay cursos.
                  </td>
                </tr>
              ) : (
                courses.flatMap((course) =>
                  course.versions.map((v) => (
                    <tr key={v.id} className="border-border border-b last:border-0">
                      <td className="text-text px-5 py-3 font-medium">{course.name}</td>
                      <td className="text-text-muted px-5 py-3">v{v.version}</td>
                      <td className="px-5 py-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${VERSION_STATUS_COLORS[v.status] ?? "bg-fill text-text-muted"}`}
                        >
                          {VERSION_STATUS_LABELS[v.status] ?? v.status}
                        </span>
                      </td>
                      <td className="text-text-muted px-5 py-3 text-right">
                        {course.enrollmentCount.toLocaleString("es-AR")}
                      </td>
                    </tr>
                  )),
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
