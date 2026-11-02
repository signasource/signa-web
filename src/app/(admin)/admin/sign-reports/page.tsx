"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  adminApi,
  type AdminSignReport,
  type ReportReason,
  type ReportStatus,
  type SignReportFilters,
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

const REASON_OPTIONS = Object.keys(REASON_LABELS) as ReportReason[];

const TABS: { label: string; value: ReportStatus | "ALL" }[] = [
  { label: "Pendientes", value: "PENDING" },
  { label: "En revisión", value: "REVIEWED" },
  { label: "Resueltos", value: "RESOLVED" },
  { label: "Rechazados", value: "REJECTED" },
  { label: "Todos", value: "ALL" },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function DetailPanel({ report, onClose }: { report: AdminSignReport; onClose: () => void }) {
  const qc = useQueryClient();
  const [adminNote, setAdminNote] = useState(report.adminNote ?? "");

  const mutate = useMutation({
    mutationFn: (status: ReportStatus) =>
      adminApi.updateSignReport(report.id, status, adminNote.trim() || undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "sign-reports"] });
    },
  });

  const resolved = report.status === "RESOLVED" || report.status === "REJECTED";

  return (
    <div className="border-border bg-surface flex w-96 shrink-0 flex-col overflow-hidden rounded-2xl border">
      <div className="flex items-start justify-between border-b border-inherit px-5 py-4">
        <div>
          <h2 className="font-display text-text text-lg font-bold tracking-wide uppercase">
            {report.signMeaning}
          </h2>
          <p className="text-text-muted mt-0.5 text-xs">
            {report.signLanguage} · {REASON_LABELS[report.reason]}
          </p>
        </div>
        <button onClick={onClose} className="text-text-muted hover:text-text p-1 text-lg">
          ✕
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="bg-fill text-text-muted flex size-7 items-center justify-center rounded-full text-xs font-bold uppercase">
            {report.username[0]}
          </div>
          <div className="min-w-0">
            <p className="text-text text-xs font-semibold">@{report.username}</p>
            <p className="text-text-muted text-xs">{formatDate(report.createdAt)}</p>
          </div>
          <span
            className={cn(
              "ml-auto shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold",
              STATUS_COLORS[report.status],
            )}
          >
            {STATUS_LABELS[report.status]}
          </span>
        </div>

        <div>
          <p className="text-text-muted text-xs font-semibold">Comentario del usuario</p>
          {report.description ? (
            <p className="text-text mt-1 text-xs">&ldquo;{report.description}&rdquo;</p>
          ) : (
            <p className="text-text-muted mt-1 text-xs italic">Sin comentario.</p>
          )}
        </div>

        {report.adminNote && (
          <div className="border-border bg-fill rounded-xl border p-3">
            <p className="text-text-muted text-xs font-semibold">Nota interna</p>
            <p className="text-text mt-1 text-xs">{report.adminNote}</p>
          </div>
        )}

        {resolved && report.resolvedBy && (
          <p className="text-text-muted text-xs">
            {report.status === "RESOLVED" ? "Resuelto" : "Rechazado"} por{" "}
            <span className="text-text font-semibold">{report.resolvedBy}</span>
            {report.resolvedAt && ` · ${formatDate(report.resolvedAt)}`}
          </p>
        )}
      </div>

      <div className="border-border space-y-3 border-t px-5 py-4">
        <label className="text-text flex flex-col gap-1.5 text-xs font-semibold">
          Nota interna
          <textarea
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value)}
            rows={2}
            placeholder="Qué se revisó y qué se decidió (solo lo ve el equipo)."
            className="border-border bg-fill focus:border-primary resize-none rounded-xl border px-3 py-2 text-sm font-normal outline-none"
          />
        </label>

        {mutate.error && (
          <p className="text-danger text-xs">
            {mutate.error instanceof Error ? mutate.error.message : "Error al actualizar."}
          </p>
        )}

        <div className="flex gap-2">
          {report.status === "PENDING" && (
            <button
              onClick={() => mutate.mutate("REVIEWED")}
              disabled={mutate.isPending}
              className="bg-primary flex-1 rounded-xl px-3 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              Tomar y marcar en revisión
            </button>
          )}
          {report.status === "REVIEWED" && (
            <button
              onClick={() => mutate.mutate("RESOLVED")}
              disabled={mutate.isPending}
              className="bg-success flex-1 rounded-xl px-3 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              Resolver
            </button>
          )}
          {(report.status === "PENDING" || report.status === "REVIEWED") && (
            <button
              onClick={() => mutate.mutate("REJECTED")}
              disabled={mutate.isPending}
              className="border-danger text-danger hover:bg-danger/5 rounded-xl border px-3 py-2 text-xs font-semibold disabled:opacity-50"
            >
              Rechazar
            </button>
          )}
          {resolved && (
            <button
              onClick={() => mutate.mutate("PENDING")}
              disabled={mutate.isPending}
              className="border-border text-text-muted hover:text-text rounded-xl border px-3 py-2 text-xs font-semibold disabled:opacity-50"
            >
              Reabrir
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SignReportsPage() {
  const [tab, setTab] = useState<ReportStatus | "ALL">("PENDING");
  const [reason, setReason] = useState<ReportReason | "">("");
  const [signQuery, setSignQuery] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filters: SignReportFilters = {
    status: tab === "ALL" ? undefined : tab,
    reason: reason || undefined,
    signQuery: signQuery.trim() || undefined,
    from: from || undefined,
    to: to || undefined,
  };

  const { data, isPending, error } = useQuery({
    queryKey: ["admin", "sign-reports", filters],
    queryFn: () => adminApi.signReports(filters),
  });

  const selected = data?.find((r) => r.id === selectedId) ?? null;
  const hasActiveFilters = Boolean(reason || signQuery.trim() || from || to);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-text text-2xl font-bold">Reportes de señas</h1>
        <p className="text-text-muted mt-0.5 text-sm">
          Moderá los reportes enviados por la comunidad desde la app.
        </p>
      </div>

      <div className="border-border mb-4 flex items-center justify-between border-b">
        <div className="flex gap-1">
          {TABS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => {
                setTab(value);
                setSelectedId(null);
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
        {data && (
          <span className="text-text-muted text-xs">
            {data.length} reporte{data.length === 1 ? "" : "s"}
          </span>
        )}
      </div>

      <div className="mb-6 flex flex-wrap items-end gap-3">
        <label className="text-text-muted flex flex-col gap-1 text-xs font-semibold">
          Tipo
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value as ReportReason | "")}
            className="border-border bg-surface text-text focus:border-primary rounded-xl border px-3 py-2 text-sm font-normal outline-none"
          >
            <option value="">Todos</option>
            {REASON_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {REASON_LABELS[r]}
              </option>
            ))}
          </select>
        </label>
        <label className="text-text-muted flex flex-col gap-1 text-xs font-semibold">
          Seña
          <input
            type="text"
            value={signQuery}
            onChange={(e) => setSignQuery(e.target.value)}
            placeholder="Buscar por significado…"
            className="border-border bg-surface text-text focus:border-primary rounded-xl border px-3 py-2 text-sm font-normal outline-none"
          />
        </label>
        <label className="text-text-muted flex flex-col gap-1 text-xs font-semibold">
          Desde
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="border-border bg-surface text-text focus:border-primary rounded-xl border px-3 py-2 text-sm font-normal outline-none"
          />
        </label>
        <label className="text-text-muted flex flex-col gap-1 text-xs font-semibold">
          Hasta
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="border-border bg-surface text-text focus:border-primary rounded-xl border px-3 py-2 text-sm font-normal outline-none"
          />
        </label>
        {hasActiveFilters && (
          <button
            onClick={() => {
              setReason("");
              setSignQuery("");
              setFrom("");
              setTo("");
            }}
            className="text-text-muted hover:text-text rounded-xl px-3 py-2 text-xs font-semibold"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      <div className="flex gap-6">
        <div className="min-w-0 flex-1 space-y-2">
          {isPending ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-fill h-20 animate-pulse rounded-2xl" />
            ))
          ) : error ? (
            <p className="text-danger border-border bg-surface rounded-2xl border px-6 py-10 text-center text-sm">
              No pudimos cargar los reportes.
            </p>
          ) : data.length === 0 ? (
            <p className="border-border bg-surface text-text-muted rounded-2xl border px-6 py-10 text-center text-sm">
              No hay reportes con estos filtros.
            </p>
          ) : (
            data.map((report) => (
              <button
                key={report.id}
                onClick={() => setSelectedId(selectedId === report.id ? null : report.id)}
                className={cn(
                  "border-border bg-surface w-full rounded-2xl border p-5 text-left transition-all",
                  selectedId === report.id
                    ? "border-primary/40 bg-primary/5"
                    : "hover:border-border hover:shadow-sm",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-text font-semibold tracking-wide uppercase">
                        {report.signMeaning}
                      </span>
                      <span className="text-text-muted text-xs">{report.signLanguage}</span>
                    </div>
                    <p className="text-text-muted mt-0.5 text-xs">
                      {REASON_LABELS[report.reason]} · @{report.username} ·{" "}
                      {formatDate(report.createdAt)}
                    </p>
                    {report.description && (
                      <p className="text-text-muted mt-1 line-clamp-1 text-xs italic">
                        &ldquo;{report.description}&rdquo;
                      </p>
                    )}
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                      STATUS_COLORS[report.status],
                    )}
                  >
                    {STATUS_LABELS[report.status]}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>

        {selected && (
          <DetailPanel key={selected.id} report={selected} onClose={() => setSelectedId(null)} />
        )}
      </div>
    </div>
  );
}
