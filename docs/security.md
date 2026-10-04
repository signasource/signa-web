# Security headers & CSP

> Responsibility: HTTP security headers, the two-tier CSP, and how to keep it working.
> Update when: a header/CSP directive changes, a public static page is added, a third-party script/origin is introduced, or the API origin changes.
> Sources: next.config.ts, src/proxy.ts, src/lib/security/csp.ts, src/lib/integrity.ts, scripts/strip-sourcemaps.mjs, src/app/api/glb-viewer/route.ts, src/app/(auth)/layout.tsx, src/app/(dashboard)/layout.tsx

## Why this matters here

The refresh token lives in an `HttpOnly` cookie that page scripts cannot read ([api/session.md](./api/session.md)). CSP is still the main defense against injected scripts and, just as important, **blocks exfiltration** — `connect-src` only allows the app and the API origin, and `img-src`/`form-action`/`base-uri` are closed.

## Two tiers

| Tier             | Routes                                                                                                                     | Policy                                                                                                            | Rendering                                       |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| Strict (default) | everything except marketing (`/login`, `/dashboard`, future auth/panel routes)                                             | `script-src 'self' 'nonce-…' 'strict-dynamic'`, per-request nonce from `src/proxy.ts`; styles nonce-based in prod | **Dynamic** — layouts call `await connection()` |
| Relaxed          | `MARKETING_PATHS` in `src/lib/security/csp.ts` (today `/`, `/privacidad`, `/terminos`, `/proximamente`, `/organizaciones`) | `script-src 'self' 'unsafe-inline'`, set in `next.config.ts`                                                      | Static, CDN-cacheable                           |

Why not nonces everywhere: nonces force dynamic rendering, losing static generation and CDN caching for the landing. Why not Next's experimental SRI: inline RSC/hydration scripts are not covered by hashes, so `script-src 'self'` breaks hydration (tried and rejected).

**Remaining risk:** the relaxed tier permits inline scripts, and the landing shares an origin with the panel. The refresh token is no longer reachable from scripts (`HttpOnly` cookie, see [api/session.md](./api/session.md)), so an injected script can't take the session away; it could still act as the user while the page is open. Serving the panel from its own subdomain (`panel.…`) removes that too. Mitigated by the landing being static content with no user input, and by CSP still blocking exfiltration there. If the landing ever renders user-supplied content, move it to the strict tier or a separate origin.

## Rules

- **New public static page** → add its exact path to `MARKETING_PATHS`. Forgetting fails safe: it gets the strict CSP, its static HTML has no nonce, and scripts are blocked (loud, not insecure).
- **New auth/panel route** → nothing to do for CSP, but its layout tree must render dynamically (`await connection()` already covers the `(auth)` and `(dashboard)` groups; a new route group needs its own).
- **Third-party script/origin** (analytics, fonts, embeds) → add the origin to the directive in `buildCsp()`, pass the nonce via `headers().get("x-nonce")`, and document it here. Prefer self-hosting.
- Never use `dangerouslySetInnerHTML` with untrusted content; never add `'unsafe-eval'` outside dev.
- `NEXT_PUBLIC_API_URL` feeds `connect-src`; changing the API origin changes the CSP (rebuild).
- **Cloudflare R2 (`pub-f40a1de4d1fc46b0b6f07299847c66e0.r2.dev`)** is in `connect-src` so the landing page can fetch `.glb` models for the `<model-viewer>` 3D viewer. Applies to both CSP tiers.
- **`blob:` in `connect-src`** — Three.js (used by model-viewer) calls `fetch()` on blob URLs it creates when processing GLB textures. Without this, textures fail to load silently.
- **`worker-src 'self' blob:`** — model-viewer creates Web Workers from blob URLs for model decoding. Without this, workers fail silently with `TypeError: Failed to fetch`.

- **Camera demo (relaxed tier only).** The landing's "Tu cámara te corrige" preview runs MediaPipe
  in the browser: `'wasm-unsafe-eval'` in `script-src` (compiles WebAssembly only — JS `eval`/`new
Function` stay blocked) and `https://storage.googleapis.com` in `connect-src` (MediaPipe's
  `.task` models). MediaPipe's JS and Wasm are self-hosted (npm package, Wasm copied to
  `/mediapipe/wasm`), so no third-party script runs on the landing and the relaxed tier has no CDN
  in `script-src`/`connect-src`. The `.task` models are verified against a pinned SHA-256
  (`fetchVerified()` in `src/lib/integrity.ts`, no credentials, no referrer) before MediaPipe gets
  them: a tampered or swapped model is rejected instead of run. The TFLite web runtime was rejected because its loader calls `eval`; the
  classifier runs in plain TypeScript instead — see [features/landing.md](./features/landing.md).
