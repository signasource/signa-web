// Shared by the /api/glb-viewer route and the landing's LisaGlbViewer. Same bucket as
// signa-mobile (src/features/animations/glbUrl.ts).

export const R2_GLB_BASE = "https://pub-f40a1de4d1fc46b0b6f07299847c66e0.r2.dev/lsa";

/** `postMessage` type the parent page sends to the viewer iframe to swap the sign in place. */
export const VIEWER_MESSAGE = "signa:glb-sign";

// Letters (accents included: "perdón"), digits, underscores, hyphens and spaces ("por favor").
const SAFE_SIGN_RE = /^[\p{L}\p{N}_\- ]{1,40}$/u;

/** Sign names are interpolated into the viewer HTML and the R2 URL, so only plain words pass. */
export function isSafeSign(sign: string): boolean {
  return SAFE_SIGN_RE.test(sign);
}
