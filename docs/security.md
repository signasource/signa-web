# Security headers & CSP

> Responsibility: HTTP security headers, the two-tier CSP, and how to keep it working.
> Update when: a header/CSP directive changes, a public static page is added, a third-party script/origin is introduced, or the API origin changes.
> Sources: next.config.ts, src/proxy.ts, src/lib/security/csp.ts, src/app/(auth)/layout.tsx, src/app/(dashboard)/layout.tsx

## Why this matters here

The refresh token lives in `localStorage` ([api/session.md](./api/session.md)), so any XSS can read it. CSP is the main mitigation: it blocks injected scripts and, just as important, **blocks exfiltration** — `connect-src` only allows the app and the API origin, and `img-src`/`form-action`/`base-uri` are closed.

## Two tiers

| Tier             | Routes                                                                                 | Policy                                                                                                            | Rendering                                       |
| ---------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| Strict (default) | everything except marketing (`/login`, `/dashboard`, future auth/panel routes)         | `script-src 'self' 'nonce-…' 'strict-dynamic'`, per-request nonce from `src/proxy.ts`; styles nonce-based in prod | **Dynamic** — layouts call `await connection()` |
| Relaxed          | `MARKETING_PATHS` in `src/lib/security/csp.ts` (today `/`, `/privacidad`, `/terminos`) | `script-src 'self' 'unsafe-inline'`, set in `next.config.ts`                                                      | Static, CDN-cacheable                           |

Why not nonces everywhere: nonces force dynamic rendering, losing static generation and CDN caching for the landing. Why not Next's experimental SRI: inline RSC/hydration scripts are not covered by hashes, so `script-src 'self'` breaks hydration (tried and rejected).

**Accepted risk:** the relaxed tier permits inline scripts, and the landing shares an origin (and `localStorage`) with the panel. Mitigated by the landing being static content with no user input, and by CSP still blocking exfiltration there. If the landing ever renders user-supplied content, move it to the strict tier or a separate origin.

## Rules

- **New public static page** → add its exact path to `MARKETING_PATHS`. Forgetting fails safe: it gets the strict CSP, its static HTML has no nonce, and scripts are blocked (loud, not insecure).
- **New auth/panel route** → nothing to do for CSP, but its layout tree must render dynamically (`await connection()` already covers the `(auth)` and `(dashboard)` groups; a new route group needs its own).
- **Third-party script/origin** (analytics, fonts, embeds) → add the origin to the directive in `buildCsp()`, pass the nonce via `headers().get("x-nonce")`, and document it here. Prefer self-hosting.
- Never use `dangerouslySetInnerHTML` with untrusted content; never add `'unsafe-eval'` outside dev.
- `NEXT_PUBLIC_API_URL` feeds `connect-src`; changing the API origin changes the CSP (rebuild).
- **Cloudflare R2 (`pub-f40a1de4d1fc46b0b6f07299847c66e0.r2.dev`)** is in `connect-src` so the landing page can fetch `.glb` models for the `<model-viewer>` 3D viewer. Applies to both CSP tiers.
- **`blob:` in `connect-src`** — Three.js (used by model-viewer) calls `fetch()` on blob URLs it creates when processing GLB textures. Without this, textures fail to load silently.
- **`worker-src 'self' blob:`** — model-viewer creates Web Workers from blob URLs for model decoding. Without this, workers fail silently with `TypeError: Failed to fetch`.

## GLB viewer route (`/api/glb-viewer`)

The Route Handler at `src/app/api/glb-viewer/route.ts` has its own third CSP tier:

- `buildViewerCsp()` in `src/lib/security/csp.ts` — allows CDN scripts (model-viewer), R2 fetches
  (GLB models), blob workers (Three.js decoders), and restricts embedding via `frame-ancestors 'self'`.
- `X-Frame-Options: SAMEORIGIN` — set both by the Route Handler response and by a specific rule in
  `next.config.ts` (overrides the global `DENY`), so the landing page iframe can embed it.
- `src/proxy.ts` skips this path so the middleware does not inject a conflicting nonce CSP.

## Other headers (`next.config.ts`, all routes)

HSTS (2 years, `includeSubDomains`, `preload`), `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY` (legacy twin of `frame-ancestors 'none'`), `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (camera/microphone/geolocation/payment off), `Cross-Origin-Opener-Policy: same-origin`, `X-Powered-By` removed.

`preload` in HSTS is a commitment: submit the domain to the preload list only when every subdomain is HTTPS-only.

## Verified

Production build served with `next start`: CSP present on all routes; `/login` hydrates and validates under the strict policy; external `img` and `fetch` are blocked; an inline event-handler payload is blocked (`script-src-attr`). Dev mode (`next dev`, `'unsafe-eval'`) and hosting-level behavior (Vercel) not yet verified — see [status.md](./status.md).
