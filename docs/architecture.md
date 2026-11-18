# Architecture

> Responsibility: folder structure, alias, providers, and app startup.
> Update when: folders are added/renamed, the alias or tooling changes, or providers change.
> Sources: src/, scripts/, tsconfig.json, src/app/layout.tsx, src/app/providers.tsx, eslint.config.mjs

## Layout

```
src/
  app/                    # routes only (see routing.md)
    (marketing)/          # public landing, legal pages, org marketing + org login — static/SEO (login/panel are dynamic)
    (auth)/               # unauthenticated flows (`/invitacion`)
    (dashboard)/dashboard # guarded org-admin panel
    (admin)/admin         # SIGNA back-office (own AdminAuthProvider + guard)
    api/session/*         # backend-for-frontend: refresh cookie (see api/session.md)
    api/glb-viewer/*      # 3D viewer pages embedded in iframes (see security.md)
    layout.tsx            # fonts, metadata, <Providers>
    providers.tsx         # QueryClientProvider + AuthProvider + client telemetry
    globals.css           # Tailwind + @theme tokens
  components/
    landing/              # landing sections, demos (lesson, camera), modals
    dashboard/            # org-panel + usage-metrics widgets; ui.tsx = shared primitives (Card, StatCard, states, buttons)
    admin/                # admin avatar / avatar picker / admins panel / edit form
    auth/                 # Google sign-in button
    legal/                # LegalPage shell
    back-button.tsx
  features/<area>/        # feature logic + contexts: auth, admin (auth context, user detail modal, signs/), dashboard (course/period filters)
  lib/
    api/                  # http client, token store, DTO types, per-area endpoint modules
    security/csp.ts       # CSP builders + MARKETING_PATHS (see security.md)
    alphabet-*.ts, hand-*.ts, delegate-choice.ts, integrity.ts   # landing camera demo (recognizer, worker, model checks)
    course-*.ts, sign-editor.ts, glb.ts, purchases.ts, date-range.ts, ...   # pure feature logic (unit-tested)
    case.ts, env.ts, utils.ts, telemetry.ts, session-server.ts, waitlist.ts, cuit.ts, legal.ts
  proxy.ts                # per-request nonce CSP for non-marketing routes
scripts/                  # copy-mediapipe-wasm (pre dev/build), dev-cert (LAN https for phones), strip-sourcemaps (postbuild)
```

Rule of thumb: `app/` holds thin route files that compose `features/*` and `components/*`; reusable logic lives in
`features/` or `lib/`. Route groups (parenthesized) share layouts without affecting URLs. Some admin pages
(`courses`, `purchases`) are still large single files — see [status.md](./status.md).

## Conventions

- Alias `@/*` → `src/*` (`tsconfig.json`). `../` imports are lint errors.
- Server Components by default; `"use client"` only where needed (providers, guarded dashboard, forms).
- Tests colocated next to source (`*.test.ts(x)`), run by Vitest (`vitest.config.mts`).

## Startup

`RootLayout` loads Bricolage Grotesque + Figtree via `next/font`, sets `lang="es"` and site metadata, and wraps
everything in `Providers` → `QueryClientProvider` (`staleTime` 30 s, `retry` 1) → `AuthProvider`; `Providers` also starts client telemetry. `AuthProvider` restores the session
from the `HttpOnly` refresh cookie via `/api/session/refresh` (see [api/session.md](./api/session.md)); it does nothing on `/admin/*`, which has its own `AdminAuthProvider`.

## Scripts and CI

- `predev` / `prebuild` run `scripts/copy-mediapipe-wasm.mjs` (copies the MediaPipe Wasm from `node_modules` to the git-ignored `public/mediapipe/`); `postbuild` runs `scripts/strip-sourcemaps.mjs` ([security.md](./security.md)).
- `npm run dev:celu` serves `next dev` over https with a self-signed cert for the LAN IPs (`scripts/dev-cert.mjs`), needed to try the camera demo on a phone ([features/landing.md](./features/landing.md#opening-the-dev-server-from-a-phone)).
- `.github/workflows/`: `ci.yml` (format, lint, typecheck, tests, build), `branch-policy.yml` (branch names/targets), `release.yml` (`semantic-release` on `master`; `.release.config.mjs`).
