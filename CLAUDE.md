# CLAUDE.md — signa-web

Entry point and mandatory rules for developing `signa-web` with Claude.
Detailed docs (retrieval map): [`docs/README.md`](./docs/README.md).

`signa-web` is a Next.js (App Router, TypeScript strict) app with two surfaces for Signa — learning
Argentine Sign Language (LSA): the public **landing page** and the **organization admin dashboard**
(the panel where company admins track their participants' progress). Backend: `signa-api`
(Spring Boot, stateless JWT bearer). Sibling repo: `signa-mobile` (the learner app; shares the brand).
Solved today: scaffold, design tokens, API client, login, dashboard overview. Everything else is
reserved — see [docs/status.md](./docs/status.md).

## Docs are code

These docs are the project's memory and must **self-maintain** — every change closes this loop:

1. **Before** touching an area, open its doc (router below, or [docs/README.md](./docs/README.md)) to load the current state.
2. **After**, update that same doc in the **same commit** — code and its doc move together, never in a follow-up.

If reality already diverged from a doc, **the code wins**: fix the doc first (re-read the files in its `Sources` header). Router:

| Change                                                   | Update                                                                                                                                                                              |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Add/rename a route, page, or layout                      | [docs/routing.md](./docs/routing.md)                                                                                                                                                |
| Add/change an endpoint call                              | [docs/api/endpoints.md](./docs/api/endpoints.md)                                                                                                                                    |
| Change the HTTP client, casing, refresh, or env          | [docs/api/http-client.md](./docs/api/http-client.md)                                                                                                                                |
| Add/change a DTO                                         | [docs/api/types.md](./docs/api/types.md)                                                                                                                                            |
| Change token storage, login, guard, or logout            | [docs/api/session.md](./docs/api/session.md)                                                                                                                                        |
| Add/change a color, font, or UI primitive                | [docs/design-system/tokens.md](./docs/design-system/tokens.md)                                                                                                                      |
| Advance the landing or a dashboard section               | the feature's doc under [docs/features/](./docs/features/) ([landing](./docs/features/landing.md) · [dashboard](./docs/features/dashboard.md)) + [docs/status.md](./docs/status.md) |
| Change folder structure, alias, providers, or tooling    | [docs/architecture.md](./docs/architecture.md)                                                                                                                                      |
| Add/replace a dependency or change a stack decision      | [docs/stack.md](./docs/stack.md)                                                                                                                                                    |
| Add/resolve tech debt, or flip stub↔real                 | [docs/status.md](./docs/status.md)                                                                                                                                                  |
| Change API contract assumptions (CORS, roles, panel URL) | [docs/api/http-client.md](./docs/api/http-client.md) **and** the matching section in `signa-api/CLAUDE.md`                                                                          |

A new cross-cutting convention goes in this file (§ Rules). A new doc goes in the router above **and** in [docs/README.md](./docs/README.md).

## Rules

**Language & types**

- TypeScript strict (`noUncheckedIndexedAccess` on). No `any` (ESLint errors on it).
- Import via the `@/` → `src/` alias. Never `../` imports (ESLint errors on them); `./` within a folder is fine.
- English for docs and code identifiers. **Spanish (voseo, Argentina) for user-facing UI copy.**

**Rendering model**

- Server Components by default. Add `"use client"` only for state, effects, or browser APIs, and keep the client boundary as low in the tree as possible.
- **Landing (`(marketing)`)** is static/SEO: no client-side data fetching, `metadata` per page, no auth code.
- **Dashboard (`(dashboard)`)** is client-rendered behind the `AuthProvider` guard. The API is bearer-only (no cookies), so there is no server session — do not add server-side auth checks that pretend otherwise. Authorization is enforced by `signa-api`; the client guard is UX only.

**Styling**

- Tailwind v4, tokens defined in `@theme` in `src/app/globals.css`. Use token classes (`bg-primary`, `text-text-muted`, `font-display`).
- Never hardcode hex, font names, or arbitrary `[#...]` values. New color/font → add the token first, then document it in [docs/design-system/tokens.md](./docs/design-system/tokens.md). Tokens mirror `signa-mobile` — keep them in sync.
- Compose classes with `cn()` from `@/lib/utils`. No CSS-in-JS, no CSS modules.

**State & data**

- Server state: TanStack Query, keyed `["organization", orgId, <resource>, ...params]`. Local state: `useState`. Global client state: `AuthContext` only — no Redux/Zustand without asking.
- All HTTP through `@/lib/api/*` (never `fetch` directly in a component): the client injects the Bearer token, converts camelCase↔snake_case, and refreshes on 401. One module per API area; document each endpoint in [docs/api/endpoints.md](./docs/api/endpoints.md).
- Forms: `react-hook-form` + `zod` schema. Validation messages in Spanish.
- Never store the access token outside memory. Never log tokens or PII (participant names/emails).

**Charts & data display**

- Charts use Recharts. Colors come from tokens, never Recharts defaults. Every chart needs a text alternative (table or summary) and a loading + empty + error state.

**Tests**

- Vitest + Testing Library. Pure logic (`lib/`, validation, formatters) must have unit tests; components with branching behavior get a render test. Colocate as `*.test.ts(x)`.

**Standard async UI states** — every query-backed view handles all three, in this order:

```tsx
if (isPending) return <p className="text-text-muted">Cargando…</p>;
if (error) return <p className="text-danger">No pudimos cargar los datos.</p>;
// render data
```

## Commands

```bash
npm run dev          # Next dev server (Turbopack) → http://localhost:3000
npm run build        # production build
npm run check        # format:check + lint + typecheck + test  ← minimum before considering a change done
npm run lint         # eslint
npm run typecheck    # tsc --noEmit
npm run test         # vitest run (test:watch for watch mode)
npm run format       # prettier --write
```

Environment: copy `.env.example` → `.env.local`, set `NEXT_PUBLIC_API_URL` (base without a path prefix).
`signa-api` must list this origin in `CORS_ALLOWED_ORIGINS` and point `PANEL_URL` here
(admin invitations link to `/accept-invite?code=...`). Details → [docs/api/http-client.md](./docs/api/http-client.md).

## Git

Same flow as `signa-api`: branches `feature/*`, `fix/*`, `chore/*`, `docs/*`; squash-merge to the
integration branch with an Angular-style message (`type(scope): description`). Never commit `.env*`
(except `.env.example`).
