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
 * Where a sign's files live in the public bucket and what it can show: `lsa/<sign>.glb` is a 3D
 * avatar; otherwise `lsa/<sign>.mp4` is a video, with `lsa/<sign>_lateral.mp4` as its side view when
 * it exists. A sign with neither returns `null`. `exists` answers whether a URL is served.
 */
export async function resolveSignMedia(
  sign: string,
  exists: (url: string) => Promise<boolean>,
): Promise<SignMedia | null> {
  const base = `${R2_GLB_BASE}/${encodeURIComponent(sign)}`;
  if (await exists(`${base}.glb`)) {
    return { meaning: sign, url: `${base}.glb`, format: "glb", lateralUrl: null };
  }
  if (!(await exists(`${base}.mp4`))) return null;
  const lateral = `${base}_lateral.mp4`;
  return {
    meaning: sign,
    url: `${base}.mp4`,
    format: "mp4",
    lateralUrl: (await exists(lateral)) ? lateral : null,
  };
}
