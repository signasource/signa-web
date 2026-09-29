export const R2_GLB_BASE = "https://pub-f40a1de4d1fc46b0b6f07299847c66e0.r2.dev/lsa";

export const VIEWER_MESSAGE = "signa:glb-sign";

const SAFE_SIGN_RE = /^[\p{L}\p{N}_\- ]{1,40}$/u;

export function isSafeSign(sign: string): boolean {
  return SAFE_SIGN_RE.test(sign);
}
