"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { SortTh } from "@/components/admin/sort-th";
import { matchesOrganization } from "@/lib/admin-organizations";
import { adminApi, type AdminOrganization, type OrganizationStatus } from "@/lib/api/admin";
import { nextSort, sortRows, type SortDir, type SortValue } from "@/lib/table-sort";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;

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
  { label: "Suspendidas", value: "SUSPENDED" },
  { label: "Todas", value: "ALL" },
];

type OrgSort = "name" | "status" | "activeMembers" | "createdAt";

/** What each sortable column orders by, and the direction of its first click. */
const ORG_SORT: Record<OrgSort, { key: (o: AdminOrganization) => SortValue; first: SortDir }> = {
  name: { key: (o) => o.name, first: "asc" },
  status: { key: (o) => STATUS_LABELS[o.status], first: "asc" },
  activeMembers: { key: (o) => o.activeMembers, first: "desc" },
  createdAt: { key: (o) => o.createdAt, first: "desc" },
};

function StatusBadge({ status }: { status: OrganizationStatus }) {
  return (
    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", STATUS_COLORS[status])}>
      {STATUS_LABELS[status]}
    </span>
  );
}

function OrgDetailPanel({ org, onClose }: { org: AdminOrganization; onClose: () => void }) {
  const qc = useQueryClient();

  const [suspending, setSuspending] = useState(false);
  const [reason, setReason] = useState("");
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const done = () => {
    qc.invalidateQueries({ queryKey: ["admin", "organizations"] });
    qc.invalidateQueries({ queryKey: ["admin", "stats"] });
    onClose();
  };

  const mutate = useMutation({
    mutationFn: ({ status, reason }: { status: OrganizationStatus; reason?: string }) =>
      adminApi.updateOrganizationStatus(org.id, status, reason),
    onSuccess: done,
  });

  const remove = useMutation({
    mutationFn: () => adminApi.deleteOrganization(org.id),
    onSuccess: done,
  });

  const busy = mutate.isPending || remove.isPending;
  const error = mutate.error ?? remove.error;
  const canDelete = org.status === "REJECTED" || org.status === "SUSPENDED";

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

        {org.status === "SUSPENDED" && (
          <div className="bg-fill-dark rounded-xl px-4 py-3 text-sm">
            <p className="text-text-muted text-xs font-semibold">Motivo de la suspensión</p>
            <p className="text-text mt-0.5">{org.suspensionReason ?? "Sin motivo registrado."}</p>
          </div>
        )}

        {suspending && (
          <div>
            <label htmlFor="suspension-reason" className="text-text text-sm font-semibold">
              Motivo de la suspensión
            </label>
            <textarea
              id="suspension-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Contá por qué suspendés a la organización"
              className="border-border bg-surface text-text mt-1 w-full rounded-xl border px-3 py-2 text-sm"
            />
          </div>
        )}

        {confirmingDelete && (
          <p className="text-danger text-sm">
            Se elimina la organización de forma definitiva y se liberan sus mails para volver a
            registrarse. No se puede deshacer.
          </p>
        )}

        {error && (
          <p className="text-danger text-sm">
            {error instanceof Error ? error.message : "Error al actualizar."}
          </p>
        )}
      </div>

      <div className="border-border flex flex-wrap gap-2 border-t px-5 py-4">
        {org.status === "PENDING" && (
          <>
            <button
              onClick={() => mutate.mutate({ status: "ACTIVE" })}
              disabled={busy}
              className="bg-primary flex-1 rounded-xl px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              Validar organización
            </button>
            <button
              onClick={() => mutate.mutate({ status: "REJECTED" })}
              disabled={busy}
              className="border-border text-text-muted hover:bg-fill flex-1 rounded-xl border px-4 py-2 text-sm font-semibold disabled:opacity-50"
            >
              Rechazar
            </button>
          </>
        )}
        {org.status === "ACTIVE" &&
          (suspending ? (
            <>
              <button
                onClick={() => mutate.mutate({ status: "SUSPENDED", reason: reason.trim() })}
                disabled={busy || reason.trim().length === 0}
                className="bg-danger flex-1 rounded-xl px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
              >
                Confirmar suspensión
              </button>
              <button
                onClick={() => setSuspending(false)}
                disabled={busy}
                className="border-border text-text-muted hover:bg-fill rounded-xl border px-4 py-2 text-sm font-semibold disabled:opacity-50"
              >
                Cancelar
              </button>
            </>
          ) : (
            <button
              onClick={() => setSuspending(true)}
              className="border-danger text-danger hover:bg-danger/5 rounded-xl border px-4 py-2 text-sm font-semibold"
            >
              Suspender
            </button>
          ))}
        {org.status === "SUSPENDED" && (
          <button
            onClick={() => mutate.mutate({ status: "ACTIVE" })}
            disabled={busy}
            className="bg-primary flex-1 rounded-xl px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            Reactivar organización
          </button>
        )}
        {canDelete &&
          (confirmingDelete ? (
            <>
              <button
                onClick={() => remove.mutate()}
                disabled={busy}
                className="bg-danger flex-1 rounded-xl px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
              >
                Sí, dar de baja
              </button>
              <button
                onClick={() => setConfirmingDelete(false)}
                disabled={busy}
                className="border-border text-text-muted hover:bg-fill rounded-xl border px-4 py-2 text-sm font-semibold disabled:opacity-50"
              >
                Cancelar
              </button>
            </>
          ) : (
            <button
              onClick={() => setConfirmingDelete(true)}
              disabled={busy}
              className="border-danger text-danger hover:bg-danger/5 rounded-xl border px-4 py-2 text-sm font-semibold disabled:opacity-50"
            >
              Dar de baja
            </button>
          ))}
      </div>
    </div>
  );
}

