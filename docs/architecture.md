# Architecture

> Responsibility: folder structure, alias, providers, and app startup.
> Update when: folders are added/renamed, the alias or tooling changes, or providers change.
> Sources: src/, tsconfig.json, src/app/layout.tsx, src/app/providers.tsx, eslint.config.mjs

## Layout

```
src/
  app/                    # routes only (see routing.md)
    (marketing)/          # public landing — static, SEO
    (auth)/               # login and other unauthenticated flows
    (dashboard)/dashboard # guarded admin panel
    layout.tsx            # fonts, metadata, <Providers>
    providers.tsx         # QueryClientProvider + AuthProvider
    globals.css           # Tailwind + @theme tokens
  features/<area>/        # feature logic + components (auth today)
  lib/
    api/                  # http client, token store, DTO types, per-area endpoint modules
    case.ts               # camelCase↔snake_case
    env.ts                # NEXT_PUBLIC_* access
    utils.ts              # cn()
    security/csp.ts       # CSP builder + MARKETING_PATHS (see security.md)
  proxy.ts                # per-request nonce CSP for non-marketing routes
```

Rule of thumb: `app/` holds thin route files that compose `features/*`; reusable logic lives in
`features/` or `lib/`. Route groups (parenthesized) share layouts without affecting URLs.

## Conventions

- Alias `@/*` → `src/*` (`tsconfig.json`). `../` imports are lint errors.
- Server Components by default; `"use client"` only where needed (providers, guarded dashboard, forms).
- Tests colocated next to source (`*.test.ts(x)`), run by Vitest (`vitest.config.mts`).

## Startup

`RootLayout` loads Bricolage Grotesque + Figtree via `next/font`, sets `lang="es"` and site metadata, and wraps
everything in `Providers` → `QueryClientProvider` → `AuthProvider`. `AuthProvider` restores the session
from the persisted refresh token (see [api/session.md](./api/session.md)).
