"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { ConfirmDialog, type ConfirmRequest } from "@/features/admin/signs/confirm-dialog";
import { errorMessage } from "@/features/admin/signs/errors";
import { courseLessonHref } from "@/lib/course-deep-link";
import { FORMAT_TINT, FormatBadge } from "@/features/admin/signs/sign-card";
import { SignAnimationPanel } from "@/features/admin/signs/sign-animation-panel";
import {
  adminApi,
  type AdminSignDetail,
  type CourseVersionStatus,
  type Handedness,
  type UpdateSignInput,
} from "@/lib/api/admin";
import { meaningError, normalizeMeaning, youtubeError } from "@/lib/sign-editor";
import { cn } from "@/lib/utils";

const BLOCK_LABELS: Record<string, string> = {
  INTRODUCE_SIGN: "Presentar seña",
  SELECT_MEANING: "Elegir significado",
  SELECT_SIGN: "Elegir seña",
  CONTEXT_RESPONSE: "Respuesta en contexto",
  MATCH: "Emparejar",
  VISUAL_RECOGNITION: "Reconocimiento visual",
};

const STATUS: Record<CourseVersionStatus, { label: string; className: string }> = {
  DRAFT: { label: "Borrador", className: "bg-warning/20 text-shop-amber-dark" },
  PUBLISHED: { label: "Publicada", className: "bg-success/15 text-success-dark" },
  ARCHIVED: { label: "Archivada", className: "bg-fill-dark text-text-muted" },
};

/** "1 lección" / "3 lecciones": the plural drops the accent, so it is not "lección" + "es". */
function lessonsLabel(count: number): string {
  return `${count} ${count === 1 ? "lección" : "lecciones"}`;
}

export function signQueryKey(id: string) {
  return ["admin", "sign", id] as const;
}

export function SignEditor({
  id,
  onBack,
  onToast,
}: {
  id: string;
  onBack: () => void;
  onToast: (message: string) => void;
}) {
  const { data, isPending, error } = useQuery({
    queryKey: signQueryKey(id),
    queryFn: () => adminApi.sign(id),
  });

  if (isPending) return <p className="text-text-muted">Cargando…</p>;
  if (error) {
    return (
      <div className="flex flex-col items-start gap-3">
        <p className="text-danger">No pudimos cargar los datos.</p>
        <button onClick={onBack} className="text-text text-sm font-semibold underline">
          Volver a Señas
        </button>
      </div>
    );
  }

  return (
    <EditorForm
      // Remount (fresh draft) whenever the saved values change, e.g. after "Guardar".
      key={`${data.meaning}|${data.handedness}|${data.youtubeUrl ?? ""}`}
      sign={data}
      onBack={onBack}
      onToast={onToast}
    />
  );
}

