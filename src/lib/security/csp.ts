// Content Security Policy builder. Canonical reference: docs/security.md
//
// Two tiers:
//  - Public static pages (MARKETING_PATHS): no tokens, no user input → static CSP with 'unsafe-inline'
//    scripts so they stay prerendered and CDN-cacheable.
//  - Everything else (login, dashboard, …): strict nonce-based CSP set per request by src/proxy.ts.
//    These routes must render dynamically (`await connection()` in their layout).

/** Exact paths served statically with the relaxed CSP. Anything not listed gets the strict nonce CSP. */
export const MARKETING_PATHS = [
  "/",
  "/privacidad",
  "/terminos",
  "/proximamente",
  "/organizaciones",
] as const;

const isDev = process.env.NODE_ENV === "development";
const apiUrl = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080").replace(/\/+$/, "");

/**
 * Dedicated CSP for the /api/glb-viewer route handler.
 * Allows CDN scripts (model-viewer), R2 fetches (GLB), blob workers (Three.js decoders),
 * and restricts embedding to same-origin pages only.
 *
 * The GLBs are Draco-compressed (`KHR_draco_mesh_compression` is a *required* extension), so
 * model-viewer fetches its Draco decoder from www.gstatic.com and compiles it as WebAssembly —
 * hence gstatic in `connect-src` and `'wasm-unsafe-eval'` (compiles Wasm only; it does not
 * allow JS `eval`). Without both, every model fails to load and the viewer stays empty.
 */
export function buildViewerCsp(): string {
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "connect-src 'self' blob: https://pub-f40a1de4d1fc46b0b6f07299847c66e0.r2.dev https://cdn.jsdelivr.net https://www.gstatic.com",
    "worker-src 'self' blob:",
    "frame-ancestors 'self'",
  ].join("; ");
}

/** `nonce` present → strict policy; absent → relaxed policy for static marketing pages. */
export function buildCsp(nonce?: string): string {
  // Marketing pages add cdn.jsdelivr.net so the dynamically-injected model-viewer
  // module script is allowed. Strict pages use nonce/strict-dynamic — CDN origins are
  // irrelevant there (strict-dynamic ignores allowlists in modern browsers).
  const scriptSrc = nonce
    ? `'self' 'nonce-${nonce}' 'strict-dynamic'`
    : "'self' 'unsafe-inline' https://cdn.jsdelivr.net";
  const styleSrc = nonce && !isDev ? `'self' 'nonce-${nonce}'` : "'self' 'unsafe-inline'";

  return [
    "default-src 'self'",
    `script-src ${scriptSrc}${isDev ? " 'unsafe-eval'" : ""}`,
    `style-src ${styleSrc}`,
    "img-src 'self' data: blob:",
    "font-src 'self'",
    // blob: for Three.js internal fetch() on blob URLs (textures, worker data).
    // cdn.jsdelivr.net for model-viewer's WASM decoder files (Draco, KTX2) served
    // at CDN-relative paths alongside the main model-viewer.min.js.
    `connect-src 'self' blob: ${apiUrl} https://pub-f40a1de4d1fc46b0b6f07299847c66e0.r2.dev https://cdn.jsdelivr.net`,
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(isDev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
}
