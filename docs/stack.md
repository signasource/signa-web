# Stack decisions

> Responsibility: the chosen stack, why, and what was rejected.
> Update when: a dependency is added/replaced/removed, or a stack decision is revisited.
> Sources: package.json, next.config.ts, eslint.config.mjs, vitest.config.mts

## Constraints that drove the choice

1. **Two very different surfaces in one repo:** a public marketing site (SEO, fast first paint, static) and an authenticated data dashboard (interactive tables/charts).
2. **API is stateless bearer JWT + CORS, no cookies** (`signa-api`), so the dashboard is effectively a SPA against a remote API.
3. **Team already writes React + TypeScript strict** (`signa-mobile`), and the brand tokens live there.
4. The org dashboard is a **read-mostly analytics panel** (members, overview, modules) plus seat purchases; the SIGNA back-office is a CRUD/analytics tool (courses, signs, users, usage metrics).

## Decisions

| Concern          | Choice                                                                                 | Why                                                                                                                                                                                                                                                       |
| ---------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework        | **Next.js 16, App Router**                                                             | One repo serves static/SEO landing (Server Components, `metadata`, sitemap) and the client-rendered dashboard via route groups. Same React skills as mobile.                                                                                              |
| Language         | **TypeScript strict**                                                                  | Parity with `signa-mobile`; DTOs typed end to end.                                                                                                                                                                                                        |
| Styling          | **Tailwind CSS v4** with `@theme` tokens                                               | Tokens mirror mobile's palette; no runtime CSS-in-JS; fast to build both marketing and dashboard UI.                                                                                                                                                      |
| Server state     | **TanStack Query**                                                                     | Caching, refetch, and loading/error states for the dashboard's read-heavy screens.                                                                                                                                                                        |
| Forms/validation | **react-hook-form + zod**                                                              | Typed schemas, Spanish messages, small footprint.                                                                                                                                                                                                         |
| Charts           | **Recharts**                                                                           | Declarative, React-native; usage-metrics widgets.                                                                                                                                                                                                         |
| Excel import     | **xlsx** (SheetJS)                                                                     | Reads the seat emails pasted as a spreadsheet on `/dashboard/purchases/new` (client-side only).                                                                                                                                                           |
| Lottie           | **lottie-web** (dynamic import, landing only)                                          | Renders the same `.json` animation files from `signa-mobile` (streak-fire, medals) inside the landing's feature preview modal. Dynamic import keeps it out of the main bundle.                                                                            |
| Camera demo (ML) | **MediaPipe Tasks (`@mediapipe/tasks-vision`, self-hosted) + a TypeScript classifier** | Hand/pose detection runs in the browser (loaded on demand, pinned version, Wasm served from our own origin); the alphabet model is a small dense ensemble exported as raw weights and run in plain TS — see [features/landing.md](./features/landing.md). |
| HTTP             | **native `fetch`** wrapper (`src/lib/api`)                                             | No extra dependency; mirrors mobile's client behavior (Bearer, camel↔snake, refresh on 401). Session cookie handled by thin Route Handlers (`/api/session/*`).                                                                                            |
| Tests            | **Vitest + Testing Library (jsdom)**                                                   | Fast, Vite-based, no Jest config burden.                                                                                                                                                                                                                  |
| Lint/format      | **ESLint (next config) + Prettier (+ tailwind plugin)**                                | `npm run check` gates every change.                                                                                                                                                                                                                       |

## Rejected

- **Vite SPA + separate static landing:** two build pipelines and duplicated design system; loses SSG/SEO ergonomics for the landing.
- **Astro (landing) + React SPA (dashboard):** great for content sites, but splits the repo into two apps for a small team.
- **Full cookie-based BFF/session:** the API stays bearer-only. Only the refresh token is kept in an `HttpOnly` cookie, through small Route Handlers ([api/session.md](./api/session.md)); there is no server-side auth check on pages.
- **Redux/Zustand:** server state is handled by TanStack Query; the only global client state is auth.
- **axios:** `fetch` covers the need; avoids a dependency.
- **TensorFlow.js / TFLite web runtime for the camera demo:** the TFLite loader needs `eval`, forbidden by the CSP; the model is small enough to run in plain TypeScript.
- **Component library (MUI, Chakra):** would fight the brand tokens. Shared primitives live in `src/components/dashboard/ui.tsx`; `shadcn/ui` (Radix + Tailwind) remains the candidate for accessible primitives on demand — not installed.

## Not decided yet

Hosting (Vercel is the default candidate for Next.js), analytics, i18n (UI is Spanish-only), and E2E testing (Playwright is the candidate). Track in [status.md](./status.md).
