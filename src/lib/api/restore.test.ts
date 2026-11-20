import { describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/client";
import { restoreWithRetry } from "@/lib/api/restore";

describe("restoreWithRetry", () => {
  it("retries transient failures and then succeeds", async () => {
    const load = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new TypeError("network"))
      .mockRejectedValueOnce(new ApiError(503, "down"))
      .mockResolvedValue("ok");
    await expect(restoreWithRetry(load, [0, 0])).resolves.toBe("ok");
    expect(load).toHaveBeenCalledTimes(3);
  });

  it("rejects at once on a definitive error", async () => {
    const load = vi.fn<() => Promise<string>>().mockRejectedValue(new ApiError(403, "no"));
    await expect(restoreWithRetry(load, [0, 0])).rejects.toMatchObject({ status: 403 });
    expect(load).toHaveBeenCalledTimes(1);
  });

  it("gives up after the last delay", async () => {
    const load = vi.fn<() => Promise<string>>().mockRejectedValue(new TypeError("network"));
    await expect(restoreWithRetry(load, [0])).rejects.toBeInstanceOf(TypeError);
    expect(load).toHaveBeenCalledTimes(2);
  });
});
