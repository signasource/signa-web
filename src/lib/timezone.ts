/** Buenos Aires timezone (UTC-3, no daylight saving). */
export const ARGENTINA_TIMEZONE = "America/Argentina/Buenos_Aires";

/** Argentina's fixed offset (UTC−3 all year): its midnight is 03:00 UTC. */
const ARGENTINA_MIDNIGHT_UTC_MS = 3 * 3_600_000;

/**
 * Start (epoch ms) of the time bucket that contains `ms`, with buckets laid from Argentine midnight
 * — the same origin the API's series use (`MetricsRange.BUCKET_ORIGIN_SECONDS`). A day bucket is
 * then an Argentine calendar day; flooring to UTC midnight instead shows each day under the
 * previous date (UTC midnight is 21:00 of the day before in Argentina). Hour and minute buckets
 * are unaffected.
 */
export function argentinaBucketStart(ms: number, bucketMs: number): number {
  return (
    Math.floor((ms - ARGENTINA_MIDNIGHT_UTC_MS) / bucketMs) * bucketMs + ARGENTINA_MIDNIGHT_UTC_MS
  );
}

/**
 * Epoch ms of a series point's time: an ISO instant as is, a bare `YYYY-MM-DD` (an Argentine
 * calendar day from the API) as that day's midnight in Argentina. `new Date("2026-11-20")` would
 * read it as UTC midnight, i.e. the 19th at 21:00 in Argentina.
 */
export function seriesPointMs(t: string): number {
  return /^\d{4}-\d{2}-\d{2}$/.test(t) ? Date.parse(`${t}T00:00:00-03:00`) : Date.parse(t);
}