- **`Permissions-Policy: camera=(self)` on `/` only** (`next.config.ts`, a more specific rule that
  overrides the global `camera=()`): the webcam is available to the landing page and nowhere else.

## GLB viewer route (`/api/glb-viewer`)

The Route Handler at `src/app/api/glb-viewer/route.ts` has its own third CSP tier:

- `buildViewerCsp()` in `src/lib/security/csp.ts` — allows CDN scripts (model-viewer), R2 fetches
  (GLB models), blob workers (Three.js decoders), and restricts embedding via `frame-ancestors 'self'`.
  Also `object-src 'none'`, `base-uri 'none'`, `form-action 'none'`.
- **model-viewer is pinned with Subresource Integrity** (`MODEL_VIEWER_SRI` in the route,
  `integrity` + `crossorigin="anonymous"`): if jsDelivr ever served different bytes, the browser
  refuses to run them. Bumping the version means recomputing the hash
  (`curl -s <url> | openssl dgst -sha384 -binary | openssl base64 -A`).
- **Draco decoder: `https://www.gstatic.com` in `connect-src` + `'wasm-unsafe-eval'` in `script-src`.**
  The GLBs list `KHR_draco_mesh_compression` as a _required_ extension, so model-viewer downloads
  its Draco decoder (`draco_wasm_wrapper.js` + `draco_decoder.wasm`) from gstatic and compiles it as
  WebAssembly. Without both, every model fails with `TypeError: Failed to fetch` and the viewer
  stays empty (this was the landing's "3D never loads" bug). `'wasm-unsafe-eval'` only permits
  compiling Wasm — JS `eval`/`new Function` stay blocked. Viewer-only: neither is in `buildCsp()`.
  If the decoder is ever self-hosted (`ModelViewerElement.dracoDecoderLocation`), drop gstatic.
- The sign name is validated with `isSafeSign()` (`src/lib/glb.ts`: letters incl. accents, digits,
  `_`, `-`, space; ≤ 40 chars) both on the query string and on the `postMessage` the landing sends
  to swap signs in place; messages from other origins are ignored.
- `X-Frame-Options: SAMEORIGIN` — set both by the Route Handler response and by a specific rule in
  `next.config.ts` (overrides the global `DENY`), so the landing page iframe can embed it.
- `src/proxy.ts` skips this path so the middleware does not inject a conflicting nonce CSP.
- Served with `Cache-Control: no-cache`: the HTML carries the viewer's script, so a long cache
  kept visitors on an old viewer for up to a day after a change.

## Other headers (`next.config.ts`, all routes)

HSTS (2 years, `includeSubDomains`, `preload`), `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY` (legacy twin of `frame-ancestors 'none'`), `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (every powerful feature off — `DISABLED_FEATURES` in `next.config.ts`: microphone, geolocation, payment, USB, sensors, browser picture-in-picture, …; camera on for `/` only, for the camera demo; only features Chromium recognizes, an unknown name logs a console error), `Cross-Origin-Opener-Policy: same-origin`, `Cross-Origin-Resource-Policy: same-site` (other sites can't embed our files), `Origin-Agent-Cluster: ?1`, `X-Permitted-Cross-Domain-Policies: none`, `X-DNS-Prefetch-Control: off`, `X-Powered-By` removed.

## Exposing as little code as possible

- **No source maps in production.** `productionBrowserSourceMaps: false`, and
  `scripts/strip-sourcemaps.mjs` (`postbuild`) deletes any `.map` left under `.next/static`, so the
  original source can't be rebuilt from the browser.
- **No comments in the code** (TS/TSX/CSS); explanations live in these docs. Production bundles
  are minified anyway, so this mostly keeps the repo itself lean.
- The glb-viewer HTML is served compacted (whitespace removed).
- What remains visible is unavoidable: any browser has to download the minified JS it runs, and
  the classifier weights (`public/reconocedor/`) must reach the visitor's device for on-device
  recognition. Nothing secret lives in the client: no keys, tokens or private URLs.

`preload` in HSTS is a commitment: submit the domain to the preload list only when every subdomain is HTTPS-only.

## Verified

Production build served with `next start`: CSP present on all routes; no source maps published; model-viewer passes SRI; no CSP violations or Permissions-Policy errors in the console with the camera demo and the 3D viewer running; `/login` hydrates and validates under the strict policy; external `img` and `fetch` are blocked; an inline event-handler payload is blocked (`script-src-attr`). Dev mode (`next dev`, `'unsafe-eval'`) and hosting-level behavior (Vercel) not yet verified — see [status.md](./status.md).
