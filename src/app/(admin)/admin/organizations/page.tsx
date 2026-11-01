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

const TABS: { label: string; value: OrganizationStatus | "ALL" }[] = [
  { label: "Pendientes", value: "PENDING" },
  { label: "Activas", value: "ACTIVE" },
  { label: "Rechazadas", value: "REJECTED" },
  { label: "Todas", value: "ALL" },
];

function StatusBadge({ status }: { status: OrganizationStatus }) {
  return (
    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", STATUS_COLORS[status])}>
      {STATUS_LABELS[status]}
    </span>
  );
}

function OrgDetailPanel({ org, onClose }: { org: AdminOrganization; onClose: () => void }) {
  const qc = useQueryClient();

  const mutate = useMutation({
    mutationFn: (status: OrganizationStatus) => adminApi.updateOrganizationStatus(org.id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "organizations"] });
      onClose();
    },
  });

  return (
    <div className="border-border bg-surface flex w-96 shrink-0 flex-col overflow-y-auto rounded-2xl border">
      <div className="flex items-start justify-between border-b border-inherit px-5 py-4">
        <div>
          <h2 className="text-text font-display text-lg font-bold">{org.name}</h2>
          <StatusBadge status={org.status} />
        </div>
        <button onClick={onClose} className="text-text-muted hover:text-text p-1 text-lg">
          ✕
        </button>
      </div>

      <div className="flex-1 space-y-4 px-5 py-4">
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-text-muted text-xs">CUIT</dt>
            <dd className="text-text mt-0.5 font-medium">{org.cuit ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-text-muted text-xs">Participantes</dt>
            <dd className="text-text mt-0.5 font-medium">{org.activeMembers}</dd>
          </div>
          <div>
            <dt className="text-text-muted text-xs">Email de contacto</dt>
            <dd className="text-text mt-0.5 font-medium break-all">{org.contactEmail}</dd>
          </div>
          <div>
            <dt className="text-text-muted text-xs">Teléfono</dt>
            <dd className="text-text mt-0.5 font-medium">{org.contactPhone ?? "—"}</dd>
          </div>
          {org.adminName && (
            <div className="col-span-2">
              <dt className="text-text-muted text-xs">Administrador de la org</dt>
              <dd className="text-text mt-0.5 font-medium">
                {org.adminName}
                {org.adminEmail && (
                  <span className="text-text-muted ml-1 text-xs">({org.adminEmail})</span>
                )}
              </dd>
            </div>
          )}
        </dl>

        {org.status === "PENDING" && (
          <p className="text-text-muted text-sm">
            Validá que quien registró la organización la represente y esté autorizado a gestionarla.
            Una vez validada puede comprar cupos.
          </p>
        )}

        {mutate.error && (
          <p className="text-danger text-sm">
            {mutate.error instanceof Error ? mutate.error.message : "Error al actualizar."}
          </p>
        )}
      </div>

      <div className="border-border flex flex-wrap gap-2 border-t px-5 py-4">
        {org.status === "PENDING" && (
          <>
            <button
              onClick={() => mutate.mutate("ACTIVE")}
              disabled={mutate.isPending}
              className="bg-primary flex-1 rounded-xl px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              Validar organización
            </button>
            <button
              onClick={() => mutate.mutate("REJECTED")}
              disabled={mutate.isPending}
              className="border-border text-text-muted hover:bg-fill flex-1 rounded-xl border px-4 py-2 text-sm font-semibold disabled:opacity-50"
            >
              Rechazar
            </button>
          </>
        )}
        {org.status === "ACTIVE" && (
          <button
            onClick={() => mutate.mutate("SUSPENDED")}
            disabled={mutate.isPending}
            className="border-danger text-danger hover:bg-danger/5 rounded-xl border px-4 py-2 text-sm font-semibold disabled:opacity-50"
          >
            Suspender
          </button>
        )}
      </div>
    </div>
  );
}

export default function OrganizationsPage() {
  const [tab, setTab] = useState<OrganizationStatus | "ALL">("PENDING");
  const [selected, setSelected] = useState<AdminOrganization | null>(null);
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "organizations", tab, page],
    queryFn: () =>
      adminApi.organizations({
        status: tab === "ALL" ? undefined : [tab],
        page,
        size: 20,
      }),
  });

  return (
    <div className="flex h-full gap-6">
      <div className="min-w-0 flex-1">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-display text-text text-2xl font-bold">Organizaciones</h1>
            <p className="text-text-muted mt-0.5 text-sm">
              Validá las organizaciones que se registran desde la web y seguí a cada empresa.
            </p>
          </div>
        </div>

        <div className="border-border mb-6 flex gap-1 border-b">
          {TABS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => {
                setTab(value);
                setPage(0);
                setSelected(null);
              }}
              className={cn(
                "px-4 py-2 text-sm font-semibold transition-colors",
                tab === value
                  ? "border-primary text-primary border-b-2"
                  : "text-text-muted hover:text-text",
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
                    <th className="px-5 py-3 text-left font-semibold">Estado</th>
                    <th className="px-5 py-3 text-left font-semibold">Participantes</th>
                    <th className="px-5 py-3 text-left font-semibold">Alta</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.content.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-text-muted px-5 py-10 text-center">
                        No hay organizaciones con este filtro.
                      </td>
                    </tr>
                  )}
                  {data?.content.map((org) => (
                    <tr
                      key={org.id}
                      className={cn(
                        "border-border hover:bg-fill/50 cursor-pointer border-b last:border-0",
                        selected?.id === org.id && "bg-primary/5",
                      )}
                      onClick={() => setSelected(selected?.id === org.id ? null : org)}
                    >
                      <td className="px-5 py-4">
                        <p className="text-text font-semibold">{org.name}</p>
                        <p className="text-text-muted mt-0.5 text-xs">{org.contactEmail}</p>
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={org.status} />
                      </td>
                      <td className="text-text-muted px-5 py-4">{org.activeMembers}</td>
                      <td className="text-text-muted px-5 py-4 text-xs">
                        {new Date(org.createdAt).toLocaleDateString("es-AR")}
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
      </div>

      {selected && <OrgDetailPanel org={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
