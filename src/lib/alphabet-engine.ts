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
  detect(frame: Frame, withPose: boolean): Detection;
  predict(detection: Detection): Float32Array | null;
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

async function loadDetectors() {
  const [fileset, handModel, poseModel] = await Promise.all([
    FilesetResolver.forVisionTasks(WASM_PATH),
    fetchVerified(HAND_MODEL.url, HAND_MODEL.sha256),
    fetchVerified(POSE_MODEL.url, POSE_MODEL.sha256),
  ]);
  const hands = await HandLandmarker.createFromOptions(fileset, {
    baseOptions: { modelAssetBuffer: handModel, delegate: "CPU" },
    runningMode: "IMAGE",
    numHands: 1,
    minHandDetectionConfidence: 0.4,
  });
  try {
    const pose = await PoseLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetBuffer: poseModel, delegate: "CPU" },
      runningMode: "IMAGE",
      numPoses: 1,
    });
    return { hands, pose };
  } catch (e) {
    hands.close();
    throw e;
  }
}

const toPoint = (p: NormalizedLandmark): Point => ({ x: p.x, y: p.y, z: p.z });
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
