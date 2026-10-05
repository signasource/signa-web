export interface Point {
  x: number;
  y: number;
  z?: number;
}

const LEFT_EYE = 2;
const RIGHT_EYE = 5;
const MOUTH_LEFT = 9;
const MOUTH_RIGHT = 10;
const WRIST = 0;
const INDEX_TIP = 8;
const MIDDLE_TIP = 12;
const MIDDLE_MCP = 9;

export const FACE_BLOCK_SIZE = 8;
const FACE_INDEX_Y = 3;
const FACE_PRESENT = 7;

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

const LOCATION_PAIRS: ReadonlyArray<readonly [upper: string, lower: string, threshold: number]> = [
  ["I", "T", 0.67],
];
const LOCATION_SOFTNESS = 0.04;

const FACE_INDEX_X = 2;
const LOCATION_ZONES: ReadonlyArray<
  readonly [letter: string, cx: number, cy: number, rx: number, ry: number]
> = [
  ["H", 0, 0.9, 1.7, 1.7],
  ["S", 0.3, 1.65, 0.9, 0.75],
  ["J", 0.2, 1.6, 1.3, 1.0],
  ["F", 2.0, 3.0, 1.6, 1.4],
];
const ZONE_SOFTNESS = 0.12;

export function zoneWeight(face: Float32Array, cx: number, cy: number, rx: number, ry: number) {
  const d = Math.hypot((face[FACE_INDEX_X]! - cx) / rx, (face[FACE_INDEX_Y]! - cy) / ry);
  return 1 / (1 + Math.exp(-(1 - d) / ZONE_SOFTNESS));
}

export function applyLocationRule(
  probs: Float32Array,
  labels: readonly string[],
  face: Float32Array,
): Float32Array {
  if (face[FACE_PRESENT] !== 1) return probs;
  probs = Float32Array.from(probs);
  for (const [letter, cx, cy, rx, ry] of LOCATION_ZONES) {
    const i = labels.indexOf(letter);
    if (i >= 0) probs[i] = probs[i]! * zoneWeight(face, cx, cy, rx, ry);
  }
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
  confidence: number;
  ok: boolean;
  confirmed: boolean;
}

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

export function nameLetters(raw: string): string {
  return Array.from(raw.normalize("NFC").toUpperCase(), (c) =>
    c === "Ñ" ? c : c.normalize("NFD").replace(/\p{M}/gu, ""),
  )
    .join("")
    .replace(/[^A-ZÑ]/g, "");
}

export function parseName(
  raw: string,
  supported: readonly string[],
): { name: string; unsupported: string[] } {
  const name = nameLetters(raw).slice(0, MAX_NAME_LENGTH);
  const unsupported = [...new Set(name.split(""))].filter((c) => !supported.includes(c));
  return { name, unsupported };
}

const MIDDLE_MCP_INDEX = 9;
const FINGERTIPS = [4, 8, 12, 16, 20];
export const TWO_HANDED = ["Q", "W"] as const;
const TOUCH_HANDS = 0.6;
const TOUCH_SOFTNESS = 0.1;

const gap = (a: Point, b: Point, aspect: number) => Math.hypot(a.x - b.x, (a.y - b.y) * aspect);

export function handSize(hand: readonly Point[], aspect: number): number {
  return gap(hand[0]!, hand[MIDDLE_MCP_INDEX]!, aspect);
}

export function touchWeight(
  a: readonly Point[],
  b: readonly Point[] | null,
  aspect: number,
): number {
  if (!b) return 0;
  let min = Infinity;
  for (const [from, to] of [
    [a, b],
    [b, a],
  ] as const) {
    for (const i of FINGERTIPS) {
      for (const q of to) min = Math.min(min, gap(from[i]!, q, aspect));
    }
  }
  const size = Math.max(handSize(a, aspect), handSize(b, aspect), 1e-6);
  return 1 / (1 + Math.exp((min / size - TOUCH_HANDS) / TOUCH_SOFTNESS));
}

