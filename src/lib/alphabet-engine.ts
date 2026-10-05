import {
  FilesetResolver,
  HandLandmarker,
  PoseLandmarker,
  type NormalizedLandmark,
} from "@mediapipe/tasks-vision";
import { createClassifier, type ClassifierManifest } from "@/lib/alphabet-classifier";
import {
  applyLocationRule,
  faceBlock,
  pickPrimary,
  fingerUp,
  TraceTracker,
  TRACED_LETTERS,
  touchWeight,
  TWO_HANDED,
  type Point,
} from "@/lib/alphabet-recognizer";
import { buildHandFeatures, type Vec3 } from "@/lib/hand-features";
import { fetchVerified } from "@/lib/integrity";
import type { Delegate } from "@/lib/delegate-choice";

const WASM_PATH = "/mediapipe/wasm";
const KEEP_TRACK_MS = 1000;
const MODELS = "https://storage.googleapis.com/mediapipe-models";
const HAND_MODEL = {
  url: `${MODELS}/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
  sha256: "fbc2a30080c3c557093b5ddfc334698132eb341044ccee322ccf8bcf3607cde1",
};
const POSE_MODEL = {
  url: `${MODELS}/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`,
  sha256: "59929e1d1ee95287735ddd833b19cf4ac46d29bc7afddbbf6753c459690d574a",
};
const CLASSIFIER_MANIFEST = "/reconocedor/alfabeto.json";
const CLASSIFIER_WEIGHTS = "/reconocedor/alfabeto.bin";

export type Frame = HTMLCanvasElement | ImageBitmap;

export interface HandDetection {
  landmarks: Point[];
  world: Point[];
  mirrored: boolean;
}

export interface Detection {
  hand: HandDetection | null;
  other: HandDetection | null;
  pose: Point[] | null;
  aspect: number;
}

export interface AlphabetEngine {
  labels: string[];
  thresholds: Record<string, number>;
  handDelegate: Delegate;
  lastHandMs: number;
  switchHands(delegate: Delegate): Promise<boolean>;
  detect(frame: Frame, withPose: boolean): Detection;
  setHandCount(count: 1 | 2): Promise<void>;
  predict(detection: Detection): Float32Array | null;
  resetTrace(): void;
  lastFeatures: Float32Array | null;
  close(): void;
}

async function loadClassifier() {
  const [manifest, weights] = await Promise.all([
    fetch(CLASSIFIER_MANIFEST).then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json() as Promise<ClassifierManifest>;
    }),
    fetch(CLASSIFIER_WEIGHTS).then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.arrayBuffer();
    }),
  ]);
  return createClassifier(manifest, weights);
}

type Fileset = Awaited<ReturnType<typeof FilesetResolver.forVisionTasks>>;

function createHands(fileset: Fileset, model: Uint8Array, delegate: Delegate) {
  return HandLandmarker.createFromOptions(fileset, {
    baseOptions: { modelAssetBuffer: model.slice(), delegate },
    runningMode: "IMAGE",
    numHands: 1,
    minHandDetectionConfidence: 0.4,
    ...(delegate === "GPU" && typeof OffscreenCanvas !== "undefined"
      ? { canvas: new OffscreenCanvas(1, 1) }
      : {}),
  });
}

async function startHands(fileset: Fileset, model: Uint8Array, preferred: Delegate) {
  if (preferred === "GPU") {
    try {
      return { hands: await createHands(fileset, model, "GPU"), delegate: "GPU" as Delegate };
    } catch {}
  }
  return { hands: await createHands(fileset, model, "CPU"), delegate: "CPU" as Delegate };
}

async function loadDetectors(preferred: Delegate) {
  const [fileset, handBuffer, poseModel] = await Promise.all([
    FilesetResolver.forVisionTasks(WASM_PATH),
    fetchVerified(HAND_MODEL.url, HAND_MODEL.sha256),
    fetchVerified(POSE_MODEL.url, POSE_MODEL.sha256),
  ]);
  const handModel = new Uint8Array(handBuffer);
  const { hands, delegate } = await startHands(fileset, handModel, preferred);
  try {
    const pose = await PoseLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetBuffer: poseModel, delegate: "CPU" },
      runningMode: "IMAGE",
      numPoses: 1,
    });
    return { fileset, handModel, hands, handDelegate: delegate, pose };
  } catch (e) {
    hands.close();
    throw e;
  }
}

const toPoint = (p: NormalizedLandmark): Point => ({ x: p.x, y: p.y, z: p.z });
const toVec = (p: Point, sign: number): Vec3 => [sign * p.x, p.y, p.z ?? 0];

export async function createAlphabetEngine(preferred: Delegate = "CPU"): Promise<AlphabetEngine> {
  const [classifier, detectors] = await Promise.all([loadClassifier(), loadDetectors(preferred)]);
  const { labels, thresholds } = classifier.manifest;
  let lastPose: Point[] | null = null;
  let lastWrist: Point | null = null;
  let lastSeen = 0;
  let handCount: 1 | 2 = 1;
  let lastClassified: Float32Array | null = null;
  const traced = TRACED_LETTERS.map((l) => labels.indexOf(l)).filter((i) => i >= 0);
  const trace = traced.length ? new TraceTracker() : null;

  const classify = (hand: HandDetection, pose: Point[] | null) => {
    const sign = hand.mirrored ? -1 : 1;
    const features = buildHandFeatures(
      hand.landmarks.map((p) => toVec(p, sign)),
      hand.world.length ? hand.world.map((p) => toVec(p, sign)) : null,
    );
    const face = faceBlock(pose, hand.landmarks, hand.mirrored);
    const all = new Float32Array(features.length + face.length);
    all.set(features);
    all.set(face, features.length);
    lastClassified = all;
    return Float32Array.from(applyLocationRule(classifier.predict(features, face), labels, face));
  };

  const engine: AlphabetEngine = {
    labels,
    thresholds,
    handDelegate: detectors.handDelegate,
    lastHandMs: 0,
    lastFeatures: null,

    resetTrace() {
      trace?.reset();
    },

    async switchHands(delegate) {
      if (delegate === this.handDelegate) return true;
      try {
        const next = await createHands(detectors.fileset, detectors.handModel, delegate);
        await next.setOptions({ numHands: handCount });
        detectors.hands.close();
        detectors.hands = next;
        this.handDelegate = delegate;
        return true;
      } catch {
        return false;
      }
    },

    async setHandCount(count) {
      if (count === handCount) return;
      handCount = count;
      await detectors.hands.setOptions({ numHands: count });
    },

    detect(frame, withPose) {
      if (withPose || !lastPose) {
        const pose = detectors.pose.detect(frame).landmarks[0];
        lastPose = pose ? pose.map(toPoint) : null;
      }
      const t0 = performance.now();
      const r = detectors.hands.detect(frame);
      this.lastHandMs = performance.now() - t0;
      const aspect = frame.height / frame.width;
      const hands = r.landmarks.map((lm, i) => ({
        landmarks: lm.map(toPoint),
        world: (r.worldLandmarks[i] ?? []).map(toPoint),
        mirrored: (r.handedness[i]?.[0]?.categoryName ?? "Right").toLowerCase().startsWith("l"),
      }));
      const main = pickPrimary(
        hands.map((h) => h.landmarks),
        lastWrist,
        aspect,
      );
      const hand = hands[main] ?? null;
      const now = performance.now();
      if (hand) [lastWrist, lastSeen] = [hand.landmarks[0]!, now];
      else if (now - lastSeen > KEEP_TRACK_MS) lastWrist = null;
      trace?.push(hand?.landmarks ?? null, aspect, hand?.mirrored ?? false, performance.now());
      const other = hands.find((_, i) => i !== main) ?? null;
      return { hand, other, pose: lastPose, aspect };
    },

    predict({ hand, other, pose, aspect }) {
      if (!hand) return null;
      const probs = classify(hand, pose);
      this.lastFeatures = lastClassified;
      const second = other ? classify(other, pose) : null;
      if (second) for (let i = 0; i < probs.length; i++) probs[i] = Math.max(probs[i]!, second[i]!);
      const touch = touchWeight(hand.landmarks, other?.landmarks ?? null, aspect);
      for (const letter of TWO_HANDED) {
        const i = labels.indexOf(letter);
        if (i >= 0) probs[i] = probs[i]! * touch;
      }
      if (trace) {
        const open = trace.weight(performance.now());
        const shape = (h: HandDetection | null) =>
          h ? fingerUp(h.world.length ? h.world : h.landmarks) : 0;
        const pinky = Math.max(shape(hand), shape(other));
        trace.release(pinky);
        const z = pinky * open;
        for (const i of traced) probs[i] = z;
      }
      return probs;
    },

    close() {
      detectors.hands.close();
      detectors.pose.close();
    },
  };
  return engine;
}
