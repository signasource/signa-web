export function elementProgress(top: number, viewportHeight: number): number {
  if (viewportHeight <= 0) return 1;
  const p = (viewportHeight * 0.85 - top) / (viewportHeight * 0.5);
  return Math.min(1, Math.max(0, p));
}
