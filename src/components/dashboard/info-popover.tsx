"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/components/dashboard/icons";
import { METRICS, type MetricId } from "@/components/dashboard/metric-catalog";
import { cn } from "@/lib/utils";

const PANEL_WIDTH = 320; // px; matches the clamp below

/**
 * Small "i" button that reveals a metric's definition: what it is, how it's computed and what a
 * healthy value looks like. Every widget on the usage dashboard carries one so it can be understood
 * without prior context.
 *
 * The panel is rendered in a portal with fixed positioning, not `absolute` inside the card: the
 * dashboard cards each establish their own stacking context (the `dash-card-enter` transform
 * persists), so an in-card absolute panel would be painted behind later cards regardless of z-index.
 */
export function InfoPopover({ metric, className }: { metric: MetricId; className?: string }) {
  const def = METRICS[metric];
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  // Position the panel under the button, right-aligned, clamped to the viewport. When there isn't
  // enough room below (a widget near the bottom of the page), flip it above the button so it's never
  // cut off. The panel height is only known after it mounts, so re-measure on the next frame.
  useLayoutEffect(() => {
    if (!open || !btnRef.current) return;
    const place = () => {
      const btn = btnRef.current;
      if (!btn) return;
      const r = btn.getBoundingClientRect();
      const left = Math.max(
        8,
        Math.min(r.right - PANEL_WIDTH, window.innerWidth - PANEL_WIDTH - 8),
      );
      const margin = 8;
      const panelHeight = panelRef.current?.offsetHeight ?? 0;
      const spaceBelow = window.innerHeight - r.bottom - margin;
      const spaceAbove = r.top - margin;
      const flipAbove = panelHeight > spaceBelow && spaceAbove > spaceBelow;
      const top = flipAbove ? Math.max(margin, r.top - panelHeight - 6) : r.bottom + 6;
      setPos({ top, left });
    };
    place();
    const raf = requestAnimationFrame(place);
    return () => cancelAnimationFrame(raf);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (e instanceof KeyboardEvent) {
        if (e.key === "Escape") setOpen(false);
        return;
      }
      const t = e.target as Node;
      if (!btnRef.current?.contains(t) && !panelRef.current?.contains(t)) setOpen(false);
    };
    // Position is captured on open; close on scroll/resize rather than chase it.
    const dismiss = () => setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    window.addEventListener("scroll", dismiss, true);
    window.addEventListener("resize", dismiss);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
      window.removeEventListener("scroll", dismiss, true);
      window.removeEventListener("resize", dismiss);
    };
  }, [open]);

  return (
    <span className={cn("inline-flex", className)}>
      <button
        ref={btnRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={`Qué es «${def.label}»`}
        onClick={() => setOpen((o) => !o)}
        className="text-text-muted hover:text-text focus-visible:text-text cursor-pointer transition-colors"
      >
        <Icon name="info" className="size-4" />
      </button>
      {open && pos && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={panelRef}
              id={panelId}
              role="dialog"
              aria-label={def.label}
              style={{
                position: "fixed",
                top: pos.top,
                left: pos.left,
                width: PANEL_WIDTH,
                maxHeight: "calc(100vh - 1rem)",
              }}
              className="border-border bg-surface dash-card-enter z-[100] flex max-w-[calc(100vw-1rem)] flex-col gap-2 overflow-y-auto rounded-2xl border p-4 text-left shadow-lg"
            >
              <p className="font-display text-sm font-bold tracking-tight">{def.label}</p>
              <p className="text-text text-[13px] leading-relaxed">{def.description}</p>
              <dl className="flex flex-col gap-1.5 text-[12px]">
                <div>
                  <dt className="text-text-muted font-extrabold tracking-wider uppercase">
                    Cómo se calcula
                  </dt>
                  <dd className="text-text-muted mt-0.5 leading-relaxed">{def.howComputed}</dd>
                </div>
                <div>
                  <dt className="text-text-muted font-extrabold tracking-wider uppercase">
                    Qué es sano
                  </dt>
                  <dd className="text-text-muted mt-0.5 leading-relaxed">{def.goodWhen}</dd>
                </div>
              </dl>
            </div>,
            document.body,
          )
        : null}
    </span>
  );
}
