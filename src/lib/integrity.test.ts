import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchVerified, sha256Hex } from "@/lib/integrity";

const bytes = new TextEncoder().encode("signa").buffer as ArrayBuffer;
const SIGNA_SHA256 = "fff54f2073829bb9f53e03f1a660ac1b97005b09bcd539d00fdf77b8ab3960ea";

describe("integrity", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("hashes with SHA-256", async () => {
    expect(await sha256Hex(bytes)).toBe(SIGNA_SHA256);
  });

  it("returns the file when it matches its pinned hash", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(bytes)));
    expect((await fetchVerified("https://x/model", SIGNA_SHA256)).byteLength).toBe(5);
  });

  it("rejects a file that doesn't match", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("tampered")));
    await expect(fetchVerified("https://x/model", SIGNA_SHA256)).rejects.toThrow();
  });

  it("rejects a failed download", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("", { status: 404 })));
    await expect(fetchVerified("https://x/model", SIGNA_SHA256)).rejects.toThrow();
  });
});