export default function OrganizationsPage() {
  const [tab, setTab] = useState<OrganizationStatus | "ALL">("PENDING");
  const [selected, setSelected] = useState<AdminOrganization | null>(null);
  const [page, setPage] = useState(0);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ by: OrgSort; dir: SortDir }>({
    by: "createdAt",
    dir: "desc",
  });

  // Organizations are few: the tab's whole list comes at once and is searched, sorted and paged
  // here, so sorting covers every organization and not just the page on screen.
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "organizations", tab],
    queryFn: () =>
      adminApi.organizations({
        // "Todas" excludes suspended (dadas de baja); they live in their own tab.
        status: tab === "ALL" ? ["PENDING", "ACTIVE", "REJECTED"] : [tab],
        page: 0,
        size: 1000,
      }),
  });

  const { data: pendingPage } = useQuery({
    queryKey: ["admin", "organizations", "count", "PENDING"],
    queryFn: () => adminApi.organizations({ status: ["PENDING"], page: 0, size: 1 }),
    staleTime: 60_000,
  });
  const { data: activePage } = useQuery({
    queryKey: ["admin", "organizations", "count", "ACTIVE"],
    queryFn: () => adminApi.organizations({ status: ["ACTIVE"], page: 0, size: 1 }),
    staleTime: 60_000,
  });
  const { data: rejectedPage } = useQuery({
    queryKey: ["admin", "organizations", "count", "REJECTED"],
    queryFn: () => adminApi.organizations({ status: ["REJECTED"], page: 0, size: 1 }),
    staleTime: 60_000,
  });
  const { data: suspendedPage } = useQuery({
    queryKey: ["admin", "organizations", "count", "SUSPENDED"],
    queryFn: () => adminApi.organizations({ status: ["SUSPENDED"], page: 0, size: 1 }),
    staleTime: 60_000,
  });

  const tabCounts: Record<OrganizationStatus | "ALL", number | undefined> = {
    PENDING: pendingPage?.totalElements,
    ACTIVE: activePage?.totalElements,
    REJECTED: rejectedPage?.totalElements,
    SUSPENDED: suspendedPage?.totalElements,
    ALL:
      pendingPage && activePage && rejectedPage
        ? pendingPage.totalElements + activePage.totalElements + rejectedPage.totalElements
        : undefined,
  };

  const matching = sortRows(
    (data?.content ?? []).filter((o) => matchesOrganization(o, query)),
    ORG_SORT[sort.by].key,
    sort.dir,
  );
  const totalPages = Math.ceil(matching.length / PAGE_SIZE);
  const rows = matching.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const onSort = (field: OrgSort) => {
    setSort((s) => nextSort(s, field, ORG_SORT[field].first));
    setPage(0);
  };

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

        <div className="bg-fill mb-6 flex w-fit flex-wrap gap-1 rounded-xl p-1" role="tablist">
          {TABS.map(({ label, value }) => (
            <button
              key={value}
              role="tab"
              aria-selected={tab === value}
              onClick={() => {
                setTab(value);
                setPage(0);
                setSelected(null);
              }}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors",
                tab === value ? "text-text bg-white shadow-sm" : "text-text-muted hover:text-text",
              )}
            >
              {label}
              {tabCounts[value] !== undefined && (
                <span className="text-text-muted text-xs font-bold">{tabCounts[value]}</span>
              )}
            </button>
          ))}
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
            placeholder="Buscar por nombre, email o CUIT"
            aria-label="Buscar organizaciones"
            className="border-border bg-surface focus:border-primary min-w-52 flex-1 rounded-full border px-4 py-2 text-[13px] font-bold outline-none"
          />
          {data ? (
            <span className="text-text-muted text-sm font-semibold">
              {matching.length} {matching.length === 1 ? "organización" : "organizaciones"}
            </span>
          ) : null}
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
                    <SortTh label="Organización" field="name" sort={sort} onSort={onSort} />
                    <SortTh label="Estado" field="status" sort={sort} onSort={onSort} />
                    <SortTh
                      label="Participantes"
                      field="activeMembers"
                      sort={sort}
                      onSort={onSort}
                    />
                    <SortTh label="Alta" field="createdAt" sort={sort} onSort={onSort} />
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-text-muted px-5 py-10 text-center">
                        No hay organizaciones con este filtro.
                      </td>
                    </tr>
                  )}
                  {rows.map((org) => (
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

            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <button
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                  className="border-border text-text-muted hover:bg-fill rounded-xl border px-4 py-2 text-sm font-medium disabled:opacity-40"
                >
                  Anterior
                </button>
                <span className="text-text-muted text-sm">
                  Página {page + 1} de {totalPages}
                </span>
                <button
                  disabled={page >= totalPages - 1}
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
