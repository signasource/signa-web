// The 258 hand features of the alphabet model, ported line by line from signa-ml
// (src/data/hand_features.py · build_features). The model only knows these exact numbers:
// alphabet-classifier.test.ts checks this port against the Python output on real hands.

export type Vec3 = readonly [number, number, number];

const WRIST = 0;
const INDEX_MCP = 5;
const MIDDLE_MCP = 9;
const PINKY_MCP = 17;
/** Wrist, the 4 knuckles and the 5 fingertips: all their pairwise distances (45). */
const KEY_POINTS = [0, 5, 9, 13, 17, 4, 8, 12, 16, 20] as const;
/** Wrist → fingertip chains; flexion is measured at the 3 middle joints of each finger. */
const FINGER_CHAINS = [
  [0, 1, 2, 3, 4],
  [0, 5, 6, 7, 8],
  [0, 9, 10, 11, 12],
  [0, 13, 14, 15, 16],
  [0, 17, 18, 19, 20],
] as const;

export const HAND_FEATURES = 63 + 63 + 9 + 45 + 15 + 63;

const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const scale = (a: Vec3, k: number): Vec3 => [a[0] * k, a[1] * k, a[2] * k];
const norm = (a: Vec3) => Math.sqrt(dot(a, a));
const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
function unit(a: Vec3): Vec3 {
  const n = norm(a);
  return n > 1e-8 ? scale(a, 1 / n) : [0, 0, 0];
}

/** The hand's own orthonormal frame: e_y along the palm, e_x across it, e_z its normal. */
function handFrame(lm: readonly Vec3[]): { axes: [Vec3, Vec3, Vec3]; size: number } {
  const up = sub(lm[MIDDLE_MCP]!, lm[WRIST]!);
  const size = norm(up);
  if (size < 1e-8) {
    return {
      axes: [
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1],
      ],
      size: 1,
    };
  }
  const ey = scale(up, 1 / size);
  const across = sub(lm[PINKY_MCP]!, lm[INDEX_MCP]!);
  let ex = unit(sub(across, scale(ey, dot(across, ey))));
  if (ex.every((v) => Math.abs(v) <= 1e-8)) {
    // Palm seen exactly edge-on: any perpendicular will do.
    ex = unit(cross(ey, [0, 0, 1]));
  }
  return { axes: [ex, ey, cross(ex, ey)], size };
}

function canonical(lm: readonly Vec3[]): Vec3[] {
  const { axes, size } = handFrame(lm);
  const wrist = lm[WRIST]!;
  return lm.map((p) => {
    const c = sub(p, wrist);
    return [dot(c, axes[0]) / size, dot(c, axes[1]) / size, dot(c, axes[2]) / size];
  });
}

/**
 * 258 values: image landmarks keeping orientation (63), in the hand's frame (63), the frame's
 * axes (9), distances between key points (45), joint flexion cosines (15), and the metric
 * ("world") landmarks in the hand's frame (63). `lm` and `world` already flipped for a left hand.
 */
export function buildHandFeatures(
  lm: readonly Vec3[],
  world: readonly Vec3[] | null,
): Float64Array {
  const out = new Float64Array(HAND_FEATURES);
  let k = 0;
  const push = (...values: number[]) => {
    for (const v of values) out[k++] = v;
  };

  const { axes, size } = handFrame(lm);
  const canon = canonical(lm);
  const wrist = lm[WRIST]!;

  for (const p of lm) push(...scale(sub(p, wrist), 1 / size));
  for (const p of canon) push(...p);
  for (const axis of axes) push(...axis);

  for (let i = 0; i < KEY_POINTS.length; i++) {
    for (let j = i + 1; j < KEY_POINTS.length; j++) {
      push(norm(sub(canon[KEY_POINTS[i]!]!, canon[KEY_POINTS[j]!]!)));
    }
  }

  for (const chain of FINGER_CHAINS) {
    for (let i = 1; i < 4; i++) {
      const joint = canon[chain[i]!]!;
      const a = unit(sub(canon[chain[i - 1]!]!, joint));
      const b = unit(sub(canon[chain[i + 1]!]!, joint));
      push(-dot(a, b));
    }
  }

  if (world && world.length === 21) for (const p of canonical(world)) push(...p);
  return out;
}
