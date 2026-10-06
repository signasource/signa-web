import type { Point } from "@/lib/alphabet-recognizer";

const KEEP_MS = 700;
const GATE = 3;
const GATE_GROWTH_MS = 100;
const VOTE = 0.25;
const RAISED = 2;
const DUPLICATE = 0.5;

export interface HandSighting {
  landmarks: Point[];
  world: Point[];
  left: boolean;
  score: number;
}

export interface Track {
  id: number;
  landmarks: Point[];
  world: Point[];
  mirrored: boolean;
  seenAt: number;
  size: number;
  vote: number;
}

const wristGap = (a: readonly Point[], b: readonly Point[], aspect: number) =>
  Math.hypot(a[0]!.x - b[0]!.x, (a[0]!.y - b[0]!.y) * aspect);

const sizeOf = (h: readonly Point[], aspect: number) =>
  Math.hypot(h[9]!.x - h[0]!.x, (h[9]!.y - h[0]!.y) * aspect);

const meanGap = (a: readonly Point[], b: readonly Point[], aspect: number) =>
  a.reduce((s, p, i) => s + Math.hypot(p.x - b[i]!.x, (p.y - b[i]!.y) * aspect), 0) / a.length;

function withoutDuplicates(
  found: readonly HandSighting[],
  aspect: number,
): readonly HandSighting[] {
  if (found.length !== 2) return found;
  const [a, b] = found as [HandSighting, HandSighting];
  const size = Math.max(sizeOf(a.landmarks, aspect), sizeOf(b.landmarks, aspect));
  if (meanGap(a.landmarks, b.landmarks, aspect) >= DUPLICATE * size) return found;
  return [a.score >= b.score ? a : b];
}

export class HandTracks {
  private tracks: Track[] = [];
  private nextId = 1;
  private primaryId: number | null = null;

  update(found: readonly HandSighting[], aspect: number, now: number): Track[] {
    const sightings = withoutDuplicates(found, aspect);
    this.tracks = this.tracks.filter((t) => now - t.seenAt <= KEEP_MS);
    const cost = (t: Track, s: HandSighting) => {
      const d = wristGap(t.landmarks, s.landmarks, aspect);
      const size = Math.min(t.size, sizeOf(s.landmarks, aspect));
      return d <= GATE * size * (1 + (now - t.seenAt) / GATE_GROWTH_MS) ? d : Infinity;
    };

    const owner: (Track | null)[] = sightings.map(() => null);
    if (sightings.length === 2 && this.tracks.length >= 2) {
      const [a, b] = this.tracks as [Track, Track];
      const straight = cost(a, sightings[0]!) + cost(b, sightings[1]!);
      const crossed = cost(b, sightings[0]!) + cost(a, sightings[1]!);
      const [p, q] = crossed < straight ? [b, a] : [a, b];
      if (cost(p, sightings[0]!) < Infinity) owner[0] = p;
      if (cost(q, sightings[1]!) < Infinity) owner[1] = q;
    } else {
      const free = new Set(this.tracks);
      sightings.forEach((s, i) => {
        let best: Track | null = null;
        for (const t of free) if (cost(t, s) < (best ? cost(best, s) : Infinity)) best = t;
        if (best) {
          owner[i] = best;
          free.delete(best);
        }
      });
    }

    const seen: Track[] = [];
    sightings.forEach((s, i) => {
      const side = (s.left ? 1 : -1) * s.score;
      let t = owner[i];
      if (!t) {
        if (this.tracks.length >= 2) {
          const stale = this.tracks.reduce((x, y) => (x.seenAt <= y.seenAt ? x : y));
          if (stale.seenAt === now) return;
          this.tracks = this.tracks.filter((x) => x !== stale);
        }
        t = {
          id: this.nextId++,
          landmarks: s.landmarks,
          world: s.world,
          mirrored: s.left,
          seenAt: now,
          size: 0,
          vote: side,
        };
        this.tracks.push(t);
      }
      t.landmarks = s.landmarks;
      t.world = s.world;
      t.seenAt = now;
      t.size = sizeOf(s.landmarks, aspect);
      t.vote += (side - t.vote) * VOTE;
      t.mirrored = t.vote > 0;
      seen.push(t);
    });

    if (seen.length === 2 && seen[0]!.mirrored === seen[1]!.mirrored) {
      const [sure, unsure] =
        Math.abs(seen[0]!.vote) >= Math.abs(seen[1]!.vote)
          ? [seen[0]!, seen[1]!]
          : [seen[1]!, seen[0]!];
      unsure.mirrored = !sure.mirrored;
    }

    const primary = this.tracks.find((t) => t.id === this.primaryId);
    const highest = seen.length
      ? seen.reduce((a, b) => (b.landmarks[0]!.y < a.landmarks[0]!.y ? b : a))
      : null;
    if (highest && (!primary || this.raisedOver(highest, primary, aspect)))
      this.primaryId = highest.id;
    return seen;
  }

  private raisedOver(a: Track, b: Track, aspect: number): boolean {
    return (b.landmarks[0]!.y - a.landmarks[0]!.y) * aspect > RAISED * Math.min(a.size, b.size);
  }

  get primary(): number | null {
    return this.primaryId;
  }

  reset(): void {
    this.tracks = [];
    this.primaryId = null;
  }
}
