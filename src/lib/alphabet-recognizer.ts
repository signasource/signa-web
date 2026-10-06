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

export const TRACED_LETTERS = ["Z"] as const;
const TRACE_WINDOW_MS = 3000;
const TRACE_HOLD_MS = 1500;
const MIN_TRACE_MS = 250;
const MIN_WIDTH = 0.25;
const MIN_TALL = 0.2;
const MAX_TALL = 2;
const MAX_MISMATCH = 0.165;
const CORNER = 0.25;
const END_HEIGHT = 0.45;
const RESAMPLED = 24;
const PALM = [0, 5, 9, 13, 17];
const SHAPED = 0.5;
const MIN_SHAPED = 0.6;

export interface TracePoint {
  x: number;
  y: number;
  t: number;
}

function resample(points: readonly TracePoint[], n: number): [number, number][] | null {
  const len: number[] = [0];
  for (let i = 1; i < points.length; i++)
    len.push(
      len[i - 1]! + Math.hypot(points[i]!.x - points[i - 1]!.x, points[i]!.y - points[i - 1]!.y),
    );
  const total = len[len.length - 1]!;
  if (total <= 0) return null;
  const out: [number, number][] = [];
  let j = 0;
  for (let k = 0; k < n; k++) {
    const at = (total * k) / (n - 1);
    while (j < points.length - 2 && len[j + 1]! < at) j++;
    const span = len[j + 1]! - len[j]!;
    const u = span > 0 ? Math.min(1, (at - len[j]!) / span) : 0;
    const [p, q] = [points[j]!, points[j + 1]!];
    out.push([p.x + (q.x - p.x) * u, p.y + (q.y - p.y) * u]);
  }
  return out;
}

const Z_CORNERS: [number, number][] = [
  [0, 0],
  [1, 0],
  [0, 1],
  [1, 1],
];
const TEMPLATES = [Z_CORNERS, Z_CORNERS.map(([x, y]) => [1 - x, y] as [number, number])].map((c) =>
  resample(
    c.map(([x, y], i) => ({ x, y, t: i })),
    RESAMPLED,
  )!,
);

export function zMismatch(points: readonly TracePoint[]): number {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const [x0, w] = [Math.min(...xs), Math.max(...xs) - Math.min(...xs)];
  const [y0, h] = [Math.min(...ys), Math.max(...ys) - Math.min(...ys)];
  if (w < MIN_WIDTH || h < MIN_TALL * w || h > MAX_TALL * w) return Infinity;
  const [first, last] = [points[0]!, points[points.length - 1]!];
  const fx = (first.x - x0) / w;
  const lx = (last.x - x0) / w;
  if (
    (first.y - y0) / h > END_HEIGHT ||
    (last.y - y0) / h < 1 - END_HEIGHT ||
    Math.min(fx, 1 - fx) > CORNER ||
    Math.min(lx, 1 - lx) > CORNER ||
    Math.round(fx) === Math.round(lx)
  )
    return Infinity;
  const shape = resample(
    points.map((p) => ({ x: (p.x - x0) / w, y: (p.y - y0) / h, t: p.t })),
    RESAMPLED,
  );
  if (!shape) return Infinity;
  return Math.min(
    ...TEMPLATES.map(
      (tpl) =>
        shape.reduce((s, [x, y], i) => s + Math.hypot(x - tpl[i]![0], y - tpl[i]![1]), 0) /
        RESAMPLED,
    ),
  );
}

export function tracesZ(points: readonly TracePoint[]): boolean {
  const end = points[points.length - 1];
  if (!end) return false;
  for (let i = points.length - 4; i >= 0; i--) {
    if (end.t - points[i]!.t < MIN_TRACE_MS) continue;
    if (zMismatch(points.slice(i)) <= MAX_MISMATCH) return true;
  }
  return false;
}

export interface TracedHand {
  id: number;
  landmarks: readonly Point[];
  shape: number;
}

type Path = { points: (TracePoint & { size: number; shaped: boolean })[]; seenAt: number };

export class TraceTracker {
  private paths = new Map<number, Path>();
  private tracedAt = -Infinity;

  push(hands: readonly TracedHand[], aspect: number, now: number): void {
    for (const [id, path] of this.paths)
      if (now - path.seenAt > TRACE_WINDOW_MS) this.paths.delete(id);
    for (const hand of hands) {
      const center = PALM.reduce(
        (s, i) => ({ x: s.x + hand.landmarks[i]!.x, y: s.y + hand.landmarks[i]!.y }),
        { x: 0, y: 0 },
      );
      const path = this.paths.get(hand.id) ?? { points: [], seenAt: now };
      this.paths.set(hand.id, path);
      path.seenAt = now;
      const points = path.points;
      points.push({
        x: center.x / PALM.length,
        y: (center.y * aspect) / PALM.length,
        t: now,
        size: handSize(hand.landmarks, aspect),
        shaped: hand.shape >= SHAPED,
      });
      while (points.length && now - points[0]!.t > TRACE_WINDOW_MS) points.shift();
      if (!points[points.length - 1]!.shaped) continue;
      if (points.filter((q) => q.shaped).length < MIN_SHAPED * points.length) continue;
      const unit = Math.max(...points.map((q) => q.size), 1e-6);
      if (tracesZ(points.map((q) => ({ x: q.x / unit, y: q.y / unit, t: q.t })))) {
        this.tracedAt = now;
        for (const q of this.paths.values()) q.points.length = 0;
      }
    }
  }

  weight(now: number): number {
    return now - this.tracedAt <= TRACE_HOLD_MS ? 1 : 0;
  }

  reset(): void {
    for (const q of this.paths.values()) q.points.length = 0;
    this.tracedAt = -Infinity;
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
