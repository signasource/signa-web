export const R2_GLB_BASE = "https://pub-f40a1de4d1fc46b0b6f07299847c66e0.r2.dev/lsa";

export const VIEWER_MESSAGE = "signa:glb-sign";
export const VIEWER_PRELOAD = "signa:glb-preload";

export const MAX_PRELOAD = 32;

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
