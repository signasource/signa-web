import {
  FilesetResolver,
  HandLandmarker,
  PoseLandmarker,
  type NormalizedLandmark,
} from "@mediapipe/tasks-vision";
import { createClassifier, type ClassifierManifest } from "@/lib/alphabet-classifier";
import { applyLocationRule, faceBlock, type Point } from "@/lib/alphabet-recognizer";
import { buildHandFeatures, type Vec3 } from "@/lib/hand-features";
import { fetchVerified } from "@/lib/integrity";
import type { Delegate } from "@/lib/delegate-choice";

const WASM_PATH = "/mediapipe/wasm";
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
  pose: Point[] | null;
}

export interface AlphabetEngine {
  labels: string[];
  thresholds: Record<string, number>;
  handDelegate: Delegate;
  lastHandMs: number;
  switchHands(delegate: Delegate): Promise<boolean>;
  detect(frame: Frame, withPose: boolean): Detection;
  predict(detection: Detection): Float32Array | null;
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

  const engine: AlphabetEngine = {
    labels,
    thresholds,
    handDelegate: detectors.handDelegate,
    lastFeatures: null,
    lastHandMs: 0,

    async switchHands(delegate) {
      if (delegate === this.handDelegate) return true;
      try {
        const next = await createHands(detectors.fileset, detectors.handModel, delegate);
        detectors.hands.close();
        detectors.hands = next;
        this.handDelegate = delegate;
        return true;
      } catch {
        return false;
      }
    },

    detect(frame, withPose) {
      if (withPose || !lastPose) {
        const pose = detectors.pose.detect(frame).landmarks[0];
        lastPose = pose ? pose.map(toPoint) : null;
      }
      const t0 = performance.now();
      const r = detectors.hands.detect(frame);
      this.lastHandMs = performance.now() - t0;
      const landmarks = r.landmarks[0];
      if (!landmarks) return { hand: null, pose: lastPose };
      const label = r.handedness[0]?.[0]?.categoryName ?? "Right";
      return {
        hand: {
          landmarks: landmarks.map(toPoint),
          world: (r.worldLandmarks[0] ?? []).map(toPoint),
          mirrored: label.toLowerCase().startsWith("l"),
        },
        pose: lastPose,
      };
    },

    predict({ hand, pose }) {
      this.lastFeatures = null;
      if (!hand) return null;
      const sign = hand.mirrored ? -1 : 1;
      const features = buildHandFeatures(
        hand.landmarks.map((p) => toVec(p, sign)),
        hand.world.length ? hand.world.map((p) => toVec(p, sign)) : null,
      );
      const face = faceBlock(pose, hand.landmarks, hand.mirrored);
      const all = new Float32Array(features.length + face.length);
      all.set(features);
      all.set(face, features.length);
      this.lastFeatures = all;
      return applyLocationRule(classifier.predict(features, face), labels, face);
    },

    close() {
      detectors.hands.close();
      detectors.pose.close();
    },
  };
  return engine;
}
