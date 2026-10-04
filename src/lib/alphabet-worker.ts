import { createAlphabetEngine, type AlphabetEngine } from "@/lib/alphabet-engine";
import type { WorkerRequest, WorkerResponse } from "@/lib/alphabet-client";

const scope = self as unknown as {
  onmessage: ((e: MessageEvent<WorkerRequest>) => void) | null;
  postMessage(message: WorkerResponse): void;
};

const consoleError = console.error.bind(console);
console.error = (...args: unknown[]) => {
  if (typeof args[0] === "string" && args[0].startsWith("INFO:")) return;
  consoleError(...args);
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
      scope.postMessage({ type: "result", landmarks: null, probs: null });
    } finally {
      bitmap.close();
    }
  }
};
