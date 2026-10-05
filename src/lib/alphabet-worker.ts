import { createAlphabetEngine, type AlphabetEngine } from "@/lib/alphabet-engine";
import type { WorkerRequest, WorkerResponse } from "@/lib/alphabet-client";
import { DelegateTrial, hasHardwareGl } from "@/lib/delegate-choice";

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
let trial = new DelegateTrial(true);
let switching = false;
let pending: "GPU" | null = null;

async function step(ms: number) {
  if (!engine || switching) return;
  if (pending) {
    pending = null;
    switching = true;
    const ok = await engine.switchHands("GPU");
    switching = false;
    if (!ok) scope.postMessage({ type: "decided", delegate: "CPU", cpuMs: 0, gpuMs: null });
    return;
  }
  if (!trial.running) return;
  let next = trial.record(ms);
  if (next.action === "try-gpu" && !hasHardwareGl()) next = trial.failed();
  if (next.action === "try-gpu") {
    switching = true;
    const ok = await engine.switchHands("GPU");
    switching = false;
    if (ok) return;
    next = trial.failed();
  }
  if (next.action === "decide") {
    if (next.delegate !== engine.handDelegate) {
      switching = true;
      await engine.switchHands(next.delegate);
      switching = false;
    }
    scope.postMessage({
      type: "decided",
      delegate: engine.handDelegate,
      cpuMs: next.cpuMs,
      gpuMs: next.gpuMs,
    });
  }
}

scope.onmessage = async ({ data }) => {
  if (data.type === "init") {
    try {
      engine = await createAlphabetEngine("CPU");
      trial = new DelegateTrial(data.delegate !== null);
      pending = data.delegate === "GPU" ? "GPU" : null;
      scope.postMessage({ type: "ready", labels: engine.labels, thresholds: engine.thresholds });
    } catch (e) {
      scope.postMessage({ type: "error", message: e instanceof Error ? e.message : String(e) });
    }
    return;
  }
  if (data.type === "reset-trace") {
    engine?.resetTrace();
    return;
  }
  if (data.type === "frame") {
    const { bitmap, withPose, classify, capture } = data;
    try {
      if (!engine) throw new Error("El reconocedor no está listo");
      const detection = engine.detect(bitmap, withPose);
      const probs = classify ? engine.predict(detection) : null;
      const handMs = engine.lastHandMs;
      scope.postMessage({
        type: "result",
        landmarks: detection.hand?.landmarks ?? null,
        other: detection.other?.landmarks ?? null,
        features: capture && probs ? engine.lastFeatures : null,
        probs,
        delegate: engine.handDelegate,
        handMs,
      });
      void step(handMs);
    } catch {
      scope.postMessage({
        type: "result",
        landmarks: null,
        other: null,
        features: null,
        probs: null,
        delegate: engine?.handDelegate ?? "CPU",
        handMs: 0,
      });
    } finally {
      bitmap.close();
    }
  }
};
