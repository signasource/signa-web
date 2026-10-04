// Pure logic of the camera alphabet demo ("Deletreá tu nombre" in the landing's camera preview).
// Ported from signa-ml (src/inference/alphabet_runner.py) and signa-mobile (ModeloAbecedario.kt):
// the numbers that reach the model must match the ones it was trained on. Docs: docs/features/landing.md

/** A normalized landmark as MediaPipe Tasks returns it (x, y in [0, 1] of the image). */
export interface Point {
  x: number;
  y: number;
  z?: number;
}

// BlazePose indices used as the face reference, and hand indices of the face block.
const LEFT_EYE = 2;
const RIGHT_EYE = 5;
const MOUTH_LEFT = 9;
const MOUTH_RIGHT = 10;
const WRIST = 0;
const INDEX_TIP = 8;
const MIDDLE_TIP = 12;
const MIDDLE_MCP = 9;

export const FACE_BLOCK_SIZE = 8;
/** Position in the face block of the index fingertip height (eyes = 0, mouth = 1). */
const FACE_INDEX_Y = 3;
const FACE_PRESENT = 7;

/**
 * Where the hand is relative to the face, in "eyes to mouth" units: 8 values.
 * Same math as `build_face_features` in signa-ml. Without a face (no pose), all zeros —
 * which is what the model learned to ignore. `mirrored` flips x, as the hand itself is flipped
 * when it is a left hand.
 */
export function faceBlock(
  pose: readonly Point[] | null,
  hand: readonly Point[],
  mirrored: boolean,
): Float32Array {
  const out = new Float32Array(FACE_BLOCK_SIZE);
  if (!pose || pose.length <= MOUTH_RIGHT) return out;
  const eyes = pose[LEFT_EYE]!;
  const eyesR = pose[RIGHT_EYE]!;
  const mouthL = pose[MOUTH_LEFT]!;
  const mouthR = pose[MOUTH_RIGHT]!;
  const ex = (eyes.x + eyesR.x) / 2;
  const ey = (eyes.y + eyesR.y) / 2;
  const mx = (mouthL.x + mouthR.x) / 2;
  const my = (mouthL.y + mouthR.y) / 2;
  const scale = Math.hypot(mx - ex, my - ey);
  if (scale < 1e-6) return out;

  [WRIST, INDEX_TIP, MIDDLE_TIP].forEach((i, k) => {
    const p = hand[i]!;
    const dx = (p.x - ex) / scale;
    out[k * 2] = mirrored ? -dx : dx;
    out[k * 2 + 1] = (p.y - ey) / scale;
  });
  const wrist = hand[WRIST]!;
  const mcp = hand[MIDDLE_MCP]!;
  out[6] = Math.hypot(mcp.x - wrist.x, mcp.y - wrist.y) / scale;
  out[FACE_PRESENT] = 1;
  return out;
}

/**
 * T (index on the mouth) and I (index by the eye) share the hand shape; only the height tells
 * them apart, and the model alone doesn't settle it. The fingertip height splits their combined
 * probability, softly around the midpoint between the two clouds of the dataset — same rule as
 * `LOCATION_PAIRS` in signa-ml.
 */
const LOCATION_PAIRS: ReadonlyArray<readonly [upper: string, lower: string, threshold: number]> = [
  ["I", "T", 0.67],
];
const LOCATION_SOFTNESS = 0.04;

export function applyLocationRule(
  probs: Float32Array,
  labels: readonly string[],
  face: Float32Array,
): Float32Array {
  if (face[FACE_PRESENT] !== 1) return probs;
  const height = face[FACE_INDEX_Y]!;
  let out = probs;
  for (const [upper, lower, threshold] of LOCATION_PAIRS) {
    const iu = labels.indexOf(upper);
    const il = labels.indexOf(lower);
    if (iu < 0 || il < 0) continue;
    const total = out[iu]! + out[il]!;
    if (total <= 0) continue;
    const lowerWeight = 1 / (1 + Math.exp(-(height - threshold) / LOCATION_SOFTNESS));
    out = Float32Array.from(out);
    out[il] = total * lowerWeight;
    out[iu] = total * (1 - lowerWeight);
  }
  return out;
}

export interface VerifierStep {
  /** Smoothed probability of the requested letter. */
  confidence: number;
  /** Over its threshold this frame. */
  ok: boolean;
  /** Held over its threshold for `confirmFrames` frames in a row: the letter counts. */
  confirmed: boolean;
}

/**
 * "Is this the letter we asked for?" — verification, not identification: the requested letter's
 * probability, averaged over the last frames, against its own calibrated threshold, held for a
 * few consecutive frames. Same as `AlphabetRecognizer.process(target=...)` in signa-ml.
 */
export class LetterVerifier {
  private readonly window: Float32Array[] = [];
  private streak = 0;

  constructor(
    private readonly windowSize = 7,
    private readonly confirmFrames = 5,
  ) {}

  push(probs: Float32Array, targetIndex: number, threshold: number): VerifierStep {
    this.window.push(probs);
    if (this.window.length > this.windowSize) this.window.shift();
    let sum = 0;
    for (const p of this.window) sum += p[targetIndex] ?? 0;
    const confidence = sum / this.window.length;
    const ok = confidence >= threshold;
    this.streak = ok ? this.streak + 1 : 0;
    return { confidence, ok, confirmed: this.streak >= this.confirmFrames };
  }

  /** No hand in view, a new letter, or a pause: start over. */
  reset(): void {
    this.window.length = 0;
    this.streak = 0;
  }
}

export interface Region {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Part of the camera frame visible in a box shown with `object-fit: cover`, as fractions of the
 * frame. Recognition only looks there: the camera sees wider than the box, and hands outside it
 * (someone next to you) must not count.
 */
export function visibleRegion(
  videoW: number,
  videoH: number,
  boxW: number,
  boxH: number,
): Region | null {
  if (!videoW || !videoH || !boxW || !boxH) return null;
  const scale = Math.max(boxW / videoW, boxH / videoH);
  const w = Math.min(1, boxW / scale / videoW);
  const h = Math.min(1, boxH / scale / videoH);
  return { x: (1 - w) / 2, y: (1 - h) / 2, w, h };
}

export const MAX_NAME_LENGTH = 10;

/**
 * The name to spell: uppercase letters of the LSA manual alphabet only. Letters the model doesn't
 * know (Z, which is dynamic in LSA) are reported so the UI can say so instead of never finishing.
 */
export function parseName(
  raw: string,
  supported: readonly string[],
): { name: string; unsupported: string[] } {
  const name = raw
    .normalize("NFC")
    .toUpperCase()
    .replace(/[^A-ZÑ]/g, "")
    .slice(0, MAX_NAME_LENGTH);
  const unsupported = [...new Set(name.split(""))].filter((c) => !supported.includes(c));
  return { name, unsupported };
}