function EditorForm({
  sign,
  onBack,
  onToast,
}: {
  sign: AdminSignDetail;
  onBack: () => void;
  onToast: (message: string) => void;
}) {
  const queryClient = useQueryClient();
  const [meaning, setMeaning] = useState(sign.meaning);
  const [handedness, setHandedness] = useState<Handedness>(sign.handedness);
  const [youtube, setYoutube] = useState(sign.youtubeUrl ?? "");
  const [confirm, setConfirm] = useState<ConfirmRequest | null>(null);
  const meaningProblem = meaningError(meaning);
  const youtubeProblem = youtubeError(youtube);
  const changes: UpdateSignInput = {};
  if (normalizeMeaning(meaning) !== sign.meaning) changes.meaning = normalizeMeaning(meaning);
  if (handedness !== sign.handedness) changes.handedness = handedness;
  if (youtube.trim() !== (sign.youtubeUrl ?? "")) changes.youtubeUrl = youtube.trim();
  const dirty = Object.keys(changes).length > 0;
  const valid = !meaningProblem && !youtubeProblem;

  function applySaved(saved: AdminSignDetail) {
    queryClient.setQueryData(signQueryKey(saved.id), saved);
    void queryClient.invalidateQueries({ queryKey: ["admin", "signs"] });
  }

  const save = useMutation({
    mutationFn: (input: UpdateSignInput) => adminApi.updateSign(sign.id, input),
    onSuccess: (saved, input) => {
      applySaved(saved);
      // Lessons were rewritten too: course editors must refetch.
      if (input.meaning)
        void queryClient.invalidateQueries({ queryKey: ["admin", "course-versions"] });
      onToast(
        input.meaning && sign.usages.length > 0
          ? `Seña renombrada a “${saved.meaning}” en ${lessonsLabel(sign.usages.length)}.`
          : "Cambios guardados.",
      );
    },
    onError: (err) =>
      onToast(errorMessage(err, "No pudimos guardar los cambios. Intentá de nuevo.")),
  });

  const remove = useMutation({
    mutationFn: () => adminApi.deleteSign(sign.id),
    onSuccess: () => {
      // Leave first: dropping the cache while the editor is mounted would refetch the deleted sign.
      onBack();
      onToast(`Seña “${sign.meaning}” eliminada.`);
      void queryClient.invalidateQueries({ queryKey: ["admin", "signs"] });
      setTimeout(() => queryClient.removeQueries({ queryKey: signQueryKey(sign.id) }), 0);
    },
    onError: (err) => onToast(errorMessage(err, "No pudimos eliminar la seña.")),
  });

  const published = sign.usages.filter((u) => u.versionStatus === "PUBLISHED").length;
  // Same rules the API enforces on DELETE (it also refuses signs with any report).
  const deleteBlocker =
    sign.usages.length > 0
      ? `No se puede eliminar debido a que se usa en ${lessonsLabel(sign.usages.length)}.`
      : sign.openReports > 0
        ? "No se puede eliminar debido a que tiene reportes de usuarios."
        : null;
  const courses = new Set(sign.usages.map((u) => u.courseId)).size;

  function requestSave() {
    if (!dirty || !valid) return;
    if (changes.meaning && sign.usages.length > 0) {
      setConfirm({
        title: `¿Renombrar “${sign.meaning}” a “${changes.meaning}”?`,
        body: (
          <>
            La seña se usa en <b className="text-text">{sign.usages.length}</b>{" "}
            {sign.usages.length === 1 ? "lección" : "lecciones"}
            {published > 0 && (
              <>
                {" "}
                (<b className="text-text">{published}</b> en cursos publicados)
              </>
            )}
            . Se van a actualizar todas, y el progreso de los alumnos que ya la aprendieron, para
            que sigan funcionando en la app.
          </>
        ),
        confirmLabel: "Renombrar",
        onConfirm: () => save.mutate(changes),
      });
      return;
    }
    save.mutate(changes);
  }

  function back() {
    if (!dirty) return onBack();
    setConfirm({
      title: "¿Salir sin guardar?",
      body: "Tenés cambios sin guardar en esta seña. Si salís, se pierden.",
      confirmLabel: "Salir sin guardar",
      danger: true,
      onConfirm: onBack,
    });
  }

  return (
    <div className="-m-4 sm:-m-6 lg:-m-8">
      {/* sticky top bar */}
      <div className="border-border bg-background/95 sticky top-0 z-20 flex flex-wrap items-center gap-4 border-b px-8 py-3 backdrop-blur-sm">
        <button
          onClick={back}
          className="text-text-muted hover:text-text flex items-center gap-1.5 py-1.5 text-sm font-semibold"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M15 5l-7 7 7 7" />
          </svg>
          Señas
        </button>
        <span className="bg-border h-5 w-px" />
        <span className="font-display text-lg font-bold">{sign.meaning}</span>
        <FormatBadge format={sign.animationFormat} />
        <div className="ml-auto flex flex-wrap items-center gap-3">
          <span className="text-text-muted flex items-center gap-2 text-sm">
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                save.isPending ? "bg-warning" : dirty ? "bg-text-muted" : "bg-success",
              )}
            />
            {save.isPending ? "Guardando…" : dirty ? "Sin guardar" : "Guardado"}
          </span>
          {dirty && (
            <button
              onClick={() => {
                setMeaning(sign.meaning);
                setHandedness(sign.handedness);
                setYoutube(sign.youtubeUrl ?? "");
              }}
              className="border-border text-text hover:bg-fill rounded-xl border bg-white px-4 py-2.5 text-sm font-semibold"
            >
              Descartar
            </button>
          )}
          <button
            onClick={requestSave}
            disabled={!dirty || !valid || save.isPending}
            className="bg-text text-on-dark hover:bg-ink-700 rounded-xl px-5 py-2.5 text-sm font-semibold disabled:opacity-40"
          >
            Guardar cambios
          </button>
          {/* A disabled button gets no hover events in some browsers, so the reason it
              is blocked lives on a wrapper that can also take keyboard focus. */}
          <span className="group relative inline-flex" tabIndex={deleteBlocker ? 0 : undefined}>
            <button
              onClick={() =>
                setConfirm({
                  title: `¿Eliminar “${sign.meaning}”?`,
                  body: "La seña sale del catálogo. Esta acción no se puede deshacer.",
                  confirmLabel: "Eliminar",
                  danger: true,
                  onConfirm: () => remove.mutate(),
                })
              }
              disabled={remove.isPending || !!deleteBlocker}
              aria-describedby={deleteBlocker ? "sign-delete-blocker" : undefined}
              className="border-danger-light bg-danger-light text-danger rounded-xl border px-4 py-2.5 text-sm font-semibold hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Eliminar
            </button>
            {deleteBlocker && (
              <span
                id="sign-delete-blocker"
                role="tooltip"
                className="bg-text text-on-dark pointer-events-none invisible absolute top-full right-0 z-30 mt-2 w-max max-w-[260px] rounded-lg px-3 py-2 text-xs leading-snug opacity-0 shadow-lg transition-opacity group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100"
              >
                {deleteBlocker}
              </span>
            )}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 px-8 py-6 pb-16">
        {/* sign meta card */}
        <section
          className={cn(
            "flex min-w-0 flex-[999_1_420px] flex-col gap-4 rounded-lg p-6",
            FORMAT_TINT[sign.animationFormat ?? "none"],
          )}
        >
          <span className="text-text/70 text-[11px] font-bold tracking-widest uppercase">Seña</span>
          <label className="flex flex-col gap-1.5">
            <span className="sr-only">Nombre de la seña</span>
            <input
              value={meaning}
              onChange={(e) => setMeaning(e.target.value)}
              placeholder="Nombre de la seña"
              maxLength={60}
              aria-invalid={!!meaningProblem}
              className="font-display text-text border-text/15 focus:border-text w-full border-b-2 border-dashed bg-transparent pb-1.5 text-4xl font-bold outline-none"
            />
            {meaningProblem ? (
              <span className="text-danger text-sm">{meaningProblem}</span>
            ) : (
              changes.meaning &&
              sign.usages.length > 0 && (
                <span className="text-text/70 text-sm">
                  Al guardar se renombra en las {sign.usages.length} lecciones que la usan.
                </span>
              )
            )}
          </label>

          <div className="flex flex-wrap items-end gap-4">
            <div className="flex flex-col gap-1.5">
              <span className="text-text/70 text-[11px] font-semibold tracking-wider uppercase">
                Manos
              </span>
              <div className="flex gap-0.5 rounded-md bg-white/55 p-0.5" role="radiogroup">
                {(
                  [
                    ["ONE_HANDED", "Una mano"],
                    ["TWO_HANDED", "Dos manos"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    role="radio"
                    aria-checked={handedness === value}
                    onClick={() => setHandedness(value)}
                    className={cn(
                      "rounded px-3 py-1.5 text-sm font-semibold",
                      handedness === value ? "text-text bg-white" : "text-text-muted",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <label className="flex min-w-[240px] flex-1 flex-col gap-1.5">
              <span className="text-text/70 text-[11px] font-semibold tracking-wider uppercase">
                Video de YouTube (opcional)
              </span>
              <div className="flex items-center gap-2">
                <input
                  value={youtube}
                  onChange={(e) => setYoutube(e.target.value)}
                  placeholder="https://youtu.be/…"
                  inputMode="url"
                  aria-invalid={!!youtubeProblem}
                  className="text-text w-full rounded-md bg-white/55 px-3 py-2 text-sm outline-none focus:bg-white"
                />
                {sign.youtubeUrl && !youtubeProblem && (
                  <a
                    href={sign.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-dark shrink-0 text-sm font-semibold"
                  >
                    Abrir
                  </a>
                )}
              </div>
              {youtubeProblem && <span className="text-danger text-sm">{youtubeProblem}</span>}
            </label>
          </div>
        </section>

        {/* summary card */}
        <section className="bg-text text-on-dark flex flex-[1_1_180px] flex-col justify-between gap-2.5 rounded-lg p-4.5">
          <span className="text-on-dark/55 text-[11px] font-bold tracking-widest uppercase">
            Resumen
          </span>
          {(
            [
              ["Lecciones", sign.usages.length],
              ["Publicadas", published],
              ["Cursos", courses],
              ["Reportes abiertos", sign.openReports],
            ] as const
          ).map(([label, value]) => (
            <div key={label} className="flex items-baseline justify-between gap-2">
              <span className="text-on-dark/65 text-xs">{label}</span>
              <span className="font-display text-[22px] font-bold">{value}</span>
            </div>
          ))}
        </section>

        <SignAnimationPanel
          sign={sign}
          meaning={normalizeMeaning(meaning) || sign.meaning}
          onSaved={applySaved}
          onToast={onToast}
          onConfirm={setConfirm}
        />

        {/* usages */}
        <section className="border-border w-full rounded-lg border bg-white p-6">
          <div className="mb-4 flex flex-wrap items-baseline gap-3">
            <h2 className="font-display text-text text-xl font-bold">Dónde se usa</h2>
            <span className="text-text-muted text-sm">
              Lecciones que muestran o preguntan por esta seña
            </span>
            {sign.openReports > 0 && (
              <Link
                href="/admin/sign-reports"
                className="text-danger ml-auto text-sm font-semibold underline underline-offset-2"
              >
                Ver {sign.openReports} reporte{sign.openReports !== 1 ? "s" : ""} abierto
                {sign.openReports !== 1 ? "s" : ""}
              </Link>
            )}
          </div>
          {sign.usages.length === 0 ? (
            <p className="border-fill-dark text-text-muted rounded-lg border border-dashed px-5 py-8 text-center text-sm">
              Ninguna lección usa esta seña todavía. Agregala desde el editor de Cursos.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-border text-text-muted border-b text-left text-xs uppercase">
                  <tr>
                    <th className="py-2.5 pr-4 font-semibold">Lección</th>
                    <th className="py-2.5 pr-4 font-semibold">Curso</th>
                    <th className="py-2.5 pr-4 font-semibold">Ejercicios con la seña</th>
                    <th className="py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {sign.usages.map((u) => (
                    <tr
                      key={`${u.courseVersionId}-${u.lessonId}`}
                      className="border-border/60 border-b last:border-0"
                    >
                      <td className="py-2.5 pr-4">
                        <span className="text-text block font-semibold">{u.lessonName}</span>
                        <span className="text-text-muted text-xs">{u.topicTitle}</span>
                      </td>
                      <td className="py-2.5 pr-4">
                        <span className="text-text block">{u.courseName}</span>
                        <span className="flex items-center gap-1.5 whitespace-nowrap">
                          <span className="text-text-muted font-mono text-xs">v{u.version}</span>
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                              STATUS[u.versionStatus].className,
                            )}
                          >
                            {STATUS[u.versionStatus].label}
                          </span>
                        </span>
                      </td>
                      <td className="text-text-muted py-2.5 pr-4">
                        {u.blockTypes.map((t) => BLOCK_LABELS[t] ?? t).join(", ")}
                      </td>
                      <td className="py-2.5 text-right whitespace-nowrap">
                        <Link
                          href={courseLessonHref(u.courseId, u.lessonId, u.courseVersionId)}
                          className="text-primary-dark text-sm font-semibold"
                        >
                          Abrir lección →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <ConfirmDialog request={confirm} onClose={() => setConfirm(null)} />
    </div>
  );
}
