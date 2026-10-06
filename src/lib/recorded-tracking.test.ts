import { describe, expect, it } from "vitest";
import zTraces from "./__fixtures__/z-trazos.json";
import fullBody from "./__fixtures__/dos-manos-cuerpo-entero.json";
import { TraceTracker, fingerUp, type Point } from "./alphabet-recognizer";
import { HandTracks } from "./hand-tracks";

type Frame = { t: number; hand: Point[] | null };

const points = (a: number[][]): Point[] => a.map(([x, y, z]) => ({ x: x!, y: y!, z: z! }));
const hand21 = (h: number[]): Point[] =>
  Array.from({ length: 21 }, (_, i) => ({ x: h[i * 3]!, y: h[i * 3 + 1]!, z: h[i * 3 + 2]! }));

function zDetected(frames: Frame[], aspect: number): boolean {
  const tracker = new TraceTracker();
  for (const f of frames) {
    const shape = f.hand ? fingerUp(f.hand) : 0;
    tracker.push(f.hand ? [{ id: 1, landmarks: f.hand, shape }] : [], aspect, f.t);
    if (tracker.weight(f.t) && shape > 0.5) return true;
  }
  return false;
}

function scaled(
  frames: { t: number; hand: number[] | null }[],
  scale: number,
  speed: number,
): Frame[] {
  const hands = frames.filter((f) => f.hand).map((f) => hand21(f.hand!));
  const cx = hands.reduce((s, h) => s + h[9]!.x, 0) / hands.length;
  const cy = hands.reduce((s, h) => s + h[9]!.y, 0) / hands.length;
  return frames.map((f) => {
    if (!f.hand) return { t: f.t / speed, hand: null };
    const h = hand21(f.hand);
    const [mx, my] = [cx + (h[9]!.x - cx) * scale, cy + (h[9]!.y - cy) * scale];
    return {
      t: f.t / speed,
      hand: h.map((p) => ({ x: p.x - h[9]!.x + mx, y: p.y - h[9]!.y + my, z: p.z })),
    };
  });
}

describe("Z recorded on a phone", () => {
  it.each([
    ["as recorded", 1, 1],
    ["at 45% of its size", 0.45, 1],
    ["twice as fast", 1, 2],
    ["small and fast", 0.45, 2],
    ["slower", 1, 0.6],
  ])("is found %s", (_, scale, speed) => {
    for (const trace of zTraces.traces) {
      expect(zDetected(scaled(trace.frames, scale, speed), zTraces.aspect)).toBe(true);
    }
  });
});

describe("30 s of a full-body visitor with both hands in view", () => {
  const run = () => {
    const tracks = new HandTracks();
    const trace = new TraceTracker();
    let falseZ = 0;
    let sideFlips = 0;
    let primaryChanges = 0;
    let primary: number | null = null;
    const side = new Map<number, boolean>();
    for (const f of fullBody.frames) {
      const seen = tracks.update(
        f.hands.map((h) => ({
          landmarks: points(h.lm),
          world: points(h.world),
          left: h.left,
          score: h.score,
        })),
        fullBody.aspect,
        f.t,
      );
      for (const t of seen) {
        if (side.has(t.id) && side.get(t.id) !== t.mirrored) sideFlips++;
        side.set(t.id, t.mirrored);
      }
      const shapes = seen.map((t) => ({
        id: t.id,
        landmarks: t.landmarks,
        shape: fingerUp(t.world),
      }));
      trace.push(shapes, fullBody.aspect, f.t);
      if (trace.weight(f.t)) falseZ++;
      if (primary !== null && tracks.primary !== primary) primaryChanges++;
      primary = tracks.primary;
    }
    return { falseZ, sideFlips, primaryChanges };
  };

  it("never traces a Z", () => {
    expect(run().falseZ).toBe(0);
  });

  it("keeps each hand on its side and the primary hand steady", () => {
    const { sideFlips, primaryChanges } = run();
    expect(sideFlips).toBe(0);
    expect(primaryChanges).toBeLessThanOrEqual(3);
  });
});
