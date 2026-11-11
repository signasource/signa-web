/**
 * Datetime-range helpers for the admin usage dashboard. Unlike the organization dashboard's
 * {@link import("./date-range")} (calendar days), this keeps hour/minute precision so the single
 * picker can drive both the business panels and the Prometheus-backed performance panels.
 *
 * A {@link DateTimeRange} is a pair of ISO-8601 **instant** strings (UTC, e.g. `2026-11-05T13:30:00.000Z`),
 * which is exactly what the API expects for `from`/`to`.
 */

export type DateTimeRange = { from: string; to: string };

/** The dashboard selection: a rolling preset (recomputed from "now") or a fixed custom window. */
export type RangeSelection =
  { kind: "preset"; key: string } | { kind: "custom"; from: string; to: string };

export type RangePreset = { key: string; label: string; minutes: number };

/** Longest window the API accepts (inclusive days), mirroring the backend's MetricsRange cap. */
export const MAX_RANGE_DAYS = 366;
const MINUTE_MS = 60_000;

export const RANGE_PRESETS: RangePreset[] = [
  { key: "15m", label: "Últimos 15 minutos", minutes: 15 },
  { key: "1h", label: "Última hora", minutes: 60 },
  { key: "4h", label: "Últimas 4 horas", minutes: 4 * 60 },
  { key: "24h", label: "Últimas 24 horas", minutes: 24 * 60 },
  { key: "7d", label: "Últimos 7 días", minutes: 7 * 24 * 60 },
  { key: "30d", label: "Últimos 30 días", minutes: 30 * 24 * 60 },
];

export const DEFAULT_SELECTION: RangeSelection = { kind: "preset", key: "24h" };

function presetByKey(key: string): RangePreset | undefined {
  return RANGE_PRESETS.find((p) => p.key === key);
}

/** The rolling window for a preset, ending at {@code now}. */
export function presetRange(minutes: number, now: Date = new Date()): DateTimeRange {
  return {
    from: new Date(now.getTime() - minutes * MINUTE_MS).toISOString(),
    to: now.toISOString(),
  };
}

/** Resolves a selection to concrete instants; presets are anchored to {@code now}. */
export function resolveRange(selection: RangeSelection, now: Date = new Date()): DateTimeRange {
  if (selection.kind === "custom") return { from: selection.from, to: selection.to };
  const preset = presetByKey(selection.key) ?? RANGE_PRESETS[3]!;
  return presetRange(preset.minutes, now);
}

/** Span of the range in seconds (0 when either bound is invalid). */
export function spanSeconds(range: DateTimeRange): number {
  const from = Date.parse(range.from);
  const to = Date.parse(range.to);
  if (Number.isNaN(from) || Number.isNaN(to)) return 0;
  return Math.max(0, Math.round((to - from) / 1000));
}

/**
 * A resolution that keeps a line chart readable: aim for ~120 points, never finer than 15s (the
 * scrape interval is 60s, so sub-15s is pointless) and snapped to a "nice" step. The backend
 * clamps too, so this is only a hint.
 */
export function deriveStepSeconds(range: DateTimeRange): number {
  const target = spanSeconds(range) / 120;
  // Never finer than 15 s (Prometheus scrape interval; the backend clamps too).
  const nice = [15, 30, 60, 120, 300, 600, 900, 1800, 3600, 7200, 21600, 43200, 86400];
  return nice.find((s) => s >= target) ?? nice[nice.length - 1]!;
}

/** Why a custom range cannot be requested, in UI copy; `null` when it is valid. */
export function validateRange(range: DateTimeRange, now: Date = new Date()): string | null {
  const from = Date.parse(range.from);
  const to = Date.parse(range.to);
  if (Number.isNaN(from) || Number.isNaN(to)) return "Elegí una fecha y hora de inicio y de fin.";
  if (from >= to) return "El inicio tiene que ser anterior al fin.";
  if (to > now.getTime() + MINUTE_MS) return "El fin no puede ser posterior a ahora.";
  if (to - from > MAX_RANGE_DAYS * 24 * 60 * MINUTE_MS)
    return `El período puede abarcar hasta ${MAX_RANGE_DAYS} días.`;
  return null;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** ISO instant → the `YYYY-MM-DDTHH:mm` local value an `<input type="datetime-local">` expects. */
export function isoToLocalInput(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** `YYYY-MM-DDTHH:mm` local input → ISO instant (UTC), or "" when unparseable. */
export function localInputToIso(local: string): string {
  const d = new Date(local);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString();
}

const DATETIME_FMT = new Intl.DateTimeFormat("es-AR", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

/** Chip text: the preset name, or the formatted bounds for a custom range. */
export function selectionLabel(selection: RangeSelection): string {
  if (selection.kind === "preset") return presetByKey(selection.key)?.label ?? "Período";
  return `${DATETIME_FMT.format(new Date(selection.from))} – ${DATETIME_FMT.format(new Date(selection.to))}`;
}
