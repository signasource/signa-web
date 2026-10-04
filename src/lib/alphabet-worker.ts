// Web Worker of the camera demo: detection (MediaPipe) and classification off the page's thread.
//
// signa-ml's demo page is smooth because detection runs on its Python server: the browser only
// draws. Run on the page's own thread, every detection (and the pose, every few frames) froze the
// drawing for a few milliseconds and the skeleton moved in jerks. Here the page only draws, the
// same as there. Docs: docs/features/landing.md

import { createAlphabetEngine, type AlphabetEngine } from "@/lib/alphabet-engine";
import type { WorkerRequest, WorkerResponse } from "@/lib/alphabet-client";

// The project's TS lib is "dom"; the worker scope only needs these two members.
const scope = self as unknown as {
  onmessage: ((e: MessageEvent<WorkerRequest>) => void) | null;
  postMessage(message: WorkerResponse): void;
};

let engine: AlphabetEngine | null = null;

scope.onmessage = async ({ data }) => {
  if (data.type === "init") {
    try {
      engine = await createAlphabetEngine();
      scope.postMessage({ type: "ready", labels: engine.labels, thresholds: engine.thresholds });
    } catch (e) {
      scope.postMessage({ type: "error", message: e instanceof Error ? e.message : String(e) });
    }
    return;
  }
  if (data.type === "frame") {
    const { bitmap, withPose, classify } = data;
    try {
      if (!engine) throw new Error("El reconocedor no está listo");
      const detection = engine.detect(bitmap, withPose);
      const probs = classify ? engine.predict(detection) : null;
      scope.postMessage({ type: "result", landmarks: detection.hand?.landmarks ?? null, probs });
    } catch {
      // A frame the detector can't read (the camera still warming up) counts as "no hand".
      scope.postMessage({ type: "result", landmarks: null, probs: null });
    } finally {
      bitmap.close();
    }
  }
};
