/**
 * 0→1 progress of an element through the viewport, for `[data-progress]` effects on the landing:
 * 0 while its top edge is below 85% of the viewport height, 1 once it has risen to 35%.
 */
export function elementProgress(top: number, viewportHeight: number): number {
  if (viewportHeight <= 0) return 1;
  const p = (viewportHeight * 0.85 - top) / (viewportHeight * 0.5);
  return Math.min(1, Math.max(0, p));
}
