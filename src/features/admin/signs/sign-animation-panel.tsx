"use client";

import { useMutation } from "@tanstack/react-query";
import { useRef, useState, type DragEvent } from "react";
import type { ConfirmRequest } from "@/features/admin/signs/confirm-dialog";
import { errorMessage } from "@/features/admin/signs/errors";
import { SignMediaPreview } from "@/features/admin/signs/sign-media-preview";
import {
  adminApi,
  type AdminSignDetail,
  type AnimationFormat,
  type SignView,
} from "@/lib/api/admin";
import { detectMediaFormat, formatAgo, formatBytes, uploadError } from "@/lib/sign-editor";
import { cn } from "@/lib/utils";

const FORMATS: { key: AnimationFormat; label: string; hint: string }[] = [
  { key: "glb", label: "Avatar 3D (.glb)", hint: "Un archivo; el alumno puede girar el avatar." },
  { key: "mp4", label: "Video (.mp4)", hint: "Video de frente y, opcional, uno lateral." },
];

/**
 * The editor's "Animación" section: choose 3D or video, upload the file(s) and preview them. A
 * .glb is one file; an .mp4 sign has a front video and an optional lateral one. Uploads go live in
 * the app right away, so replacing an existing file asks for confirmation first.
 */
export function SignAnimationPanel({
  sign,
  meaning,
  onSaved,
  onToast,
  onConfirm,
}: {
  sign: AdminSignDetail;
  /** The name as typed (unsaved), for the preview caption. */
  meaning: string;
  onSaved: (saved: AdminSignDetail) => void;
  onToast: (message: string) => void;
  onConfirm: (request: ConfirmRequest) => void;
}) {
  const [mode, setMode] = useState<AnimationFormat>(sign.animationFormat ?? "glb");
  const [problem, setProblem] = useState<string | null>(null);
  const missing = sign.hasAnimation && sign.mediaAvailable === false;

  const upload = useMutation({
    mutationFn: ({ file, view }: { file: File; view: SignView }) =>
      adminApi.uploadSignAnimation(sign.id, file, view),
    onSuccess: (saved, { view }) => {
      onSaved(saved);
      onToast(
        view === "lateral"
          ? "Video lateral subido. Ya se ve en la app."
          : saved.animationFormat === "mp4"
            ? "Video de frente subido. Ya se ve en la app."
            : "Animación 3D subida. Ya se ve en la app.",
      );
    },
    onError: (err) =>
      setProblem(errorMessage(err, "No pudimos subir el archivo. Intentá de nuevo.")),
  });

  const removeLateral = useMutation({
    mutationFn: () => adminApi.removeSignLateral(sign.id),
    onSuccess: (saved) => {
      onSaved(saved);
      onToast("Video lateral quitado.");
    },
    onError: (err) => setProblem(errorMessage(err, "No pudimos quitar el video lateral.")),
  });

  async function pick(file: File, view: SignView) {
    setProblem(null);
    const generic = await uploadError(file);
    if (generic) return setProblem(generic);
    const format = await detectMediaFormat(file);
    const expected: AnimationFormat = view === "lateral" ? "mp4" : mode;
    if (format !== expected) {
      return setProblem(
        expected === "glb"
          ? "Elegiste avatar 3D: subí un archivo .glb (o cambiá a Video)."
          : "Acá va un video .mp4.",
      );
    }

    const replacing =
      view === "lateral" ? !!sign.lateralAnimationUrl : sign.hasAnimation && !missing;
    const dropsLateral = view === "front" && format === "glb" && !!sign.lateralAnimationUrl;
    if (!replacing && !dropsLateral) return upload.mutate({ file, view });

    const what =
      view === "lateral"
        ? "el video lateral"
        : sign.animationFormat === format
          ? "la animación actual"
          : `el ${sign.animationFormat === "mp4" ? "video" : "avatar 3D"} actual`;
    onConfirm({
      title: view === "lateral" ? "¿Reemplazar el video lateral?" : "¿Reemplazar la animación?",
      body: (
        <>
          <b className="text-text">{file.name}</b> ({formatBytes(file.size)}) va a reemplazar {what}{" "}
          de “{sign.meaning}” y se va a ver en la app de inmediato
          {sign.usages.length > 0 ? `, en las ${sign.usages.length} lecciones que la usan` : ""}.
          {dropsLateral && " Como pasa a ser 3D, deja de usar el video lateral."} El archivo
          anterior queda guardado como respaldo en el bucket.
        </>
      ),
      confirmLabel: "Reemplazar",
      onConfirm: () => upload.mutate({ file, view }),
    });
  }

  const busy = upload.isPending ? upload.variables.view : null;

  return (
    <section className="border-border flex w-full flex-wrap gap-8 rounded-lg border bg-white p-6">
      <SignMediaPreview
        meaning={meaning}
        format={sign.animationFormat}
        url={sign.mediaUrl}
        lateralUrl={sign.lateralMediaUrl}
        missing={missing}
      />
      <div className="flex min-w-[280px] flex-1 flex-col gap-4">
        <div>
          <h2 className="font-display text-text text-xl font-bold">Animación</h2>
          <p className="text-text-muted mt-1 text-sm leading-relaxed">
            Lo que ve el alumno en la app. Al subir un archivo, la app lo muestra de inmediato en
            todas las lecciones que usan la seña.
          </p>
        </div>

        {missing && (
          <p role="alert" className="bg-danger-light text-danger rounded-lg px-4 py-3 text-sm">
            <b>Falta el archivo.</b> La seña apunta a{" "}
            <span className="font-mono text-xs">{sign.animationUrl}</span>, pero no existe en el
            bucket, así que la app no muestra nada. Subí la animación acá.
          </p>
        )}

        <div className="flex flex-col gap-1.5">
          <span className="text-text-muted text-[11px] font-semibold tracking-wider uppercase">
            Formato
          </span>
          <div
            className="bg-fill grid w-full max-w-md grid-cols-2 gap-1 rounded-xl p-1"
            role="radiogroup"
          >
            {FORMATS.map(({ key, label, hint }) => (
              <button
                key={key}
                role="radio"
                aria-checked={mode === key}
                onClick={() => {
                  setMode(key);
                  setProblem(null);
                }}
                className={cn(
                  "flex flex-col items-start rounded-lg px-3 py-2 text-left",
                  mode === key ? "bg-white shadow-sm" : "hover:bg-white/50",
                )}
              >
                <span
                  className={cn(
                    "text-sm font-semibold",
                    mode === key ? "text-text" : "text-text-muted",
                  )}
                >
                  {label}
                  {sign.animationFormat === key && !missing && (
                    <span className="text-success-dark ml-1.5 text-xs">· actual</span>
                  )}
                </span>
                <span className="text-text-muted text-xs">{hint}</span>
              </button>
            ))}
          </div>
          {mode !== sign.animationFormat && sign.hasAnimation && !missing && (
            <span className="text-text-muted text-xs">
              Hoy la seña es {sign.animationFormat === "mp4" ? "un video" : "un avatar 3D"}: no
              cambia nada hasta que subas el archivo nuevo.
            </span>
          )}
        </div>

        {mode === "glb" ? (
          <Dropzone
            label="Avatar 3D"
            accept=".glb,model/gltf-binary"
            hint=".glb · hasta 50 MB"
            current={sign.animationFormat === "glb" && !missing ? sign.animationUrl : null}
            currentUrl={sign.animationFormat === "glb" && !missing ? sign.mediaUrl : null}
            busy={busy === "front" ? upload.variables?.file : undefined}
            onFile={(f) => void pick(f, "front")}
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <Dropzone
              label="Video de frente"
              accept=".mp4,video/mp4"
              hint=".mp4 · hasta 50 MB"
              current={sign.animationFormat === "mp4" && !missing ? sign.animationUrl : null}
              currentUrl={sign.animationFormat === "mp4" && !missing ? sign.mediaUrl : null}
              busy={busy === "front" ? upload.variables?.file : undefined}
              onFile={(f) => void pick(f, "front")}
            />
            <Dropzone
              label="Video lateral (opcional)"
              accept=".mp4,video/mp4"
              hint=".mp4 · hasta 50 MB"
              disabledReason={
                sign.animationFormat !== "mp4" || missing
                  ? "Primero subí el video de frente."
                  : undefined
              }
              current={sign.lateralAnimationUrl}
              currentUrl={sign.lateralMediaUrl}
              busy={busy === "lateral" ? upload.variables?.file : undefined}
              onFile={(f) => void pick(f, "lateral")}
              onRemove={
                sign.lateralAnimationUrl
                  ? () =>
                      onConfirm({
                        title: "¿Quitar el video lateral?",
                        body: "La app va a mostrar solo el video de frente. El archivo queda en el bucket.",
                        confirmLabel: "Quitar",
                        danger: true,
                        onConfirm: () => removeLateral.mutate(),
                      })
                  : undefined
              }
            />
          </div>
        )}

        {problem && (
          <p role="alert" className="bg-danger-light text-danger rounded-lg px-4 py-2.5 text-sm">
            {problem}
          </p>
        )}

        <p className="text-text-muted text-xs">
          {sign.animationUpdatedAt
            ? `Última subida ${formatAgo(sign.animationUpdatedAt)} · ${new Date(sign.animationUpdatedAt).toLocaleString("es-AR")}`
            : sign.hasAnimation
              ? "Archivo original del catálogo (nunca se subió desde el panel)."
              : "Todavía no tiene animación."}
        </p>
      </div>
    </section>
  );
}

