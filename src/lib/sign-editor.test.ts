import { describe, expect, it } from "vitest";
import type { AdminSign } from "@/lib/api/admin";
import {
  countByFormat,
  detectMediaFormat,
  filterSigns,
  formatAgo,
  formatBytes,
  meaningError,
  newSignSchema,
  normalizeMeaning,
  uploadError,
  youtubeError,
} from "@/lib/sign-editor";

const bytes = (s: string) => new Uint8Array([...s].map((c) => c.charCodeAt(0)));
const file = (content: Uint8Array<ArrayBuffer> | string, name = "x") =>
  new File([typeof content === "string" ? bytes(content) : content], name);

const GLB = bytes("glTF\x02\0\0\0\0\0\0\0rest");
const MP4 = bytes("\0\0\0\x18ftypisom\0\0rest");
const MOV = bytes("\0\0\0\x14ftypqt  \0\0rest");

function sign(partial: Partial<AdminSign> & { meaning: string }): AdminSign {
  return {
    id: partial.meaning,
    handedness: "ONE_HANDED",
    hasAnimation: true,
    hasYoutube: false,
    animationFormat: "glb",
    animationUpdatedAt: null,
    openReports: 0,
    lessonCount: 0,
    ...partial,
  };
}

describe("meaning validation", () => {
  it("normalizes whitespace", () => {
    expect(normalizeMeaning("  buen   día ")).toBe("buen día");
  });

  it("accepts letters with accents, numbers, spaces, - and _", () => {
    expect(meaningError("mañana")).toBeNull();
    expect(meaningError("Número 2_b-c")).toBeNull();
  });

  it("rejects empty, too long and punctuation", () => {
    expect(meaningError("   ")).toMatch(/vacío/);
    expect(meaningError("a".repeat(41))).toMatch(/40/);
    expect(meaningError("¿hola?")).toMatch(/Solo letras/);
  });

  it("validates the new-sign form with the same rule", () => {
    expect(newSignSchema.safeParse({ meaning: "hola", handedness: "ONE_HANDED" }).success).toBe(
      true,
    );
    const bad = newSignSchema.safeParse({ meaning: "¿?", handedness: "ONE_HANDED" });
    expect(bad.success).toBe(false);
    expect(bad.error?.issues[0]?.message).toMatch(/Solo letras/);
  });

  it("validates YouTube links but allows empty", () => {
    expect(youtubeError("")).toBeNull();
    expect(youtubeError("https://youtu.be/abc")).toBeNull();
    expect(youtubeError("https://vimeo.com/1")).toMatch(/YouTube/);
  });
});

describe("media detection", () => {
  it("detects glb and mp4 by content, not by name", async () => {
    expect(await detectMediaFormat(file(GLB, "x.mp4"))).toBe("glb");
    expect(await detectMediaFormat(file(MP4, "x.glb"))).toBe("mp4");
  });

  it("rejects QuickTime, short and unknown files", async () => {
    expect(await detectMediaFormat(file(MOV))).toBeNull();
    expect(await detectMediaFormat(file("glTF"))).toBeNull();
    expect(await detectMediaFormat(file("\x89PNG\r\n\x1a\n00000000"))).toBeNull();
  });

  it("explains why a file cannot be uploaded", async () => {
    expect(await uploadError(file(new Uint8Array()))).toMatch(/vacío/);
    expect(await uploadError(file(MOV))).toMatch(/\.glb.*\.mp4/);
    expect(await uploadError(file(GLB))).toBeNull();
  });
});

describe("catalog filtering", () => {
  const signs = [
    sign({ meaning: "Mañana", lessonCount: 1 }),
    sign({ meaning: "abuelo", animationFormat: "mp4", animationUpdatedAt: "2026-01-02T00:00:00Z" }),
    sign({ meaning: "chau", animationFormat: null, lessonCount: 3 }),
    sign({ meaning: "auto", animationUpdatedAt: "2026-03-01T00:00:00Z" }),
  ];
  const run = (opts: Partial<Parameters<typeof filterSigns>[1]>) =>
    filterSigns(signs, { query: "", format: "all", sort: "az", ...opts }).map((s) => s.meaning);

  it("sorts alphabetically in Spanish by default", () => {
    expect(run({})).toEqual(["abuelo", "auto", "chau", "Mañana"]);
  });

  it("searches ignoring accents and case", () => {
    expect(run({ query: "MANA" })).toEqual(["Mañana"]);
  });

  it("filters by format", () => {
    expect(run({ format: "mp4" })).toEqual(["abuelo"]);
    expect(run({ format: "none" })).toEqual(["chau"]);
    expect(run({ format: "glb" })).toEqual(["auto", "Mañana"]);
  });

  it("sorts by recent upload or by usage", () => {
    expect(run({ sort: "recent" })).toEqual(["auto", "abuelo", "chau", "Mañana"]);
    expect(run({ sort: "used" })[0]).toBe("chau");
  });

  it("counts per format", () => {
    expect(countByFormat(signs)).toEqual({ all: 4, glb: 2, mp4: 1, none: 1 });
  });
});

describe("formatters", () => {
  it("formats sizes", () => {
    expect(formatBytes(500)).toBe("500 B");
    expect(formatBytes(2048)).toBe("2 KB");
    expect(formatBytes(2.5 * 1024 * 1024)).toBe("2,5 MB");
  });

  it("formats relative time", () => {
    const now = Date.parse("2026-01-10T12:00:00Z");
    expect(formatAgo(null, now)).toBe("");
    expect(formatAgo("2026-01-10T11:59:30Z", now)).toBe("recién");
    expect(formatAgo("2026-01-10T11:00:00Z", now)).toBe("hace 1 h");
    expect(formatAgo("2026-01-05T12:00:00Z", now)).toBe("hace 5 días");
  });
});
