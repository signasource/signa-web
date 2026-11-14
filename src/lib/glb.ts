export const R2_GLB_BASE = "https://pub-f40a1de4d1fc46b0b6f07299847c66e0.r2.dev/lsa";

export const VIEWER_MESSAGE = "signa:glb-sign";
export const VIEWER_PRELOAD = "signa:glb-preload";

export const MAX_PRELOAD = 32;
export const MAX_LOADED = 3;
export const PRELOAD_AHEAD = MAX_LOADED - 1;

const SAFE_SIGN_RE = /^[\p{L}\p{N}_\- ]{1,40}$/u;

export function isSafeSign(sign: string): boolean {
  return SAFE_SIGN_RE.test(sign);
}

export function safeSignList(list: unknown): string[] {
  if (!Array.isArray(list)) return [];
  const out: string[] = [];
  for (const s of list) {
    if (typeof s === "string" && isSafeSign(s) && !out.includes(s)) out.push(s);
    if (out.length === MAX_PRELOAD) break;
  }
  return out;
}

export const MODEL_VIEWER_CDN =
  "https://cdn.jsdelivr.net/npm/@google/model-viewer@3.5.0/dist/model-viewer.min.js";
export const MODEL_VIEWER_SRI =
  "sha384-Ftcjj/GNLxPvzNDftO/oryXB9aGxsGZY9JGqsXG0uUKgQDl9RfDgsx9NJ/4IVNPe";
export const DRACO = "https://www.gstatic.com/draco/versioned/decoders/1.5.6/";

/** Camera framing shared by the GLB viewers (field of view in degrees, share of the body shown). */
export const FOV = 15;
export const ENCUADRE = 0.52;

/**
 * Whether the URL-based viewer (`/api/glb-viewer/file?src=`) may load `src`: only .glb files from
 * the public R2 bucket or from the API's local media fallback (`<api>/media/...`, dev only).
 */
export function isAllowedGlbSource(src: string, apiUrl: string): boolean {
  let url: URL;
  try {
    url = new URL(src);
  } catch {
    return false;
  }
  if (!url.pathname.toLowerCase().endsWith(".glb") || url.username || url.password) return false;
  const r2 = new URL(R2_GLB_BASE);
  if (url.origin === r2.origin) return true;
  try {
    return url.origin === new URL(apiUrl).origin && url.pathname.startsWith("/media/");
  } catch {
    return false;
  }
}
