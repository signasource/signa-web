import type { AdminSign, AnimationFormat } from "@/lib/api/admin";
import { formatAgo } from "@/lib/sign-editor";
import { cn } from "@/lib/utils";

export const FORMAT_TINT: Record<AnimationFormat | "none", string> = {
  glb: "bg-primary-light",
  mp4: "bg-avatar-blue-light",
  none: "bg-fill",
};

export function FormatBadge({ format }: { format: AnimationFormat | null }) {
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-0.5 font-mono text-[11px] font-bold",
        format === "glb" && "bg-ink-900 text-primary-light",
        format === "mp4" && "bg-gems-blue-dark text-on-dark",
        !format && "bg-danger-light text-danger",
      )}
    >
      {format === "glb" ? "GLB · 3D" : format === "mp4" ? "MP4 · video" : "Sin animación"}
    </span>
  );
}

export function SignCard({ sign, onOpen }: { sign: AdminSign; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group border-border hover:border-text flex flex-col overflow-hidden rounded-xl border bg-white text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(36,26,22,.14)]"
    >
      <div
        className={cn(
          "flex w-full flex-col gap-3 p-4 pb-3.5",
          FORMAT_TINT[sign.animationFormat ?? "none"],
        )}
      >
        <div className="flex items-center gap-2">
          <FormatBadge format={sign.animationFormat} />
          {sign.openReports > 0 && (
            <span className="bg-danger rounded-full px-2 py-0.5 text-[11px] font-bold text-white">
              {sign.openReports} reporte{sign.openReports !== 1 ? "s" : ""}
            </span>
          )}
          <span className="border-text/10 group-hover:bg-text text-text ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border bg-white transition-colors group-hover:text-white">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M4 20h4L19 9a2.8 2.8 0 00-4-4L4 16v4z" />
              <path d="M13.5 6.5l4 4" />
            </svg>
          </span>
        </div>
        <h3 className="font-display text-text text-[26px] leading-[1.08] font-bold break-words">
          {sign.meaning}
        </h3>
        <span className="text-text flex items-center gap-1.5 text-sm font-semibold opacity-0 transition-opacity group-hover:opacity-100">
          Editar seña
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </span>
      </div>
      <div className="flex w-full flex-1 flex-col gap-3.5 p-4">
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              [sign.lessonCount, "Lecciones"],
              [sign.handedness === "TWO_HANDED" ? "2" : "1", "Manos"],
              [sign.hasYoutube ? "Sí" : "No", "YouTube"],
            ] as const
          ).map(([value, label]) => (
            <div key={label}>
              <p className="font-display text-text text-xl font-bold">{value}</p>
              <p className="text-text-muted mt-0.5 text-[10px] font-semibold tracking-wide uppercase">
                {label}
              </p>
            </div>
          ))}
        </div>
        <div className="border-border text-text-muted mt-auto border-t pt-3 text-xs">
          {sign.animationUpdatedAt
            ? `Animación subida ${formatAgo(sign.animationUpdatedAt)}`
            : sign.animationFormat
              ? "Animación original del catálogo"
              : "Todavía no tiene animación"}
        </div>
      </div>
    </button>
  );
}
