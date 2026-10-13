import { describe, expect, it } from "vitest";
import { DelegateTrial, SLOW_CPU_MS } from "@/lib/delegate-choice";

const feed = (trial: DelegateTrial, ms: number, n: number) => {
  let last = trial.record(ms);
  for (let i = 1; i < n; i++) last = trial.record(ms);
  return last;
};

describe("DelegateTrial", () => {
  it("does nothing when a delegate was already chosen", () => {
    const trial = new DelegateTrial(true);
    expect(feed(trial, 200, 30)).toEqual({ action: "none" });
    expect(trial.running).toBe(false);
  });

  it("keeps the CPU without trying the GPU when the CPU is fast", () => {
    const trial = new DelegateTrial(false);
    expect(feed(trial, 12, 14)).toEqual({ action: "none" });
    expect(trial.record(12)).toEqual({ action: "decide", delegate: "CPU", cpuMs: 12, gpuMs: null });
  });

  it("ignores the warm-up frames", () => {
    const trial = new DelegateTrial(false);
    trial.record(500);
    trial.record(500);
    trial.record(500);
    expect(feed(trial, 10, 12)).toEqual({
      action: "decide",
      delegate: "CPU",
      cpuMs: 10,
      gpuMs: null,
    });
  });

  it("tries the GPU when the CPU is slow and keeps it only if clearly faster", () => {
    const slow = SLOW_CPU_MS * 2;
    const wins = new DelegateTrial(false);
    expect(feed(wins, slow, 15)).toEqual({ action: "try-gpu" });
    expect(feed(wins, slow / 2, 15)).toEqual({
      action: "decide",
      delegate: "GPU",
      cpuMs: slow,
      gpuMs: slow / 2,
    });

    const loses = new DelegateTrial(false);
    feed(loses, slow, 15);
    expect(feed(loses, slow * 0.95, 15)).toMatchObject({ action: "decide", delegate: "CPU" });
  });

  it("falls back to the CPU when the GPU cannot start", () => {
    const trial = new DelegateTrial(false);
    feed(trial, SLOW_CPU_MS * 2, 15);
    expect(trial.failed()).toMatchObject({ action: "decide", delegate: "CPU" });
    expect(trial.running).toBe(false);
  });

  it("abandons the GPU as soon as it is clearly slower than the CPU", () => {
    const trial = new DelegateTrial(false);
    feed(trial, SLOW_CPU_MS * 2, 15);
    expect(trial.record(5000)).toEqual({ action: "none" });
    expect(trial.record(SLOW_CPU_MS * 5)).toMatchObject({ action: "decide", delegate: "CPU" });
    expect(trial.running).toBe(false);
  });
});
