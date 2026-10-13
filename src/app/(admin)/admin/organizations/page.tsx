"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { adminApi, type AdminOrganization, type OrganizationStatus } from "@/lib/api/admin";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<OrganizationStatus, string> = {
  PENDING: "Pendiente",
  ACTIVE: "Activa",
  REJECTED: "Rechazada",
  SUSPENDED: "Suspendida",
};

const STATUS_COLORS: Record<OrganizationStatus, string> = {
  PENDING: "bg-warning/10 text-warning",
  ACTIVE: "bg-success/10 text-success-dark",
  REJECTED: "bg-danger/10 text-danger",
  SUSPENDED: "bg-fill-dark text-text-muted",
};

const FILTERS: { label: string; value: OrganizationStatus | "ALL" }[] = [
  { label: "Todas", value: "ALL" },
  { label: "Pendientes", value: "PENDING" },
  { label: "Activas", value: "ACTIVE" },
  { label: "Rechazadas", value: "REJECTED" },
  { label: "Suspendidas", value: "SUSPENDED" },
];

function StatusBadge({ status }: { status: OrganizationStatus }) {
  return (
    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", STATUS_COLORS[status])}>
      {STATUS_LABELS[status]}
    </span>
  );
}

function OrgDetailModal({ org, onClose }: { org: AdminOrganization; onClose: () => void }) {
  const qc = useQueryClient();

  const mutate = useMutation({
    mutationFn: (params: { status: OrganizationStatus }) =>
      adminApi.updateOrganizationStatus(org.id, params.status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "organizations"] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-surface w-full max-w-lg rounded-2xl p-6 shadow-2xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="font-display text-text text-xl font-bold">{org.name}</h2>
            <StatusBadge status={org.status} />
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text p-1">
            ✕
          </button>
        </div>

        <dl className="mb-6 grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-text-muted">CUIT</dt>
            <dd className="font-medium">{org.cuit ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-text-muted">Email de contacto</dt>
            <dd className="font-medium">{org.contactEmail}</dd>
          </div>
          <div>
            <dt className="text-text-muted">Teléfono</dt>
            <dd className="font-medium">{org.contactPhone ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-text-muted">Límite de miembros</dt>
            <dd className="font-medium">{org.memberLimit}</dd>
          </div>
          <div>
            <dt className="text-text-muted">Miembros activos</dt>
            <dd className="font-medium">{org.activeMembers}</dd>
          </div>
          <div>
            <dt className="text-text-muted">Admin de org</dt>
            <dd className="font-medium">{org.adminName ?? "Sin asignar"}</dd>
          </div>
        </dl>

        {mutate.error && (
          <p className="text-danger mb-4 text-sm">
            {mutate.error instanceof Error ? mutate.error.message : "Error al actualizar."}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          {org.status === "PENDING" && (
            <>
              <button
                onClick={() => mutate.mutate({ status: "ACTIVE" })}
                disabled={mutate.isPending}
                className="bg-success rounded-xl px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
              >
                Aprobar
              </button>
              <button
                onClick={() => mutate.mutate({ status: "REJECTED" })}
                disabled={mutate.isPending}
                className="bg-danger rounded-xl px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
              >
                Rechazar
              </button>
            </>
          )}
          {org.status === "ACTIVE" && (
            <button
              onClick={() => mutate.mutate({ status: "SUSPENDED" })}
              disabled={mutate.isPending}
              className="border-danger text-danger hover:bg-danger/5 rounded-xl border px-4 py-2 text-sm font-semibold disabled:opacity-50"
            >
              Suspender
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function OrganizationsPage() {
  const [filter, setFilter] = useState<OrganizationStatus | "ALL">("ALL");
  const [selected, setSelected] = useState<AdminOrganization | null>(null);
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "organizations", filter, page],
    queryFn: () =>
      adminApi.organizations({
        status: filter === "ALL" ? undefined : [filter],
        page,
        size: 20,
      }),
  });

  return (
    <div>
      <h1 className="font-display text-text mb-2 text-2xl font-bold">Organizaciones</h1>
      <p className="text-text-muted mb-6 text-sm">
        Gestioná las solicitudes y organizaciones activas.
      </p>

      <div className="mb-6 flex flex-wrap gap-2">
        {FILTERS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => {
              setFilter(value);
              setPage(0);
            }}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
              filter === value
                ? "bg-primary text-white"
                : "bg-fill text-text-muted hover:bg-fill-dark hover:text-text",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-fill h-16 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : (
        <>
          <div className="border-border bg-surface overflow-hidden rounded-2xl border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-border bg-fill text-text-muted border-b">
                  <th className="px-5 py-3 text-left font-semibold">Organización</th>
                  <th className="px-5 py-3 text-left font-semibold">Admin</th>
                  <th className="px-5 py-3 text-left font-semibold">Miembros</th>
                  <th className="px-5 py-3 text-left font-semibold">Estado</th>
                  <th className="px-5 py-3 text-left font-semibold">Ingreso</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {data?.content.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-text-muted px-5 py-8 text-center">
                      No hay organizaciones con este filtro.
                    </td>
                  </tr>
                )}
                {data?.content.map((org) => (
                  <tr
                    key={org.id}
                    className="border-border hover:bg-fill/50 cursor-pointer border-b last:border-0"
                    onClick={() => setSelected(org)}
                  >
                    <td className="px-5 py-4">
                      <p className="text-text font-semibold">{org.name}</p>
                      <p className="text-text-muted mt-0.5 text-xs">{org.contactEmail}</p>
                    </td>
                    <td className="text-text-muted px-5 py-4">
                      {org.adminName ?? <span className="italic">Sin asignar</span>}
                    </td>
                    <td className="text-text px-5 py-4">
                      {org.activeMembers} / {org.memberLimit}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={org.status} />
                    </td>
                    <td className="text-text-muted px-5 py-4 text-xs">
                      {new Date(org.createdAt).toLocaleDateString("es-AR")}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="text-primary text-xs font-semibold">Ver</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data && data.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <button
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
                className="border-border text-text-muted hover:bg-fill rounded-xl border px-4 py-2 text-sm font-medium disabled:opacity-40"
              >
                Anterior
              </button>
              <span className="text-text-muted text-sm">
                Página {page + 1} de {data.totalPages}
              </span>
              <button
                disabled={page >= data.totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
                className="border-border text-text-muted hover:bg-fill rounded-xl border px-4 py-2 text-sm font-medium disabled:opacity-40"
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}

      {selected && <OrgDetailModal org={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
