import { cn } from "@/lib/utils";

export type DeltaTone = "up" | "down" | "flat" | "new";

export type DeltaResult = {
  tone: DeltaTone;
  /** Signed percentage change, or `null` when there's no comparable previous value. */
  changePercent: number | null;
  /** Short label for a pill: "+12.3%", "−4%", "nuevo", or "—". */
  label: string;
};

/**
 * How to express the change: `pct` is a relative percentage change (for counts/money), `pp` is the
 * absolute difference in percentage points (for rates — the dashboard compares percentages in pp).
 */
export type DeltaMode = "pct" | "pp";

/**
 * Period-over-period change vs. the previous equal-length window. A `null` previous (the whole
 * history, which has no comparable prior span) yields a neutral "—". A zero previous with a positive
 * current reads as "nuevo" rather than a divide-by-zero spike (relative mode only).
 */
export function computeDelta(
  current: number,
  previous: number | null,
  mode: DeltaMode = "pct",
): DeltaResult {
  if (previous == null) return { tone: "flat", changePercent: null, label: "—" };
  if (mode === "pp") {
    const diff = Math.round((current - previous) * 10) / 10;
    const tone: DeltaTone = diff > 0 ? "up" : diff < 0 ? "down" : "flat";
    return { tone, changePercent: diff, label: `${diff > 0 ? "+" : ""}${diff} pp` };
  }
  if (previous === 0) {
    return current > 0
      ? { tone: "new", changePercent: null, label: "nuevo" }
      : { tone: "flat", changePercent: 0, label: "—" };
  }
  const change = Math.round(((current - previous) / previous) * 1000) / 10;
  const tone: DeltaTone = change > 0 ? "up" : change < 0 ? "down" : "flat";
  return { tone, changePercent: change, label: `${change > 0 ? "+" : ""}${change}%` };
}

const TONE_TEXT: Record<DeltaTone, string> = {
  up: "text-success-dark",
  down: "text-danger",
  flat: "text-text-muted",
  new: "text-success-dark",
};

const TONE_PILL: Record<DeltaTone, string> = {
  up: "bg-success-light text-success-dark",
  down: "bg-danger-light text-danger",
  flat: "bg-fill text-text-muted",
  new: "bg-success-light text-success-dark",
};

/**
 * Inline "+X% vs. período anterior" caption, coloured by direction. Renders nothing for the whole
 * history (no comparison available).
 */
export function Delta({
  current,
  previous,
  mode = "pct",
}: {
  current: number;
  previous: number | null;
  mode?: DeltaMode;
}) {
  const d = computeDelta(current, previous, mode);
  if (d.changePercent == null && d.tone !== "new") return null;
  return (
    <span className={cn("text-xs font-bold", TONE_TEXT[d.tone])}>
      {d.tone === "new" ? "nuevo" : `${d.label} vs. período anterior`}
    </span>
  );
}

/** A compact delta pill for the KPI cards (value + coloured badge). */
export function DeltaPill({
  current,
  previous,
  mode = "pct",
}: {
  current: number;
  previous: number | null;
  mode?: DeltaMode;
}) {
  const d = computeDelta(current, previous, mode);
  if (d.changePercent == null && d.tone !== "new") return null;
  return (
    <span className={cn("rounded-full px-[7px] py-0.5 text-xs font-extrabold", TONE_PILL[d.tone])}>
      {d.label}
    </span>
  );
}
