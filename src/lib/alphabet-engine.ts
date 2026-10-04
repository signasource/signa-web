// Runtime of the camera alphabet demo: MediaPipe Tasks (hand + pose) and the alphabet classifier,
// all running on the visitor's device. It runs inside a Web Worker (alphabet-worker.ts), never on
// the page's thread — see alphabet-client.ts. Docs: docs/features/landing.md
//
// MediaPipe comes from the CDN, pinned to the version signa-mobile's web engine ran; the hand and
// pose .task files are the ones the app ships (byte-identical to Google's float16/1 releases).
// The classifier is plain TypeScript (alphabet-classifier.ts) with weights served by this site.

import { createClassifier, type ClassifierManifest } from "@/lib/alphabet-classifier";
import { applyLocationRule, faceBlock, type Point } from "@/lib/alphabet-recognizer";
import { buildHandFeatures, type Vec3 } from "@/lib/hand-features";

const CDN = "https://cdn.jsdelivr.net/npm";
const VISION_VERSION = "0.10.22-rc.20250304";
const VISION_BUNDLE = `${CDN}/@mediapipe/tasks-vision@${VISION_VERSION}/vision_bundle.mjs`;
const VISION_WASM = `${CDN}/@mediapipe/tasks-vision@${VISION_VERSION}/wasm`;
const MEDIAPIPE_MODELS = "https://storage.googleapis.com/mediapipe-models";
const HAND_MODEL = `${MEDIAPIPE_MODELS}/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`;
const POSE_MODEL = `${MEDIAPIPE_MODELS}/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`;
/** Exported by signa-ml (scripts/export_alphabet_for_web.py). */
const CLASSIFIER_MANIFEST = "/reconocedor/alfabeto.json";
const CLASSIFIER_WEIGHTS = "/reconocedor/alfabeto.bin";

// ── Minimal typings of MediaPipe Tasks (only what is used) ────────────────

interface Landmark {
  x: number;
  y: number;
  z: number;
}
interface HandResult {
  landmarks: Landmark[][];
  worldLandmarks: Landmark[][];
  handedness: { categoryName: string; score: number }[][];
}
interface PoseResult {
  landmarks: Landmark[][];
}
/** What the detectors accept: a canvas on the page, an ImageBitmap inside the worker. */
export type Frame = HTMLCanvasElement | ImageBitmap;
interface Landmarker<R> {
  detect(image: Frame): R;
  close(): void;
}
interface LandmarkerFactory<R> {
  createFromOptions(fileset: unknown, options: Record<string, unknown>): Promise<Landmarker<R>>;
}
interface VisionModule {
  FilesetResolver: { forVisionTasks(path: string): Promise<unknown> };
  HandLandmarker: LandmarkerFactory<HandResult>;
  PoseLandmarker: LandmarkerFactory<PoseResult>;
}

// ── Public API ────────────────────────────────────────────────────────────

export interface HandDetection {
  /** Image landmarks, as detected (not flipped). */
  landmarks: Point[];
  /** Metric landmarks from MediaPipe's world head. */
  world: Point[];
  /** MediaPipe says it is a left hand: the model treats every hand as a right one. */
  mirrored: boolean;
}

export interface Detection {
  hand: HandDetection | null;
  pose: Point[] | null;
}

export interface AlphabetEngine {
  labels: string[];
  thresholds: Record<string, number>;
  /** `withPose` refreshes the face reference; otherwise the last pose is reused (it moves slowly). */
  detect(frame: Frame, withPose: boolean): Detection;
  /** Probability of each letter for this hand, with the T/I location rule applied. */
  predict(detection: Detection): Float32Array | null;
  close(): void;
}

async function loadClassifier() {
  const [manifest, weights] = await Promise.all([
    fetch(CLASSIFIER_MANIFEST).then((r) => {
      if (!r.ok) throw new Error(`Abecedario: HTTP ${r.status}`);
      return r.json() as Promise<ClassifierManifest>;
    }),
    fetch(CLASSIFIER_WEIGHTS).then((r) => {
      if (!r.ok) throw new Error(`Abecedario: HTTP ${r.status}`);
      return r.arrayBuffer();
    }),
  ]);
  return createClassifier(manifest, weights);
}

async function loadDetectors() {
  const vision = (await import(
    /* webpackIgnore: true */ /* turbopackIgnore: true */ VISION_BUNDLE
  )) as VisionModule;
  const fileset = await vision.FilesetResolver.forVisionTasks(VISION_WASM);
  // Same settings signa-ml uses to build the dataset (src/data/tasks_extractor.py,
  // detectores_estaticos): image mode, one hand, detection floor 0.4.
  const create = async (delegate: "GPU" | "CPU") => {
    const hands = await vision.HandLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: HAND_MODEL, delegate },
      runningMode: "IMAGE",
      numHands: 1,
      minHandDetectionConfidence: 0.4,
    });
    try {
      const pose = await vision.PoseLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: POSE_MODEL, delegate },
        runningMode: "IMAGE",
        numPoses: 1,
      });
      return { hands, pose };
    } catch (e) {
      hands.close();
      throw e;
    }
  };
  // GPU when the browser has it; some don't open MediaPipe's GPU graph, and CPU still works.
  try {
    return await create("GPU");
  } catch {
    return create("CPU");
  }
}

const toPoint = (p: Landmark): Point => ({ x: p.x, y: p.y, z: p.z });
const toVec = (p: Point, sign: number): Vec3 => [sign * p.x, p.y, p.z ?? 0];

export async function createAlphabetEngine(): Promise<AlphabetEngine> {
  const [classifier, detectors] = await Promise.all([loadClassifier(), loadDetectors()]);
  const { labels, thresholds } = classifier.manifest;
  let lastPose: Point[] | null = null;

  return {
    labels,
    thresholds,

    detect(frame, withPose) {
      if (withPose || !lastPose) {
        const pose = detectors.pose.detect(frame).landmarks[0];
        lastPose = pose ? pose.map(toPoint) : null;
      }
      const r = detectors.hands.detect(frame);
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
      if (!hand) return null;
      // The dataset treats every hand as a right one: a left hand is flipped in x, and the face
      // block is measured on the unflipped hand with the flip flag (build_alphabet_dataset.py).
      const sign = hand.mirrored ? -1 : 1;
      const features = buildHandFeatures(
        hand.landmarks.map((p) => toVec(p, sign)),
        hand.world.length ? hand.world.map((p) => toVec(p, sign)) : null,
      );
      const face = faceBlock(pose, hand.landmarks, hand.mirrored);
      return applyLocationRule(classifier.predict(features, face), labels, face);
    },

    close() {
      detectors.hands.close();
      detectors.pose.close();
    },
  };
}
