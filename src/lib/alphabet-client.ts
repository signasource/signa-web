// Page side of the camera demo's recognizer: starts the worker (alphabet-worker.ts) and sends it
// frames, one at a time. Docs: docs/features/landing.md

import type { Point } from "@/lib/alphabet-recognizer";

export type WorkerRequest =
  { type: "init" } | { type: "frame"; bitmap: ImageBitmap; withPose: boolean; classify: boolean };

export type WorkerResponse =
  | { type: "ready"; labels: string[]; thresholds: Record<string, number> }
  | { type: "error"; message: string }
  | { type: "result"; landmarks: Point[] | null; probs: Float32Array | null };

export interface FrameResult {
  /** The hand's landmarks in the frame, or null without a hand. */
  landmarks: Point[] | null;
  /** Letter probabilities, when `classify` was asked and there was a hand. */
  probs: Float32Array | null;
}

export interface RecognizerClient {
  labels: string[];
  thresholds: Record<string, number>;
  /** Detects (and classifies) one frame. The bitmap is transferred: don't use it after. */
  process(bitmap: ImageBitmap, withPose: boolean, classify: boolean): Promise<FrameResult>;
  close(): void;
}

export function createRecognizerClient(): Promise<RecognizerClient> {
  const worker = new Worker(new URL("./alphabet-worker.ts", import.meta.url), { type: "module" });
  const send = (message: WorkerRequest, transfer: Transferable[] = []) =>
    worker.postMessage(message, transfer);

  return new Promise((resolve, reject) => {
    let pending: ((r: FrameResult) => void) | null = null;

    worker.onerror = (e) => {
      worker.terminate();
      reject(new Error(e.message || "No arrancó el reconocedor"));
    };
    worker.onmessage = ({ data }: MessageEvent<WorkerResponse>) => {
      if (data.type === "error") {
        worker.terminate();
        reject(new Error(data.message));
      } else if (data.type === "ready") {
        resolve({
          labels: data.labels,
          thresholds: data.thresholds,
          process(bitmap, withPose, classify) {
            return new Promise((done) => {
              pending = done;
              send({ type: "frame", bitmap, withPose, classify }, [bitmap]);
            });
          },
          close: () => worker.terminate(),
        });
      } else if (data.type === "result") {
        const done = pending;
        pending = null;
        done?.({ landmarks: data.landmarks, probs: data.probs });
      }
    };
    send({ type: "init" });
  });
}