export function pickPrimary(
  hands: readonly (readonly Point[])[],
  last: Point | null,
  aspect: number,
): number {
  if (!hands.length) return -1;
  let best = 0;
  for (let i = 1; i < hands.length; i++) {
    const better = last
      ? gap(hands[i]![0]!, last, aspect) < gap(hands[best]![0]!, last, aspect)
      : handSize(hands[i]!, aspect) > handSize(hands[best]!, aspect);
    if (better) best = i;
  }
  return best;
}

export const TRACED_LETTERS = ["Z"] as const;
const TRACE_TIPS = [8, 20];
const TRACE_WINDOW_MS = 3000;
const TRACE_HOLD_MS = 2500;
const TRACE_SIMPLIFY = 0.25;
const TRACE_MIN_STROKE = 0.45;
const FLAT = 1.7;

export interface TracePoint {
  x: number;
  y: number;
  t: number;
}

type Vertex = TracePoint;

function simplify(points: readonly Vertex[], eps: number): Vertex[] {
  if (points.length < 3) return [...points];
  const a = points[0]!;
  const b = points[points.length - 1]!;
  const len = Math.hypot(b.x - a.x, b.y - a.y) || 1e-9;
  let far = 0;
  let at = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const p = points[i]!;
    const d = Math.abs((b.x - a.x) * (a.y - p.y) - (a.x - p.x) * (b.y - a.y)) / len;
    if (d > far) [far, at] = [d, i];
  }
  if (far <= eps) return [a, b];
  return [
    ...simplify(points.slice(0, at + 1), eps).slice(0, -1),
    ...simplify(points.slice(at), eps),
  ];
}

export function tracesZ(points: readonly Vertex[]): boolean {
  const v = simplify(points, TRACE_SIMPLIFY);
  for (let i = 0; i + 3 < v.length; i++) {
    const [p0, p1, p2, p3] = [v[i]!, v[i + 1]!, v[i + 2]!, v[i + 3]!];
    const s1 = { x: p1.x - p0.x, y: p1.y - p0.y };
    const s2 = { x: p2.x - p1.x, y: p2.y - p1.y };
    const s3 = { x: p3.x - p2.x, y: p3.y - p2.y };
    const flat = (s: { x: number; y: number }) =>
      Math.abs(s.x) >= TRACE_MIN_STROKE && Math.abs(s.x) > FLAT * Math.abs(s.y);
    if (!flat(s1) || !flat(s3) || Math.sign(s1.x) !== Math.sign(s3.x)) continue;
    const back = Math.sign(s2.x) === -Math.sign(s1.x) || Math.abs(s2.x) < 0.3 * Math.abs(s2.y);
    if (back && s2.y >= TRACE_MIN_STROKE * 0.8 && Math.abs(s2.y) > 0.5 * Math.abs(s2.x))
      return true;
  }
  return false;
}

export class TraceTracker {
  private readonly paths: TracePoint[][] = TRACE_TIPS.map(() => []);
  private tracedAt = -Infinity;

  push(hand: readonly Point[] | null, aspect: number, mirrored: boolean, now: number): void {
    if (!hand) return;
    const unit = Math.max(handSize(hand, aspect), 1e-6);
    const sign = mirrored ? -1 : 1;
    TRACE_TIPS.forEach((tip, k) => {
      const path = this.paths[k]!;
      const p = hand[tip]!;
      path.push({ x: (sign * p.x) / unit, y: (p.y * aspect) / unit, t: now });
      while (path.length && now - path[0]!.t > TRACE_WINDOW_MS) path.shift();
      if (tracesZ(path)) {
        this.tracedAt = now;
        path.length = 0;
      }
    });
  }

  weight(now: number): number {
    return now - this.tracedAt <= TRACE_HOLD_MS ? 1 : 0;
  }

  reset(): void {
    this.paths.forEach((p) => (p.length = 0));
    this.tracedAt = -Infinity;
  }
}
