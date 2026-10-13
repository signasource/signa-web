"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  adminApi,
  type AdminSignReportGroup,
  type ReportReason,
  type ReportStatus,
} from "@/lib/api/admin";
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

const REASON_LABELS: Record<ReportReason, string> = {
  INCORRECT_SIGN: "Seña incorrecta",
  UNCLEAR_ANIMATION: "Animación poco clara",
  WRONG_MEANING: "Significado erróneo",
  MISSING_CONTEXT: "Falta contexto",
  REGIONAL_VARIANT: "Variante regional",
  TECHNICAL_PROBLEM: "Problema técnico",
  OTHER: "Otro",
};

const TABS: { label: string; value: ReportStatus | "ALL" }[] = [
  { label: "Pendientes", value: "PENDING" },
  { label: "En revisión", value: "REVIEWED" },
  { label: "Resueltos", value: "RESOLVED" },
  { label: "Rechazados", value: "REJECTED" },
];

function relativeDate(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return "Hoy";
  if (days === 1) return "Ayer";
  return `Hace ${days} días`;
}

function DetailPanel({ group, onClose }: { group: AdminSignReportGroup; onClose: () => void }) {
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
    <div className="border-border bg-surface flex w-96 shrink-0 flex-col overflow-hidden rounded-2xl border">
      <div className="flex items-start justify-between border-b border-inherit px-5 py-4">
        <div>
          <h2 className="font-display text-text text-lg font-bold tracking-wide uppercase">
            {group.signMeaning}
          </h2>
          <p className="text-text-muted mt-0.5 text-xs">
            {group.reportCount} {group.reportCount === 1 ? "reporte" : "reportes"} ·{" "}
            {REASON_LABELS[group.topReason]}
          </p>
        </div>
        <button onClick={onClose} className="text-text-muted hover:text-text p-1 text-lg">
          ✕
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
        {group.reports.map((r) => (
          <div key={r.id} className="border-border rounded-xl border p-4 text-sm">
            <div className="mb-2 flex items-center gap-2">
              <div className="bg-fill text-text-muted flex size-7 items-center justify-center rounded-full text-xs font-bold uppercase">
                {r.username[0]}
              </div>
              <div className="min-w-0">
                <p className="text-text text-xs font-semibold">@{r.username}</p>
                <p className="text-text-muted text-xs">{relativeDate(r.createdAt)}</p>
              </div>
              <span
                className={cn(
                  "ml-auto shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold",
                  STATUS_COLORS[r.status],
                )}
              >
                {STATUS_LABELS[r.status]}
              </span>
            </div>
            <p className="text-text-muted text-xs font-medium">{REASON_LABELS[r.reason]}</p>
            {r.description && <p className="text-text-muted mt-1 text-xs">"{r.description}"</p>}
          </div>
        ))}
      </div>

      <div className="border-border space-y-3 border-t px-5 py-4">
        <label className="text-text flex flex-col gap-1.5 text-xs font-semibold">
          Nota interna
          <textarea
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value)}
            rows={2}
            placeholder="Que se revisó y qué se decidió (solo lo ve el equipo)."
            className="border-border bg-fill focus:border-primary resize-none rounded-xl border px-3 py-2 text-sm font-normal outline-none"
          />
        </label>

        {mutate.error && (
          <p className="text-danger text-xs">
            {mutate.error instanceof Error ? mutate.error.message : "Error al actualizar."}
          </p>
        )}

        <div className="flex gap-2">
          {group.status === "PENDING" && (
            <button
              onClick={() => mutate.mutate("REVIEWED")}
              disabled={mutate.isPending}
              className="bg-primary flex-1 rounded-xl px-3 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              Tomar y marcar en revisión
            </button>
          )}
          {(group.status === "PENDING" || group.status === "REVIEWED") && (
            <>
              {group.status === "REVIEWED" && (
                <button
                  onClick={() => mutate.mutate("RESOLVED")}
                  disabled={mutate.isPending}
                  className="bg-success flex-1 rounded-xl px-3 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
                >
                  Resolver
                </button>
              )}
              <button
                onClick={() => mutate.mutate("REJECTED")}
                disabled={mutate.isPending}
                className="border-danger text-danger hover:bg-danger/5 rounded-xl border px-3 py-2 text-xs font-semibold disabled:opacity-50"
              >
                Rechazar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SignReportsPage() {
  const [tab, setTab] = useState<ReportStatus | "ALL">("PENDING");
  const [selected, setSelected] = useState<AdminSignReportGroup | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "sign-reports", tab],
    queryFn: () => adminApi.signReports(tab === "ALL" ? undefined : tab),
  });

  const totalReports = data?.reduce((s, g) => s + g.reportCount, 0) ?? 0;

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-text text-2xl font-bold">Reportes de señas</h1>
        <p className="text-text-muted mt-0.5 text-sm">
          Moderá los reportes enviados por la comunidad desde la app.
        </p>
      </div>

      <div className="border-border mb-6 flex items-center justify-between border-b">
        <div className="flex gap-1">
          {TABS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => {
                setTab(value);
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
        {totalReports > 0 && (
          <span className="text-text-muted text-xs">
            {totalReports} reporte{totalReports > 1 ? "s" : ""}
          </span>
        )}
      </div>

      <div className="flex gap-6">
        <div className="min-w-0 flex-1 space-y-2">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-fill h-20 animate-pulse rounded-2xl" />
            ))
          ) : data?.length === 0 ? (
            <p className="border-border bg-surface text-text-muted rounded-2xl border px-6 py-10 text-center text-sm">
              No hay reportes en esta categoría.
            </p>
          ) : (
            data?.map((group) => (
              <button
                key={group.signId}
                onClick={() => setSelected(selected?.signId === group.signId ? null : group)}
                className={cn(
                  "border-border bg-surface w-full rounded-2xl border p-5 text-left transition-all",
                  selected?.signId === group.signId
                    ? "border-primary/40 bg-primary/5"
                    : "hover:border-border hover:shadow-sm",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-text font-semibold tracking-wide uppercase">
                        {group.signMeaning}
                      </span>
                      <span className="text-text-muted text-xs">{group.signLanguage}</span>
                    </div>
                    <p className="text-text-muted mt-0.5 text-xs">
                      {REASON_LABELS[group.topReason]}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                        STATUS_COLORS[group.status],
                      )}
                    >
                      {STATUS_LABELS[group.status]}
                    </span>
                    <span className="text-text-muted text-xs font-semibold">
                      {group.reportCount} {group.reportCount === 1 ? "reporte" : "reportes"}
                    </span>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {selected && <DetailPanel group={selected} onClose={() => setSelected(null)} />}
      </div>
    </div>
  );
}
