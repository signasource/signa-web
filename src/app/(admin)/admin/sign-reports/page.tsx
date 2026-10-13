"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { adminApi, type AdminSignReportGroup, type ReportStatus } from "@/lib/api/admin";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<ReportStatus, string> = {
  PENDING: "Pendiente",
  REVIEWED: "En revisión",
  RESOLVED: "Resuelto",
  REJECTED: "Rechazado",
};

const STATUS_COLORS: Record<ReportStatus, string> = {
  PENDING: "bg-warning/10 text-warning",
  REVIEWED: "bg-primary/10 text-primary",
  RESOLVED: "bg-success/10 text-success-dark",
  REJECTED: "bg-fill text-text-muted",
};

const REASON_LABELS: Record<string, string> = {
  INCORRECT_SIGN: "Seña incorrecta",
  UNCLEAR_ANIMATION: "Animación confusa",
  WRONG_MEANING: "Significado erróneo",
  MISSING_CONTEXT: "Falta contexto",
  REGIONAL_VARIANT: "Variante regional",
  TECHNICAL_PROBLEM: "Problema técnico",
  OTHER: "Otro",
};

const FILTERS: { label: string; value: ReportStatus | "ALL" }[] = [
  { label: "Todos", value: "ALL" },
  { label: "Pendientes", value: "PENDING" },
  { label: "En revisión", value: "REVIEWED" },
  { label: "Resueltos", value: "RESOLVED" },
  { label: "Rechazados", value: "REJECTED" },
];

function ReportGroupModal({
  group,
  onClose,
}: {
  group: AdminSignReportGroup;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [adminNote, setAdminNote] = useState("");

  const mutate = useMutation({
    mutationFn: (status: ReportStatus) =>
      adminApi.updateSignReportGroup(group.signId, status, adminNote || undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "sign-reports"] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-surface max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl p-6 shadow-2xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="font-display text-text text-xl font-bold">{group.signMeaning}</h2>
            <p className="text-text-muted mt-0.5 text-sm">
              {group.reportCount} {group.reportCount === 1 ? "reporte" : "reportes"} · Razón
              principal: {REASON_LABELS[group.topReason] ?? group.topReason}
            </p>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text p-1">
            ✕
          </button>
        </div>

        <div className="mb-6 space-y-3">
          {group.reports.map((r) => (
            <div key={r.id} className="border-border bg-fill rounded-xl border p-4 text-sm">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-text font-semibold">@{r.username}</span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-semibold",
                    STATUS_COLORS[r.status],
                  )}
                >
                  {STATUS_LABELS[r.status]}
                </span>
              </div>
              <p className="text-text-muted">
                {REASON_LABELS[r.reason] ?? r.reason}
                {r.description && ` — "${r.description}"`}
              </p>
              <p className="text-text-muted mt-1 text-xs">
                {new Date(r.createdAt).toLocaleDateString("es-AR")}
              </p>
            </div>
          ))}
        </div>

        <label className="text-text mb-4 flex flex-col gap-1.5 text-sm font-medium">
          Nota interna (opcional)
          <textarea
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value)}
            rows={2}
            placeholder="Explicación de la decisión…"
            className="border-border bg-fill focus:border-primary resize-none rounded-xl border px-3 py-2 text-sm outline-none"
          />
        </label>

        {mutate.error && (
          <p className="text-danger mb-4 text-sm">
            {mutate.error instanceof Error ? mutate.error.message : "Error al actualizar."}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          {(group.status === "PENDING" || group.status === "REVIEWED") && (
            <>
              <button
                onClick={() => mutate.mutate("RESOLVED")}
                disabled={mutate.isPending}
                className="bg-success rounded-xl px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
              >
                Resolver
              </button>
              <button
                onClick={() => mutate.mutate("REJECTED")}
                disabled={mutate.isPending}
                className="border-danger text-danger hover:bg-danger/5 rounded-xl border px-4 py-2 text-sm font-semibold disabled:opacity-50"
              >
                Rechazar
              </button>
              {group.status === "PENDING" && (
                <button
                  onClick={() => mutate.mutate("REVIEWED")}
                  disabled={mutate.isPending}
                  className="border-primary text-primary hover:bg-primary/5 rounded-xl border px-4 py-2 text-sm font-semibold disabled:opacity-50"
                >
                  Marcar en revisión
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SignReportsPage() {
  const [filter, setFilter] = useState<ReportStatus | "ALL">("ALL");
  const [selected, setSelected] = useState<AdminSignReportGroup | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "sign-reports", filter],
    queryFn: () => adminApi.signReports(filter === "ALL" ? undefined : filter),
  });

  return (
    <div>
      <h1 className="font-display text-text mb-2 text-2xl font-bold">Reportes de señas</h1>
      <p className="text-text-muted mb-6 text-sm">Moderá los reportes enviados por usuarios.</p>

      <div className="mb-6 flex flex-wrap gap-2">
        {FILTERS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
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
            <div key={i} className="bg-fill h-20 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {data?.length === 0 && (
            <p className="border-border bg-surface text-text-muted rounded-2xl border px-6 py-10 text-center text-sm">
              No hay reportes con este filtro.
            </p>
          )}
          {data?.map((group) => (
            <button
              key={group.signId}
              onClick={() => setSelected(group)}
              className="border-border bg-surface hover:border-primary/30 w-full rounded-2xl border p-5 text-left transition-all hover:shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-text font-semibold">{group.signMeaning}</span>
                  <span className="text-text-muted ml-2 text-sm">{group.signLanguage}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-text-muted text-sm font-semibold">
                    {group.reportCount} {group.reportCount === 1 ? "reporte" : "reportes"}
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                      STATUS_COLORS[group.status],
                    )}
                  >
                    {STATUS_LABELS[group.status]}
                  </span>
                </div>
              </div>
              <p className="text-text-muted mt-1 text-sm">
                Razón principal: {REASON_LABELS[group.topReason] ?? group.topReason}
                {group.lastReportAt &&
                  ` · Último reporte: ${new Date(group.lastReportAt).toLocaleDateString("es-AR")}`}
              </p>
            </button>
          ))}
        </div>
      )}

      {selected && <ReportGroupModal group={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
