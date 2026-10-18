"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { Icon } from "@/components/dashboard/icons";
import { headerChip } from "@/components/dashboard/ui";
import {
  formatRange,
  matchPreset,
  MAX_RANGE_DAYS,
  RANGE_PRESETS,
  toISODate,
  validateRange,
  type DateRange,
} from "@/lib/date-range";
import { cn } from "@/lib/utils";

const dateInput =
  "border-border bg-surface text-text focus:border-primary w-full rounded-xl border px-3 py-2 text-sm font-bold outline-none";

/**
 * Period picker: presets as rows (the common case is one click) and a custom "Desde / Hasta"
 * range below a hairline. The chip names the preset, or the dates for a custom range.
 */
export function PeriodSelect({
  value,
  onChange,
}: {
  value: DateRange;
  onChange: (range: DateRange) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const fromId = useId();
  const toId = useId();
  const today = toISODate(new Date());
  const preset = matchPreset(value);

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
      setDraft(value);
      setError(null);
    }
    setOpen((o) => !o);
  };

  const pick = (range: DateRange) => {
    onChange(range);
    setOpen(false);
  };

  const apply = (e: FormEvent) => {
    e.preventDefault();
    const problem = validateRange(draft);
    if (problem) setError(problem);
    else pick(draft);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={`Período: ${preset?.label ?? formatRange(value)}`}
        onClick={toggle}
        className={cn(
          headerChip,
          "bg-primary-light text-primary-dark cursor-pointer transition-shadow hover:shadow-sm",
        )}
      >
        <Icon name="calendar" className="size-4" />
        <span>{preset?.label ?? formatRange(value)}</span>
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
          className="border-border bg-surface dash-card-enter absolute right-0 z-30 mt-2 flex w-[min(18rem,calc(100vw-2rem))] flex-col rounded-2xl border p-1.5 shadow-lg"
        >
          <ul className="flex flex-col gap-0.5">
            {RANGE_PRESETS.map((p) => {
              const selected = preset?.key === p.key;
              return (
                <li key={p.key}>
                  <button
                    type="button"
                    aria-pressed={selected}
                    onClick={() => pick(p.range(new Date()))}
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
                  type="date"
                  value={draft.from}
                  max={draft.to || today}
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
                  type="date"
                  value={draft.to}
                  min={draft.from || undefined}
                  max={today}
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
