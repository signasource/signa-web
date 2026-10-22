"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { adminApi, type ContentImportRun } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";

const VERSION_STATUS_LABELS: Record<string, string> = {
  PUBLISHED: "Publicada",
  DRAFT: "Borrador",
  ARCHIVED: "Archivada",
};

const VERSION_STATUS_COLORS: Record<string, string> = {
  PUBLISHED: "bg-success/10 text-success-dark",
  DRAFT: "bg-warning/10 text-warning",
  ARCHIVED: "bg-fill text-text-muted",
};

function CoursesTab() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "courses"],
    queryFn: adminApi.courses,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-fill h-24 animate-pulse rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {data?.length === 0 && (
        <p className="text-text-muted py-10 text-center text-sm">No hay cursos.</p>
      )}
      {data?.map((course) => (
        <div key={course.id} className="border-border bg-surface rounded-2xl border p-5">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-text font-semibold">{course.name}</h3>
              {course.description && (
                <p className="text-text-muted mt-0.5 line-clamp-1 text-sm">{course.description}</p>
              )}
            </div>
            <span className="text-primary text-xs font-semibold tracking-wide uppercase">
              {course.signLanguageCode}
            </span>
          </div>
          {course.versions.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {course.versions.map((v) => (
                <div
                  key={v.id}
                  className="border-border bg-fill flex items-center gap-1.5 rounded-xl border px-3 py-1.5"
                >
                  <span className="text-text-muted text-xs">v{v.version}</span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-semibold",
                      VERSION_STATUS_COLORS[v.status] ?? "bg-fill text-text-muted",
                    )}
                  >
                    {VERSION_STATUS_LABELS[v.status] ?? v.status}
                  </span>
                  {v.publishedAt && (
                    <span className="text-text-muted text-xs">
                      {new Date(v.publishedAt).toLocaleDateString("es-AR")}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function SignsTab() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [page, setPage] = useState(0);

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value);
    clearTimeout(
      (window as Window & { _signSearchTimeout?: ReturnType<typeof setTimeout> })
        ._signSearchTimeout,
    );
    (window as Window & { _signSearchTimeout?: ReturnType<typeof setTimeout> })._signSearchTimeout =
      setTimeout(() => {
        setDebouncedQuery(e.target.value);
        setPage(0);
      }, 300);
  }

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "signs", debouncedQuery, page],
    queryFn: () => adminApi.signs({ query: debouncedQuery || undefined, page, size: 30 }),
  });

  return (
    <div>
      <div className="mb-4">
        <input
          type="search"
          value={query}
          onChange={handleSearch}
          placeholder="Buscar por significado…"
          className="border-border bg-surface focus:border-primary w-full max-w-sm rounded-xl border px-4 py-2.5 text-sm outline-none"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="bg-fill h-20 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {data?.content.map((sign) => (
              <div key={sign.id} className="border-border bg-surface rounded-2xl border p-4">
                <p className="text-text text-sm font-semibold">{sign.meaning}</p>
                <p className="text-text-muted mt-0.5 text-xs">
                  {sign.handedness === "ONE_HANDED" ? "Una mano" : "Dos manos"}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {sign.hasAnimation && (
                    <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs font-semibold">
                      Animación
                    </span>
                  )}
                  {sign.openReports > 0 && (
                    <span className="bg-danger/10 text-danger rounded-full px-2 py-0.5 text-xs font-semibold">
                      {sign.openReports} reporte{sign.openReports > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {data && data.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <button
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
                className="border-border text-text-muted hover:bg-fill rounded-xl border px-4 py-2 text-sm font-medium disabled:opacity-40"
              >
                Anterior
              </button>
              <span className="text-text-muted text-sm">
                {page * 30 + 1}–{Math.min((page + 1) * 30, data.totalElements)} de{" "}
                {data.totalElements}
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
  );
}

const IMPORT_STATUS_STYLES: Record<string, string> = {
  SUCCESS: "bg-success/10 text-success-dark",
  FAILED: "bg-danger/10 text-danger",
};

const IMPORT_STATUS_LABELS: Record<string, string> = {
  SUCCESS: "Exitosa",
  FAILED: "Fallida",
};

const IMPORT_TRIGGER_LABELS: Record<string, string> = {
  STARTUP: "Arranque",
  MANUAL: "Manual",
};

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ImportTab() {
  const queryClient = useQueryClient();
  const [lastRun, setLastRun] = useState<ContentImportRun | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "content-import-runs"],
    queryFn: () => adminApi.contentImportRuns({ page: 0, size: 20 }),
  });

  const mutation = useMutation({
    mutationFn: adminApi.importContent,
    onSuccess: (run) => {
      setLastRun(run);
      queryClient.invalidateQueries({ queryKey: ["admin", "content-import-runs"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "courses"] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="border-border bg-surface rounded-2xl border p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-text font-semibold">Importar contenido</h3>
            <p className="text-text-muted mt-0.5 text-sm">
              Corre el pipeline de contenido (cursos y señas) desde el YAML del repositorio. Es
              idempotente: solo aplica lo que cambió, sin borrar datos.
            </p>
          </div>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="bg-primary hover:bg-primary-dark rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-50"
          >
            {mutation.isPending ? "Importando…" : "Importar ahora"}
          </button>
        </div>

        {mutation.isError && (
          <p className="bg-danger/10 text-danger mt-4 rounded-xl px-4 py-2.5 text-sm">
            {mutation.error instanceof ApiError
              ? mutation.error.message
              : "No se pudo iniciar la importación."}
          </p>
        )}

        {lastRun && !mutation.isPending && (
          <div
            className={cn(
              "mt-4 rounded-xl px-4 py-3 text-sm",
              lastRun.status === "SUCCESS"
                ? "bg-success/10 text-success-dark"
                : "bg-danger/10 text-danger",
            )}
          >
            {lastRun.status === "SUCCESS" ? (
              <span>
                Importación exitosa: {lastRun.coursesProcessed} curso(s) — {lastRun.created} nuevos,{" "}
                {lastRun.updated} actualizados, {lastRun.unchanged} sin cambios.
              </span>
            ) : (
              <span>Importación fallida: {lastRun.details ?? "error desconocido"}.</span>
            )}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-text mb-3 font-semibold">Historial</h3>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-fill h-14 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : data && data.content.length > 0 ? (
          <div className="border-border bg-surface overflow-hidden rounded-2xl border">
            <table className="w-full text-sm">
              <thead className="border-border text-text-muted border-b text-left text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 font-semibold">Fecha</th>
                  <th className="px-4 py-3 font-semibold">Disparo</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                  <th className="px-4 py-3 font-semibold">Resultado</th>
                  <th className="px-4 py-3 font-semibold">Por</th>
                </tr>
              </thead>
              <tbody>
                {data.content.map((run) => (
                  <tr key={run.id} className="border-border/60 border-b last:border-0">
                    <td className="text-text px-4 py-3 whitespace-nowrap">
                      {formatDateTime(run.startedAt)}
                    </td>
                    <td className="text-text-muted px-4 py-3">
                      {IMPORT_TRIGGER_LABELS[run.trigger] ?? run.trigger}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-semibold",
                          IMPORT_STATUS_STYLES[run.status] ?? "bg-fill text-text-muted",
                        )}
                      >
                        {IMPORT_STATUS_LABELS[run.status] ?? run.status}
                      </span>
                    </td>
                    <td className="text-text-muted px-4 py-3">
                      {run.status === "SUCCESS"
                        ? `${run.created} nuevos · ${run.updated} act. · ${run.unchanged} s/c`
                        : (run.details ?? "—")}
                    </td>
                    <td className="text-text-muted px-4 py-3">{run.triggeredBy ?? "Sistema"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-text-muted py-10 text-center text-sm">
            Todavía no hay importaciones registradas.
          </p>
        )}
      </div>
    </div>
  );
}

type ContentTab = "courses" | "signs" | "import";

export default function ContentPage() {
  const [tab, setTab] = useState<ContentTab>("courses");

  return (
    <div>
      <h1 className="font-display text-text mb-2 text-2xl font-bold">Cursos y señas</h1>
      <p className="text-text-muted mb-6 text-sm">Contenido disponible en la plataforma.</p>

      <div className="bg-fill mb-6 flex w-fit gap-1 rounded-xl p-1">
        <button
          onClick={() => setTab("courses")}
          className={cn(
            "rounded-lg px-5 py-2 text-sm font-semibold transition-colors",
            tab === "courses"
              ? "bg-surface text-text shadow-sm"
              : "text-text-muted hover:text-text",
          )}
        >
          Cursos
        </button>
        <button
          onClick={() => setTab("signs")}
          className={cn(
            "rounded-lg px-5 py-2 text-sm font-semibold transition-colors",
            tab === "signs" ? "bg-surface text-text shadow-sm" : "text-text-muted hover:text-text",
          )}
        >
          Señas
        </button>
        <button
          onClick={() => setTab("import")}
          className={cn(
            "rounded-lg px-5 py-2 text-sm font-semibold transition-colors",
            tab === "import" ? "bg-surface text-text shadow-sm" : "text-text-muted hover:text-text",
          )}
        >
          Importación
        </button>
      </div>

      {tab === "courses" ? <CoursesTab /> : tab === "signs" ? <SignsTab /> : <ImportTab />}
    </div>
  );
}
