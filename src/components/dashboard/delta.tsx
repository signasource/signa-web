import { cn } from "@/lib/utils";

/**
 * How to express the change vs. the previous window: `pct` is a relative percentage change (counts,
 * money), `pp` the absolute difference in percentage points (rates), `abs` the absolute difference
 * in the metric's own unit (e.g. "12 ms", "0m 18s") — rendered with `format`.
 */
export type DeltaMode = "pct" | "pp" | "abs";

/** Which direction is good news: `up` (more users), `down` (latency, refunds) or `neutral`. */
export type DeltaGood = "up" | "down" | "neutral";

export type DeltaOptions = {
  mode?: DeltaMode;
  good?: DeltaGood;
  /** Decimals for `pct`/`pp` (default 1). */
  decimals?: number;
  /** Formats the absolute difference for `abs` mode. */
  format?: (absDiff: number) => string;
};

export type DeltaDirection = "up" | "down" | "flat" | "new";
export type DeltaTone = "good" | "bad" | "neutral";

export type DeltaResult = {
  direction: DeltaDirection;
  tone: DeltaTone;
  /** Signed change (percent, pp or unit), or `null` when there is no comparable previous value. */
  change: number | null;
  /** Text without the arrow: "18,2%", "2,0 pp", "12 ms", "nuevo". Empty when not comparable. */
  label: string;
};

function fixed(value: number, decimals: number): string {
  return value.toLocaleString("es-AR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Period-over-period change vs. the previous equal-length window. A `null` previous (the whole
 * history, or no data yet) is not comparable. A zero previous with a positive current reads as
 * "nuevo" in relative mode instead of a divide-by-zero spike.
 */
export function computeDelta(
  current: number,
  previous: number | null | undefined,
  { mode = "pct", good = "up", decimals = 1, format }: DeltaOptions = {},
): DeltaResult {
  if (previous == null || !Number.isFinite(previous) || !Number.isFinite(current))
    return { direction: "flat", tone: "neutral", change: null, label: "" };

  let change: number;
  let label: string;
  if (mode === "pct") {
    if (previous === 0) {
      return current > 0
        ? { direction: "new", tone: good === "down" ? "bad" : "good", change: null, label: "nuevo" }
        : { direction: "flat", tone: "neutral", change: 0, label: `${fixed(0, decimals)}%` };
    }
    const factor = 10 ** decimals;
    change = Math.round(((current - previous) / Math.abs(previous)) * 100 * factor) / factor;
    label = `${fixed(Math.abs(change), decimals)}%`;
  } else if (mode === "pp") {
    const factor = 10 ** decimals;
    change = Math.round((current - previous) * factor) / factor;
    label = `${fixed(Math.abs(change), decimals)} pp`;
  } else {
    change = current - previous;
    label = format ? format(Math.abs(change)) : fixed(Math.abs(change), decimals);
  }

  const direction: DeltaDirection = change > 0 ? "up" : change < 0 ? "down" : "flat";
  const tone: DeltaTone =
    direction === "flat" || good === "neutral" ? "neutral" : direction === good ? "good" : "bad";
  return { direction, tone, change, label };
}

const ARROW: Record<DeltaDirection, string> = { up: "▲", down: "▼", flat: "=", new: "▲" };

const TONE_TEXT: Record<DeltaTone, string> = {
  good: "text-success-dark",
  bad: "text-danger",
  neutral: "text-text-muted",
};

const TONE_PILL: Record<DeltaTone, string> = {
  good: "bg-success-light text-success-dark",
  bad: "bg-danger-light text-danger",
  neutral: "bg-fill text-text-muted",
};

type DeltaProps = DeltaOptions & { current: number; previous: number | null | undefined };

/** A coloured badge "▲ 18,2%" for the KPI cards; renders nothing when not comparable. */
export function DeltaPill({ current, previous, ...options }: DeltaProps) {
  const d = computeDelta(current, previous, options);
  if (!d.label) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-[7px] py-0.5 text-xs font-extrabold whitespace-nowrap",
        TONE_PILL[d.tone],
      )}
    >
      <span aria-hidden="true" className="text-[9px]">
        {ARROW[d.direction]}
      </span>
      {d.label}
      <span className="sr-only"> vs. período anterior</span>
    </span>
  );
}

/** The same change as plain coloured text ("▲ 6,2%"), for compact stat rows. */
export function DeltaText({ current, previous, ...options }: DeltaProps) {
  const d = computeDelta(current, previous, options);
  if (!d.label) return null;
  return (
    <span className={cn("text-xs font-bold whitespace-nowrap", TONE_TEXT[d.tone])}>
      <span aria-hidden="true" className="text-[9px]">
        {ARROW[d.direction]}
      </span>{" "}
      {d.label}
      <span className="sr-only"> vs. período anterior</span>
    </span>
  );
}
