"use client";

import { useState } from "react";
import type { AnimationFormat, SignView } from "@/lib/api/admin";
import { cn } from "@/lib/utils";

/**
 * The sign's animation inside a phone frame, laid out like the app's "Presentar seña" block, so the
 * admin sees what learners will see. An MP4 plays as a looping muted video (as in the app), with a
 * Frente/Lateral switch when it has a side view; a GLB loads in the URL-based model-viewer iframe.
 * `missing`: the sign points at a file that does not exist (nothing shows in the app).
 */
export function SignMediaPreview({
  meaning,
  format,
  url,
  lateralUrl = null,
  missing = false,
  className,
}: {
  meaning: string;
  format: AnimationFormat | null;
  url: string | null;
  lateralUrl?: string | null;
  missing?: boolean;
  className?: string;
}) {
  const [view, setView] = useState<SignView>("front");
  const hasLateral = format === "mp4" && !!lateralUrl;
  const shown = hasLateral && view === "lateral" ? lateralUrl : url;

  return (
    <figure
      className={cn(
        "bg-ink-900 mx-auto flex w-[264px] flex-col rounded-[34px] p-2.5 shadow-[0_18px_40px_rgba(30,23,20,.22)]",
        className,
      )}
    >
      <div className="bg-background flex flex-col gap-3 overflow-hidden rounded-[26px] px-3.5 pt-3 pb-5">
        <div className="bg-ink-900 mx-auto h-1.5 w-16 rounded-full opacity-80" aria-hidden />
        <span className="text-text-muted text-[10px] font-bold tracking-widest uppercase">
          Nueva seña
        </span>
        <div className="border-border bg-fill relative h-[300px] overflow-hidden rounded-3xl border">
          <span className="text-text-muted absolute top-2.5 left-2.5 z-10 rounded-lg bg-white/95 px-2 py-0.5 text-[10px] font-semibold">
            animación LSA
          </span>
          {hasLateral && (
            <div
              className="absolute top-2 right-2 z-10 flex gap-0.5 rounded-lg bg-white/95 p-0.5"
              role="tablist"
              aria-label="Vista del video"
            >
              {(
                [
                  ["front", "Frente"],
                  ["lateral", "Lateral"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  role="tab"
                  aria-selected={view === key}
                  onClick={() => setView(key)}
                  className={cn(
                    "rounded-md px-2 py-0.5 text-[10px] font-bold",
                    view === key ? "bg-text text-on-dark" : "text-text-muted",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
          {missing ? (
            <div className="text-text-muted flex h-full flex-col items-center justify-center gap-2 px-6 text-center text-sm">
              <span className="font-display text-danger text-base font-bold">Falta el archivo</span>
              La seña apunta a un archivo que no existe: en la app no se ve nada. Subí uno.
            </div>
          ) : format === "mp4" && shown ? (
            <video
              key={shown}
              src={shown}
              autoPlay
              loop
              muted
              playsInline
              controls
              aria-label={`Video ${hasLateral && view === "lateral" ? "lateral" : "de frente"} de la seña ${meaning}`}
              className="h-full w-full object-contain"
            />
          ) : format === "glb" && url ? (
            <iframe
              key={url}
              src={`/api/glb-viewer/file?src=${encodeURIComponent(url)}`}
              title={`Animación 3D de la seña ${meaning}`}
              className="h-full w-full border-0"
            />
          ) : (
            <div className="text-text-muted flex h-full flex-col items-center justify-center gap-2 px-6 text-center text-sm">
              <span className="font-display text-text text-base font-bold">Sin animación</span>
              Subí un .glb o un .mp4 para que la seña se vea en la app.
            </div>
          )}
        </div>
        <figcaption className="font-display text-text text-center text-[26px] leading-tight font-bold break-words">
          {meaning || "—"}
        </figcaption>
      </div>
    </figure>
  );
}
