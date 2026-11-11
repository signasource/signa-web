"use client";

import { cn } from "@/lib/utils";

/** Line vs bar for a time-series widget. Each chart owns its own choice (no global toggle). */
export type ChartKind = "line" | "bar";

/** Small per-widget "Línea / Barras" switch, shown in a chart card's header. */
export function ChartKindToggle({
  kind,
  onChange,
  className,
}: {
  kind: ChartKind;
  onChange: (kind: ChartKind) => void;
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label="Tipo de gráfico"
      className={cn(
        "border-border flex h-7 shrink-0 items-center rounded-full border p-0.5 text-[11px] font-extrabold",
        className,
      )}
    >
      {(["line", "bar"] as const).map((k) => (
        <button
          key={k}
          type="button"
          onClick={() => onChange(k)}
          aria-pressed={kind === k}
          className={cn(
            "h-6 cursor-pointer rounded-full px-2 transition-colors",
            kind === k ? "bg-primary-light text-primary-dark" : "text-text-muted",
          )}
        >
          {k === "line" ? "Línea" : "Barras"}
        </button>
      ))}
    </div>
  );
}
