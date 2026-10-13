export const MIN_FPS = 1.5;
const WARMUP_MS = 5000;
const WINDOW_MS = 8000;

export class SpeedCheck {
  private since = Infinity;
  private results: number[] = [];

  restart(now: number): void {
    this.since = now + WARMUP_MS;
    this.results = [];
  }

  record(now: number): void {
    if (now >= this.since) this.results.push(now);
  }

  tooSlow(now: number): boolean {
    if (now - this.since < WINDOW_MS) return false;
    while (this.results.length && now - this.results[0]! > WINDOW_MS) this.results.shift();
    return this.results.length / (WINDOW_MS / 1000) < MIN_FPS;
  }
}
