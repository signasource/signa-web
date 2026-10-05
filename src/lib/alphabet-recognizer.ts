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
const TRACE_WINDOW_MS = 2000;
const TRACE_HOLD_MS = 2500;
const TURN = 0.15;
const MIN_DROP = 0.15;
const MIN_STROKE = 0.25;
const LAST_STROKE = 0.9;
const MIN_DIAGONAL_DROP = 0.1;
const PALM = [0, 5, 9, 13, 17];
const RELEASED = 0.3;

export interface TracePoint {
  x: number;
  y: number;
  t: number;
}

function turningPoints(points: readonly TracePoint[]): TracePoint[] {
  if (!points.length) return [];
  const start = points[0]!;
  const turns: TracePoint[] = [start];
  let dir = 0;
  let extreme = start;
  for (const p of points) {
    if (dir === 0) {
      if (Math.abs(p.x - start.x) >= TURN) [dir, extreme] = [Math.sign(p.x - start.x), p];
      continue;
    }
    if ((p.x - extreme.x) * dir > 0) extreme = p;
    else if ((extreme.x - p.x) * dir >= TURN) {
      turns.push(extreme);
      [dir, extreme] = [-dir, p];
    }
  }
  if (dir !== 0) turns.push(extreme);
  return turns;
}

export function tracesZ(points: readonly TracePoint[]): boolean {
  const turns = turningPoints(points);
  for (let i = 0; i + 3 < turns.length; i++) {
    const [a, b, c, d] = [turns[i]!, turns[i + 1]!, turns[i + 2]!, turns[i + 3]!];
    const s1 = b.x - a.x;
    const s2 = c.x - b.x;
    const s3 = d.x - c.x;
    if (
      Math.abs(s1) < MIN_STROKE ||
      Math.abs(s3) < Math.max(MIN_STROKE, LAST_STROKE * Math.abs(s2))
    )
      continue;
    if (Math.sign(s1) !== Math.sign(s3) || Math.sign(s2) !== -Math.sign(s1)) continue;
    if (c.y - b.y >= MIN_DIAGONAL_DROP && d.y - a.y >= MIN_DROP) return true;
  }
  return false;
}

export class TraceTracker {
  private readonly path: (TracePoint & { size: number })[] = [];
  private tracedAt = -Infinity;
  private armed = true;

  release(shape: number): void {
    if (shape < RELEASED) this.armed = true;
  }

  push(hand: readonly Point[] | null, aspect: number, mirrored: boolean, now: number): void {
    if (!hand || !this.armed) return;
    const path = this.path;
    const center = PALM.reduce((s, i) => ({ x: s.x + hand[i]!.x, y: s.y + hand[i]!.y }), {
      x: 0,
      y: 0,
    });
    path.push({
      x: ((mirrored ? -1 : 1) * center.x) / PALM.length,
      y: (center.y * aspect) / PALM.length,
      t: now,
      size: handSize(hand, aspect),
    });
    while (path.length && now - path[0]!.t > TRACE_WINDOW_MS) path.shift();
    const unit = Math.max(...path.map((q) => q.size), 1e-6);
    if (tracesZ(path.map((q) => ({ x: q.x / unit, y: q.y / unit, t: q.t })))) {
      this.tracedAt = now;
      path.length = 0;
    }
  }

  weight(now: number): number {
    return now - this.tracedAt <= TRACE_HOLD_MS ? 1 : 0;
  }

  reset(): void {
    this.path.length = 0;
    this.tracedAt = -Infinity;
    this.armed = false;
  }
}

const FINGER_OUT = 1.35;
const FINGER_SOFTNESS = 0.08;

const reach = (hand: readonly Point[], tip: number, mcp: number) => {
  const d = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y, (a.z ?? 0) - (b.z ?? 0));
  return d(hand[tip]!, hand[0]!) / Math.max(d(hand[mcp]!, hand[0]!), 1e-6);
};

export function fingerUp(hand: readonly Point[]): number {
  const out = (tip: number, mcp: number) =>
    1 / (1 + Math.exp(-(reach(hand, tip, mcp) - FINGER_OUT) / FINGER_SOFTNESS));
  return Math.max(out(8, 5), out(20, 17));
}
