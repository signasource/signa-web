import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createClassifier, type ClassifierManifest } from "@/lib/alphabet-classifier";
import { faceBlock } from "@/lib/alphabet-recognizer";
import { buildHandFeatures, type Vec3 } from "@/lib/hand-features";
import vectors from "@/lib/alphabet-classifier.vectors.json";

interface Case {
  letra: string;
  lm: number[][];
  world: number[][];
  pose: number[][];
  mirrored: boolean;
  features: number[];
  face: number[];
  probs: number[];
}

const cases = vectors.cases as Case[];
const publicDir = join(process.cwd(), "public", "reconocedor");
const manifest = JSON.parse(
  readFileSync(join(publicDir, "alfabeto.json"), "utf-8"),
) as ClassifierManifest;
const bin = readFileSync(join(publicDir, "alfabeto.bin"));
const classifier = createClassifier(
  manifest,
  bin.buffer.slice(bin.byteOffset, bin.byteOffset + bin.byteLength),
);

const flip = (points: number[][], mirrored: boolean): Vec3[] =>
  points.map((p) => [(mirrored ? -1 : 1) * p[0]!, p[1]!, p[2]!] as const);

function maxDiff(a: ArrayLike<number>, b: ArrayLike<number>): number {
  let d = 0;
  for (let i = 0; i < b.length; i++) d = Math.max(d, Math.abs((a[i] ?? NaN) - b[i]!));
  return d;
}

describe("alphabet classifier (TypeScript port vs signa-ml)", () => {
  it("has real hands of both sides to compare against", () => {
    expect(cases.length).toBeGreaterThan(40);
    expect(cases.some((c) => c.mirrored)).toBe(true);
    expect(cases.some((c) => !c.mirrored)).toBe(true);
  });

  it("computes the same 258 hand features", () => {
    for (const c of cases) {
      const f = buildHandFeatures(flip(c.lm, c.mirrored), flip(c.world, c.mirrored));
      expect(maxDiff(f, c.features)).toBeLessThan(1e-4);
    }
  });

  it("computes the same face block from the pose", () => {
    for (const c of cases) {
      const pose = c.pose.map(([x, y]) => ({ x: x!, y: y! }));
      const hand = c.lm.map(([x, y]) => ({ x: x!, y: y! }));
      expect(maxDiff(faceBlock(pose, hand, c.mirrored), c.face)).toBeLessThan(1e-4);
    }
  });

  it("gives the same letter probabilities as the Keras model", () => {
    let agree = 0;
    for (const c of cases) {
      const hand = buildHandFeatures(flip(c.lm, c.mirrored), flip(c.world, c.mirrored));
      const p = classifier.predict(hand, c.face);
      expect(maxDiff(p, c.probs)).toBeLessThan(1e-5);
      const best = p.indexOf(Math.max(...p));
      if (manifest.labels[best] === c.letra) agree++;
    }
    expect(agree / cases.length).toBeGreaterThan(0.75);
  });

  it("rejects weights that don't match their manifest", () => {
    expect(() => createClassifier(manifest, new ArrayBuffer(16))).toThrow();
  });
});
