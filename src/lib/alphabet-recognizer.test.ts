import { describe, expect, it } from "vitest";
import {
  applyLocationRule,
  faceBlock,
  LetterVerifier,
  MAX_NAME_LENGTH,
  nameLetters,
  parseName,
  pickPrimary,
  touchWeight,
  visibleRegion,
  type Point,
} from "@/lib/alphabet-recognizer";

function pose(eyes: [number, number], mouth: [number, number]): Point[] {
  const pts: Point[] = Array.from({ length: 33 }, () => ({ x: 0, y: 0 }));
  pts[2] = { x: eyes[0] - 0.02, y: eyes[1] };
  pts[5] = { x: eyes[0] + 0.02, y: eyes[1] };
  pts[9] = { x: mouth[0] - 0.01, y: mouth[1] };
  pts[10] = { x: mouth[0] + 0.01, y: mouth[1] };
  return pts;
}

function hand(wrist: [number, number], indexTip: [number, number]): Point[] {
  const pts: Point[] = Array.from({ length: 21 }, () => ({ x: wrist[0], y: wrist[1] }));
  pts[8] = { x: indexTip[0], y: indexTip[1] };
  pts[12] = { x: indexTip[0], y: indexTip[1] + 0.01 };
  pts[9] = { x: wrist[0], y: wrist[1] - 0.05 };
  return pts;
}

describe("faceBlock", () => {
  it("measures the hand in eyes-to-mouth units, with the presence flag", () => {
    const f = faceBlock(pose([0.5, 0.3], [0.5, 0.4]), hand([0.6, 0.6], [0.5, 0.4]), false);
    expect(f[0]).toBeCloseTo(1);
    expect(f[1]).toBeCloseTo(3);
    expect(f[3]).toBeCloseTo(1);
    expect(f[6]).toBeCloseTo(0.5);
    expect(f[7]).toBe(1);
  });

  it("flips x for a mirrored (left) hand", () => {
    const f = faceBlock(pose([0.5, 0.3], [0.5, 0.4]), hand([0.6, 0.6], [0.5, 0.4]), true);
    expect(f[0]).toBeCloseTo(-1);
  });

  it("is all zeros without a pose", () => {
    expect(Array.from(faceBlock(null, hand([0.5, 0.5], [0.5, 0.4]), false))).toEqual(
      new Array(8).fill(0),
    );
  });
});

describe("applyLocationRule", () => {
  const labels = ["A", "I", "T"];
  const probs = Float32Array.from([0.2, 0.4, 0.4]);

  it("gives T the I+T probability when the fingertip is at the mouth", () => {
    const face = new Float32Array(8);
    face[3] = 1.0;
    face[7] = 1;
    const out = applyLocationRule(probs, labels, face);
    expect(out[2]).toBeGreaterThan(0.79);
    expect(out[1]).toBeLessThan(0.01);
    expect(out[0]).toBeCloseTo(0.2);
  });

  it("gives I the probability when the fingertip is by the eye", () => {
    const face = new Float32Array(8);
    face[3] = 0.2;
    face[7] = 1;
    expect(applyLocationRule(probs, labels, face)[1]).toBeGreaterThan(0.79);
  });

  it("splits softly at the boundary", () => {
    const face = new Float32Array(8);
    face[3] = 0.67;
    face[7] = 1;
    const out = applyLocationRule(probs, labels, face);
    expect(out[1]).toBeCloseTo(0.4);
    expect(out[2]).toBeCloseTo(0.4);
  });

  it("does nothing without a face", () => {
    expect(applyLocationRule(probs, labels, new Float32Array(8))).toBe(probs);
  });
});

describe("LetterVerifier", () => {
  const hit = Float32Array.from([0.9, 0.1]);
  const miss = Float32Array.from([0.1, 0.9]);

  it("confirms after the letter holds over its threshold for N frames", () => {
    const v = new LetterVerifier(1, 3);
    expect(v.push(hit, 0, 0.5).confirmed).toBe(false);
    expect(v.push(hit, 0, 0.5).confirmed).toBe(false);
    expect(v.push(hit, 0, 0.5).confirmed).toBe(true);
  });

  it("restarts the streak when a frame falls below", () => {
    const v = new LetterVerifier(1, 2);
    v.push(hit, 0, 0.5);
    v.push(miss, 0, 0.5);
    expect(v.push(hit, 0, 0.5).confirmed).toBe(false);
  });

  it("averages the window before comparing", () => {
    const v = new LetterVerifier(2, 1);
    v.push(hit, 0, 0.6);
    const step = v.push(miss, 0, 0.6);
    expect(step.confidence).toBeCloseTo(0.5);
    expect(step.ok).toBe(false);
  });

  it("forgets everything on reset", () => {
    const v = new LetterVerifier(5, 2);
    v.push(hit, 0, 0.5);
    v.reset();
    expect(v.push(hit, 0, 0.5).confirmed).toBe(false);
  });
});

