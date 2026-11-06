"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";

export type TabItem<K extends string> = { key: K; label: string };

/**
 * Accessible horizontal tablist for the usage dashboard apartados. Roving focus with arrow keys; the
 * caller owns the active key (kept in the URL so an admin can bookmark their apartado).
 */
export function MetricsTabs<K extends string>({
  tabs,
  active,
  onChange,
  idBase,
}: {
  tabs: TabItem<K>[];
  active: K;
  onChange: (key: K) => void;
  idBase: string;
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
    <div
      role="tablist"
      aria-label="Apartados de métricas"
      className="border-border flex flex-wrap gap-1 border-b"
    >
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
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
