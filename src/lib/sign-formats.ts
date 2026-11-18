import { R2_GLB_BASE, isSafeSign } from "@/lib/glb";
import type { SignMedia } from "@/lib/api/types";

/** Most signs one `/api/sign-formats` call checks; each costs up to three HEAD requests. */
export const MAX_FORMAT_CHECK = 24;

export function parseSignList(raw: string | null): string[] {
  if (!raw) return [];
  const out: string[] = [];
  for (const s of raw.split(",")) {
    if (isSafeSign(s) && !out.includes(s)) out.push(s);
    if (out.length === MAX_FORMAT_CHECK) break;
  }
  return out;
}

/**
 * Signs whose file in the bucket is named differently from the meaning a lesson teaches (the video
 * is `nene.mp4`, the lesson says "niño"). Mirror of `FILE_NAME_ALIASES` in signa-api's
 * `SignCatalogImporter` and `ALIAS_DE_ARCHIVO` in signa-mobile: keep the three in sync.
 */
const FILE_NAME_ALIASES: Record<string, string> = {
  niño: "nene",
  niña: "nena",
  hoy: "hoy-ahora",
  comisaría: "policía",
  mañana: "mañana (día siguiente)",
  "la mañana": "mañana (parte del día)",
};

const fold = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();

const ALIASES = new Map(Object.entries(FILE_NAME_ALIASES).map(([k, v]) => [fold(k), v]));

/** The names a sign's file may carry in the bucket: its own, then its alias if it has one. */
export function fileNames(sign: string): string[] {
  const alias = ALIASES.get(fold(sign));
  return alias ? [sign, alias] : [sign];
}

/**
 * Where a sign's files live in the public bucket and what it can show: `lsa/<name>.glb` is a 3D
 * avatar; otherwise `lsa/<name>.mp4` is a video, with `lsa/<name>_lateral.mp4` as its side view when
 * it exists. `<name>` is the sign itself, then its file-name alias (see `FILE_NAME_ALIASES`). A sign
 * with no file under either returns `null`. The result's `meaning` is always the requested sign.
 * `exists` answers whether a URL is served.
 */
export async function resolveSignMedia(
  sign: string,
  exists: (url: string) => Promise<boolean>,
): Promise<SignMedia | null> {
  for (const name of fileNames(sign)) {
    const base = `${R2_GLB_BASE}/${encodeURIComponent(name)}`;
    if (await exists(`${base}.glb`)) {
      return { meaning: sign, url: `${base}.glb`, format: "glb", lateralUrl: null };
    }
    if (await exists(`${base}.mp4`)) {
      const lateral = `${base}_lateral.mp4`;
      return {
        meaning: sign,
        url: `${base}.mp4`,
        format: "mp4",
        lateralUrl: (await exists(lateral)) ? lateral : null,
      };
    }
  }
  return null;
}
