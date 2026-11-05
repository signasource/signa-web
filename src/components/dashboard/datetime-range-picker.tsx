"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { Icon } from "@/components/dashboard/icons";
import { headerChip } from "@/components/dashboard/ui";
import {
  DEFAULT_SELECTION,
  isoToLocalInput,
  localInputToIso,
  MAX_RANGE_DAYS,
  RANGE_PRESETS,
  resolveRange,
  selectionLabel,
  validateRange,
  type RangeSelection,
} from "@/lib/datetime-range";
import { cn } from "@/lib/utils";

const dateInput =
  "border-border bg-surface text-text focus:border-primary w-full rounded-xl border px-3 py-2 text-sm font-bold outline-none";

/**
 * Datetime range picker for the usage dashboard: rolling presets as rows (the common case) and a
 * custom "Desde / Hasta" with hour/minute precision (`datetime-local`) below a hairline. The chip
 * names the preset or the formatted custom bounds.
 */
export function DatetimeRangePicker({
  value,
  onChange,
}: {
  value: RangeSelection;
  onChange: (selection: RangeSelection) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(() => toDraft(value));
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const fromId = useId();
  const toId = useId();
  const label = selectionLabel(value);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (
        e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)
      )
        setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  const toggle = () => {
    if (!open) {
      setDraft(toDraft(value));
      setError(null);
    }
    setOpen((o) => !o);
  };

  const pick = (selection: RangeSelection) => {
    onChange(selection);
    setOpen(false);
  };

  const apply = (e: FormEvent) => {
    e.preventDefault();
    const range = { from: localInputToIso(draft.from), to: localInputToIso(draft.to) };
    const problem = validateRange(range);
    if (problem) setError(problem);
    else pick({ kind: "custom", from: range.from, to: range.to });
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={`Período: ${label}`}
        onClick={toggle}
        className={cn(
          headerChip,
          "bg-primary-light text-primary-dark cursor-pointer transition-shadow hover:shadow-sm",
        )}
      >
        <Icon name="calendar" className="size-4" />
        <span>{label}</span>
        <Icon
          name="chevronDown"
          className={cn("size-3.5 transition-transform", open && "rotate-180")}
        />
      </button>
      {open ? (
        <div
          id={panelId}
          role="dialog"
          aria-label="Elegir período"
          className="border-border bg-surface dash-card-enter absolute right-0 z-30 mt-2 flex w-[min(20rem,calc(100vw-2rem))] flex-col rounded-2xl border p-1.5 shadow-lg"
        >
          <ul className="flex flex-col gap-0.5">
            {RANGE_PRESETS.map((p) => {
              const selected = value.kind === "preset" && value.key === p.key;
              return (
                <li key={p.key}>
                  <button
                    type="button"
                    aria-pressed={selected}
                    onClick={() => pick({ kind: "preset", key: p.key })}
                    className={cn(
                      "flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-bold transition-colors",
                      selected ? "bg-primary-light text-primary-dark" : "hover:bg-fill text-text",
                    )}
                  >
                    {p.label}
                    {selected ? <Icon name="check" className="size-4" /> : null}
                  </button>
                </li>
              );
            })}
          </ul>
          <form
            onSubmit={apply}
            noValidate
            className="border-fill mt-1.5 flex flex-col gap-2.5 border-t px-1.5 pt-3 pb-1.5"
          >
            <p className="text-text-muted text-xs font-extrabold tracking-wider uppercase">
              Personalizado
            </p>
            <div className="grid grid-cols-2 gap-2">
              <label htmlFor={fromId} className="flex flex-col gap-1 text-xs font-bold">
                Desde
                <input
                  id={fromId}
                  type="datetime-local"
                  value={draft.from}
                  onChange={(e) => {
                    setDraft((d) => ({ ...d, from: e.target.value }));
                    setError(null);
                  }}
                  className={dateInput}
                />
              </label>
              <label htmlFor={toId} className="flex flex-col gap-1 text-xs font-bold">
                Hasta
                <input
                  id={toId}
                  type="datetime-local"
                  value={draft.to}
                  onChange={(e) => {
                    setDraft((d) => ({ ...d, to: e.target.value }));
                    setError(null);
                  }}
                  className={dateInput}
                />
              </label>
            </div>
            {error ? (
              <p role="alert" className="text-danger text-[13px] font-bold">
                {error}
              </p>
            ) : (
              <p className="text-text-muted text-[13px]">Hasta {MAX_RANGE_DAYS} días.</p>
            )}
            <button
              type="submit"
              className="bg-text text-on-dark cursor-pointer rounded-xl px-4 py-2.5 text-sm font-bold transition-opacity hover:opacity-90"
            >
              Aplicar
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}

/** Seeds the custom inputs from the current selection (resolving a preset to its current window). */
function toDraft(selection: RangeSelection): { from: string; to: string } {
  const range = resolveRange(selection);
  return { from: isoToLocalInput(range.from), to: isoToLocalInput(range.to) };
}

export { DEFAULT_SELECTION };
