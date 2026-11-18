import { describe, expect, it } from "vitest";
import { parseSignList, resolveSignMedia } from "@/lib/sign-formats";

const served =
  (...names: string[]) =>
  async (url: string) =>
    names.some((n) => url.endsWith(n));

describe("resolveSignMedia", () => {
  it("prefers the 3D avatar", async () => {
    const media = await resolveSignMedia("hola", served("/hola.glb", "/hola.mp4"));
    expect(media).toMatchObject({ format: "glb", lateralUrl: null });
    expect(media?.url).toMatch(/\/lsa\/hola\.glb$/);
  });

  it("falls back to the video and its lateral take", async () => {
    const media = await resolveSignMedia("hola", served("/hola.mp4", "/hola_lateral.mp4"));
    expect(media?.format).toBe("mp4");
    expect(media?.lateralUrl).toMatch(/\/lsa\/hola_lateral\.mp4$/);
  });

  it("has no lateral when only the front video exists", async () => {
    expect((await resolveSignMedia("hola", served("/hola.mp4")))?.lateralUrl).toBeNull();
  });

  it("returns null when no file exists, and encodes accents", async () => {
    expect(await resolveSignMedia("hola", served())).toBeNull();
    const media = await resolveSignMedia("mamá", served("/mam%C3%A1.glb"));
    expect(media?.url).toContain("mam%C3%A1.glb");
  });

  it("finds a sign under its file-name alias, keeping the requested meaning", async () => {
    const media = await resolveSignMedia("niño", served("/nene.mp4", "/nene_lateral.mp4"));
    expect(media).toMatchObject({ meaning: "niño", format: "mp4" });
    expect(media?.url).toMatch(/\/lsa\/nene\.mp4$/);
    expect(media?.lateralUrl).toMatch(/\/lsa\/nene_lateral\.mp4$/);
  });

  it("matches aliases ignoring case and accents, and prefers the sign's own file", async () => {
    expect((await resolveSignMedia("NINA", served("/nena.glb")))?.url).toMatch(/nena\.glb$/);
    expect((await resolveSignMedia("Niña", served("/nena.glb")))?.url).toMatch(/nena\.glb$/);
    const own = await resolveSignMedia("niño", served("/ni%C3%B1o.mp4", "/nene.glb"));
    expect(own?.url).toMatch(/ni%C3%B1o\.mp4$/);
  });
});

describe("parseSignList", () => {
  it("keeps safe, distinct signs", () => {
    expect(parseSignList("a,b,a,../x,c d")).toEqual(["a", "b", "c d"]);
    expect(parseSignList(null)).toEqual([]);
  });
});
