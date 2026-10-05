import type { Point } from "@/lib/alphabet-recognizer";
import { storedDelegate, storeDelegate, type Delegate } from "@/lib/delegate-choice";

export type WorkerRequest =
  | { type: "init"; delegate: Delegate | null }
  | { type: "reset-trace" }
  | {
      type: "frame";
      bitmap: ImageBitmap;
      withPose: boolean;
      classify: boolean;
      capture?: boolean;
      twoHands?: boolean;
    };

export type WorkerResponse =
  | { type: "ready"; labels: string[]; thresholds: Record<string, number> }
  | { type: "error"; message: string }
  | {
      type: "result";
      landmarks: Point[] | null;
      other: Point[] | null;
      features: Float32Array | null;
      probs: Float32Array | null;
      delegate: Delegate;
      handMs: number;
    }
  | { type: "decided"; delegate: Delegate; cpuMs: number; gpuMs: number | null };

export interface FrameResult {
  landmarks: Point[] | null;
  other: Point[] | null;
  features: Float32Array | null;
  probs: Float32Array | null;
  delegate: Delegate;
  handMs: number;
}

export interface RecognizerClient {
  labels: string[];
  thresholds: Record<string, number>;
  process(
    bitmap: ImageBitmap,
    withPose: boolean,
    classify: boolean,
    capture?: boolean,
    twoHands?: boolean,
  ): Promise<FrameResult>;
  resetTrace(): void;
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
          process(bitmap, withPose, classify, capture, twoHands) {
            return new Promise((done) => {
              pending = done;
              send({ type: "frame", bitmap, withPose, classify, capture, twoHands }, [bitmap]);
            });
          },
          resetTrace: () => send({ type: "reset-trace" }),
          close: () => worker.terminate(),
        });
      } else if (data.type === "result") {
        const done = pending;
        pending = null;
        done?.({
          landmarks: data.landmarks,
          other: data.other,
          features: data.features,
          probs: data.probs,
          delegate: data.delegate,
          handMs: data.handMs,
        });
      } else if (data.type === "decided") {
        storeDelegate(data.delegate);
      }
    };
    send({ type: "init", delegate: storedDelegate() });
  });
}
