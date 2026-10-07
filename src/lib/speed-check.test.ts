import { describe, expect, it } from "vitest";
import { SpeedCheck } from "@/lib/speed-check";

const run = (fps: number, seconds: number) => {
  const check = new SpeedCheck();
  check.restart(0);
  let slow = false;
  let next = 0;
  for (let t = 0; t <= seconds * 1000; t += 16) {
    if (fps > 0 && t >= next) {
      check.record(t);
      next += 1000 / fps;
    }
    slow ||= check.tooSlow(t);
  }
  return slow;
};

describe("SpeedCheck", () => {
  it("lets a slow but usable device go on", () => {
    expect(run(1.8, 30)).toBe(false);
    expect(run(10, 30)).toBe(false);
  });

  it("stops a device that can't keep up after warming up", () => {
    expect(run(0.8, 30)).toBe(true);
    expect(run(0, 30)).toBe(true);
  });

  it("never decides during the warm-up and the first window", () => {
    expect(run(0, 12)).toBe(false);
  });

  it("does nothing until it is started", () => {
    const check = new SpeedCheck();
    expect(check.tooSlow(60_000)).toBe(false);
  });
});
