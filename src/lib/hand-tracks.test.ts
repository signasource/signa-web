import { describe, expect, it } from "vitest";
import { HandTracks } from "./hand-tracks";

const hand = (x: number, y: number) =>
  Array.from({ length: 21 }, (_, i) => ({ x, y: y - (i === 9 ? 0.05 : 0), z: 0 }));
const sight = (x: number, y: number, left: boolean, score = 0.99) => ({
  landmarks: hand(x, y),
  world: hand(x, y),
  left,
  score,
});

describe("HandTracks", () => {
  it("starts with the raised hand as the main one", () => {
    const tracks = new HandTracks();
    const seen = tracks.update([sight(0.3, 0.9, false), sight(0.6, 0.4, true)], 1, 0);
    expect(tracks.primary).toBe(seen[1]!.id);
  });

  it("keeps each hand on its track whatever order MediaPipe gives", () => {
    const tracks = new HandTracks();
    const [a, b] = tracks.update([sight(0.3, 0.9, false), sight(0.6, 0.4, true)], 1, 0);
    const swapped = tracks.update([sight(0.61, 0.41, true), sight(0.3, 0.9, false)], 1, 50);
    expect(swapped.map((t) => t.id)).toEqual([b!.id, a!.id]);
  });

  it("doesn't hand the main track to the other hand when it is lost for a moment", () => {
    const tracks = new HandTracks();
    tracks.update([sight(0.3, 0.9, false), sight(0.6, 0.4, true)], 1, 0);
    const main = tracks.primary;
    const alone = tracks.update([sight(0.3, 0.9, false)], 1, 50);
    expect(alone[0]!.id).not.toBe(main);
    const back = tracks.update([sight(0.3, 0.9, false), sight(0.62, 0.42, true)], 1, 150);
    expect(back.find((t) => t.id === main)).toBeDefined();
    expect(tracks.primary).toBe(main);
  });

  it("never puts two hands in view on the same side", () => {
    const tracks = new HandTracks();
    tracks.update([sight(0.3, 0.9, false), sight(0.6, 0.4, true)], 1, 0);
    const both = tracks.update([sight(0.3, 0.9, false), sight(0.6, 0.4, false, 0.6)], 1, 50);
    expect(both[0]!.mirrored).not.toBe(both[1]!.mirrored);
    expect(both[0]!.mirrored).toBe(false);
  });

  it("doesn't let a huge false hand swallow a real one far away", () => {
    const tracks = new HandTracks();
    const big = (x: number, y: number) => ({
      landmarks: Array.from({ length: 21 }, (_, i) => ({ x, y: y - (i === 9 ? 0.3 : 0), z: 0 })),
      world: hand(x, y),
      left: true,
      score: 0.6,
    });
    const [face] = tracks.update([big(0.5, 0.3)], 1, 0);
    const [real] = tracks.update([sight(0.27, 0.86, false)], 1, 100);
    expect(real!.id).not.toBe(face!.id);
  });
});