describe("visibleRegion", () => {
  it("crops the sides of a 4:3 camera in a portrait box", () => {
    const r = visibleRegion(640, 480, 300, 400)!;
    expect(r.h).toBe(1);
    expect(r.w).toBeCloseTo(0.5625);
    expect(r.x).toBeCloseTo(0.21875);
  });

  it("is the whole frame when the aspect matches", () => {
    expect(visibleRegion(640, 480, 320, 240)).toEqual({ x: 0, y: 0, w: 1, h: 1 });
  });

  it("is null before the video has a size", () => {
    expect(visibleRegion(0, 0, 300, 400)).toBeNull();
  });
});

describe("parseName", () => {
  const supported = ["A", "M", "N", "Ñ", "O", "T"];

  it("keeps only uppercase manual-alphabet letters", () => {
    expect(parseName("  mañana 2!", supported).name).toBe("MAÑANA");
  });

  it("caps the length", () => {
    expect(parseName("a".repeat(30), supported).name).toHaveLength(MAX_NAME_LENGTH);
  });

  it("reports letters the model doesn't know", () => {
    expect(parseName("tazo", supported).unsupported).toEqual(["Z"]);
  });

  it("is empty for an empty input", () => {
    expect(parseName("", supported)).toEqual({ name: "", unsupported: [] });
  });
});

describe("location zones", () => {
  const labels = ["H", "S", "A"];
  const face = (x: number, y: number) => Float32Array.from([0, 3, x, y, 0, 0, 0.5, 1]);
  const probs = () => Float32Array.from([0.8, 0.8, 0.8]);

  it("keeps H by the face and S on the chin", () => {
    const out = applyLocationRule(probs(), labels, face(0.3, 1.6));
    expect(out[0]).toBeGreaterThan(0.75);
    expect(out[1]).toBeGreaterThan(0.75);
  });

  it("drops H and S made away from the face, leaving other letters alone", () => {
    const out = applyLocationRule(probs(), labels, face(-2.5, 3.5));
    expect(out[0]).toBeLessThan(0.05);
    expect(out[1]).toBeLessThan(0.05);
    expect(out[2]).toBeCloseTo(0.8);
  });

  it("drops S by the eyes, where H is still fine", () => {
    const out = applyLocationRule(probs(), labels, face(0.3, 0.1));
    expect(out[0]).toBeGreaterThan(0.75);
    expect(out[1]).toBeLessThan(0.05);
  });

  it("does nothing without a face", () => {
    const f = face(-2.5, 3.5);
    f[7] = 0;
    expect(Array.from(applyLocationRule(probs(), labels, f))).toEqual(Array.from(probs()));
  });
});

describe("two hands", () => {
  const hand = (dx: number, dy = 0) =>
    Array.from({ length: 21 }, (_, i) => ({
      x: 0.3 + dx + (i % 5) * 0.01,
      y: 0.6 + dy - i * 0.01,
    }));

  it("counts hands as touching only when a fingertip reaches the other hand", () => {
    expect(touchWeight(hand(0), hand(0.02), 1)).toBeGreaterThan(0.95);
    expect(touchWeight(hand(0), hand(0.4), 1)).toBeLessThan(0.01);
    expect(touchWeight(hand(0), null, 1)).toBe(0);
  });

  it("keeps following the same hand instead of jumping to the bigger one", () => {
    const small = hand(0);
    const big = hand(0.4).map((p, i) => (i === 9 ? { x: p.x, y: p.y - 0.2 } : p));
    expect(pickPrimary([small, big], null, 1)).toBe(1);
    expect(pickPrimary([small, big], small[0]!, 1)).toBe(0);
    expect(pickPrimary([big, small], small[0]!, 1)).toBe(1);
    expect(pickPrimary([], null, 1)).toBe(-1);
  });
});

describe("nameLetters", () => {
  it("keeps accented vowels as plain letters and keeps Ñ", () => {
    expect(nameLetters("José Peña")).toBe("JOSEPEÑA");
    expect(nameLetters("Ágústín")).toBe("AGUSTIN");
  });

  it("caps parsed names at the maximum length", () => {
    expect(parseName("Maximiliano Gómez", ["A"]).name).toHaveLength(MAX_NAME_LENGTH);
  });
});
