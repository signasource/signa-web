# Stack decisions

> Responsibility: the chosen stack, why, and what was rejected.
> Update when: a dependency is added/replaced/removed, or a stack decision is revisited.
> Sources: package.json, next.config.ts, eslint.config.mjs, vitest.config.mts

## Constraints that drove the choice

1. **Two very different surfaces in one repo:** a public marketing site (SEO, fast first paint, static) and an authenticated data dashboard (interactive tables/charts).
2. **API is stateless bearer JWT + CORS, no cookies** (`signa-api`), so the dashboard is effectively a SPA against a remote API.
3. **Team already writes React + TypeScript strict** (`signa-mobile`), and the brand tokens live there.
4. The dashboard is a **read-mostly analytics panel** (members, overview, modules) today.

## Decisions

| Concern          | Choice                                                                                 | Why                                                                                                                                                                                                                                                       |
| ---------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework        | **Next.js 16, App Router**                                                             | One repo serves static/SEO landing (Server Components, `metadata`, sitemap) and the client-rendered dashboard via route groups. Same React skills as mobile.                                                                                              |
| Language         | **TypeScript strict**                                                                  | Parity with `signa-mobile`; DTOs typed end to end.                                                                                                                                                                                                        |
| Styling          | **Tailwind CSS v4** with `@theme` tokens                                               | Tokens mirror mobile's palette; no runtime CSS-in-JS; fast to build both marketing and dashboard UI.                                                                                                                                                      |
| Server state     | **TanStack Query**                                                                     | Caching, refetch, and loading/error states for the dashboard's read-heavy screens.                                                                                                                                                                        |
| Forms/validation | **react-hook-form + zod**                                                              | Typed schemas, Spanish messages, small footprint.                                                                                                                                                                                                         |
| Charts           | **Recharts**                                                                           | Declarative, React-native, enough for the weekly-evolution and per-module charts.                                                                                                                                                                         |
| Lottie           | **lottie-web** (dynamic import, landing only)                                          | Renders the same `.json` animation files from `signa-mobile` (streak-fire, medals) inside the landing's feature preview modal. Dynamic import keeps it out of the main bundle.                                                                            |
| Camera demo (ML) | **MediaPipe Tasks (`@mediapipe/tasks-vision`, self-hosted) + a TypeScript classifier** | Hand/pose detection runs in the browser (loaded on demand, pinned version, Wasm served from our own origin); the alphabet model is a small dense ensemble exported as raw weights and run in plain TS — see [features/landing.md](./features/landing.md). |
| HTTP             | **native `fetch`** wrapper (`src/lib/api`)                                             | No extra dependency; mirrors mobile's client behavior (Bearer, camel↔snake, refresh on 401).                                                                                                                                                              |
| Tests            | **Vitest + Testing Library (jsdom)**                                                   | Fast, Vite-based, no Jest config burden.                                                                                                                                                                                                                  |
| Lint/format      | **ESLint (next config) + Prettier (+ tailwind plugin)**                                | `npm run check` gates every change.                                                                                                                                                                                                                       |

## Rejected

- **Vite SPA + separate static landing:** two build pipelines and duplicated design system; loses SSG/SEO ergonomics for the landing.
- **Astro (landing) + React SPA (dashboard):** great for content sites, but splits the repo into two apps for a small team.
- **Next.js with cookie-based BFF/session:** would add server-side session handling that the API does not support; revisit only if the API moves to cookie auth (see [status.md](./status.md) → token storage).
- **Redux/Zustand:** server state is handled by TanStack Query; the only global client state is auth.
- **axios:** `fetch` covers the need; avoids a dependency.
- **TensorFlow.js / TFLite web runtime for the camera demo:** the TFLite loader needs `eval`, forbidden by the CSP; the model is small enough to run in plain TypeScript.
- **Component library (MUI, Chakra):** would fight the brand tokens. `shadcn/ui` (Radix + Tailwind) is the planned way to add accessible primitives on demand — not installed yet.

## Not decided yet

Hosting (Vercel is the default candidate for Next.js), analytics, i18n (UI is Spanish-only), and E2E testing (Playwright is the candidate). Track in [status.md](./status.md).
