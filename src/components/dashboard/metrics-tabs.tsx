"use client";

import { useRef, type ReactNode } from "react";
import type { MetricTone } from "@/components/dashboard/metric-catalog";
import { cn } from "@/lib/utils";

/** A tab; `dot` flags the apartado's health (warning/danger/success) next to its name. */
export type TabItem<K extends string> = { key: K; label: string; dot?: MetricTone };

const DOT: Record<MetricTone, string> = {
  success: "bg-success",
  warning: "bg-streak-orange",
  danger: "bg-danger",
  neutral: "",
};
const DOT_LABEL: Record<MetricTone, string> = {
  success: "en orden",
  warning: "requiere atención",
  danger: "con problemas",
  neutral: "",
};

/**
 * Accessible horizontal tablist for the usage dashboard apartados. Roving focus with arrow keys; the
 * caller owns the active key (kept in the URL so an admin can bookmark their apartado).
 */
export function MetricsTabs<K extends string>({
  tabs,
  active,
  onChange,
  idBase,
  trailing,
}: {
  tabs: TabItem<K>[];
  active: K;
  onChange: (key: K) => void;
  idBase: string;
  /** Content aligned to the right of the tab row (e.g. the comparison caption). */
  trailing?: ReactNode;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (e: React.KeyboardEvent, index: number) => {
    const delta = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (delta === 0) return;
    e.preventDefault();
    const next = (index + delta + tabs.length) % tabs.length;
    const tab = tabs[next];
    if (!tab) return;
    onChange(tab.key);
    refs.current[next]?.focus();
  };

  return (
    <div className="border-border flex flex-wrap items-center gap-x-4 gap-y-1 border-b">
      <div role="tablist" aria-label="Apartados de métricas" className="flex flex-wrap gap-1">
        {tabs.map((tab, i) => {
          const selected = tab.key === active;
          return (
            <button
              key={tab.key}
              ref={(el) => {
                refs.current[i] = el;
              }}
              role="tab"
              type="button"
              id={`${idBase}-tab-${tab.key}`}
              aria-selected={selected}
              aria-controls={`${idBase}-panel-${tab.key}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(tab.key)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={cn(
                "relative -mb-px cursor-pointer px-4 py-2.5 text-sm font-bold whitespace-nowrap transition-colors",
                selected
                  ? "text-primary border-primary border-b-2"
                  : "text-text-muted hover:text-text border-b-2 border-transparent",
              )}
            >
              <span className="inline-flex items-center gap-2">
                {tab.label}
                {tab.dot && tab.dot !== "neutral" ? (
                  <span className={cn("size-[7px] rounded-full", DOT[tab.dot])} aria-hidden />
                ) : null}
                {tab.dot && tab.dot !== "neutral" ? (
                  <span className="sr-only">({DOT_LABEL[tab.dot]})</span>
                ) : null}
              </span>
            </button>
          );
        })}
      </div>
      {trailing ? <div className="ml-auto py-2">{trailing}</div> : null}
    </div>
  );
}
