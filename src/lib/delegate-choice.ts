export type Delegate = "CPU" | "GPU";

export const SLOW_CPU_MS = 30;
const WARMUP = 3;
const SAMPLE = 12;
const GPU_MARGIN = 0.85;
const GPU_ABORT = 2;

export type TrialStep =
  | { action: "none" }
  | { action: "try-gpu" }
  | { action: "decide"; delegate: Delegate; cpuMs: number; gpuMs: number | null };

const average = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

export class DelegateTrial {
  private phase: "cpu" | "gpu" | "done";
  private seen = 0;
  private times: number[] = [];
  private cpuMs = 0;

  constructor(decided: boolean) {
    this.phase = decided ? "done" : "cpu";
  }

  get running(): boolean {
    return this.phase !== "done";
  }

  record(ms: number): TrialStep {
    if (this.phase === "done") return { action: "none" };
    this.seen++;
    if (this.phase === "gpu" && this.seen > 1 && ms > this.cpuMs * GPU_ABORT) {
      this.phase = "done";
      return { action: "decide", delegate: "CPU", cpuMs: this.cpuMs, gpuMs: ms };
    }
    if (this.seen <= WARMUP) return { action: "none" };
    this.times.push(ms);
    if (this.times.length < SAMPLE) return { action: "none" };

    const avg = average(this.times);
    this.times = [];
    this.seen = 0;
    if (this.phase === "cpu") {
      this.cpuMs = avg;
      if (avg <= SLOW_CPU_MS) {
        this.phase = "done";
        return { action: "decide", delegate: "CPU", cpuMs: avg, gpuMs: null };
      }
      this.phase = "gpu";
      return { action: "try-gpu" };
    }
    this.phase = "done";
    return {
      action: "decide",
      delegate: avg < this.cpuMs * GPU_MARGIN ? "GPU" : "CPU",
      cpuMs: this.cpuMs,
      gpuMs: avg,
    };
  }

  failed(): TrialStep {
    this.phase = "done";
    return { action: "decide", delegate: "CPU", cpuMs: this.cpuMs, gpuMs: null };
  }
}

const SOFTWARE_GL = /swiftshader|llvmpipe|softpipe|software|basic render/i;

export function hasHardwareGl(): boolean {
  try {
    if (typeof OffscreenCanvas === "undefined") return false;
    const gl = new OffscreenCanvas(1, 1).getContext("webgl2");
    if (!gl) return false;
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = String(
      gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER) ?? "",
    );
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return !SOFTWARE_GL.test(renderer);
  } catch {
    return false;
  }
}

const STORAGE_KEY = "signa:reconocimiento:delegado:v1";

export function storedDelegate(): Delegate | null {
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return v === "CPU" || v === "GPU" ? v : null;
  } catch {
    return null;
  }
}

export function storeDelegate(delegate: Delegate): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, delegate);
  } catch {}
}