function Dropzone({
  label,
  accept,
  hint,
  current,
  currentUrl,
  busy,
  disabledReason,
  onFile,
  onRemove,
}: {
  label: string;
  accept: string;
  hint: string;
  current: string | null;
  currentUrl: string | null;
  busy?: File;
  disabledReason?: string;
  onFile: (file: File) => void;
  onRemove?: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const disabled = !!disabledReason || !!busy;

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && !disabled) onFile(file);
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-text text-sm font-semibold">{label}</span>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "flex min-h-[120px] flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed px-4 py-5 text-center transition-colors",
          dragging ? "border-primary bg-primary-light" : "border-fill-dark bg-background",
          disabledReason && "opacity-60",
        )}
      >
        {busy ? (
          <>
            <span
              className="border-primary/20 border-t-primary h-6 w-6 animate-spin rounded-full border-[3px]"
              aria-hidden
            />
            <p className="text-text text-sm font-semibold">Subiendo {busy.name}…</p>
            <p className="text-text-muted text-xs">{formatBytes(busy.size)}</p>
          </>
        ) : disabledReason ? (
          <p className="text-text-muted text-sm">{disabledReason}</p>
        ) : (
          <>
            {current && (
              <p className="text-text font-mono text-xs break-all">
                {current}
                {currentUrl && (
                  <>
                    {" · "}
                    <a
                      href={currentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-text-muted font-sans underline underline-offset-2"
                    >
                      descargar
                    </a>
                  </>
                )}
              </p>
            )}
            <p className="text-text text-sm font-semibold">
              {current ? "Reemplazar: arrastrá" : "Arrastrá"} un archivo o{" "}
              <button
                onClick={() => input.current?.click()}
                className="text-primary-dark underline underline-offset-2"
              >
                elegilo
              </button>
            </p>
            <p className="text-text-muted text-xs">{hint}</p>
            {onRemove && (
              <button
                onClick={onRemove}
                className="text-danger mt-1 text-xs font-semibold underline underline-offset-2"
              >
                Quitar video lateral
              </button>
            )}
          </>
        )}
        <input
          ref={input}
          type="file"
          accept={accept}
          className="hidden"
          aria-label={`Archivo: ${label}`}
          disabled={disabled}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFile(file);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}
