# Status

> Responsibility: what is real vs stub, and the tech-debt list.
> Update when: a feature advances or flips stub↔real, or debt is added/resolved.
> Sources: whole repo; feature docs under docs/features/

## Real

- Scaffold: Next.js 16, TypeScript strict, Tailwind v4 tokens, ESLint/Prettier/Vitest, CI.
- API client (Bearer, casing, single-flight refresh), token store, `AuthProvider`.
- `/login` and the guarded `/dashboard` overview (4 stat cards).

## Stub / placeholder

- Privacy policy and terms (`/privacidad`, `/terminos`) — **draft, not legally reviewed**; open decisions in [legal.md](./legal.md).
- Landing page (`/`) — [features/landing.md](./features/landing.md).
- `CourseSummary` and `WeeklyPerformance` types are loose — [api/types.md](./api/types.md).

- Security headers + two-tier CSP (strict nonce for panel, relaxed static for landing) — [security.md](./security.md).

## Not started

Accept-invite, forgot/reset password, members list/detail, modules, charts, invitations UI, sitemap/robots/OG, E2E tests.

## Tech debt / open decisions

| Item                                         | Notes                                                                                                                                               |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Refresh token in `localStorage`              | XSS-exposed; CSP mitigates (see [security.md](./security.md)), cookie-based refresh in the API would remove it — [api/session.md](./api/session.md) |
| CI workflow never run on GitHub              | `npm run check` and `npm run build` pass locally; confirm the first `.github/workflows/ci.yml` run                                                  |
| CSP unverified on `next dev` and on the host | Verified on `next start` only; re-check on first deploy — [security.md](./security.md)                                                              |
| Hosting, analytics, E2E                      | Undecided — [stack.md](./stack.md)                                                                                                                  |
| Multi-org SIGNA `ADMIN`                      | Panel assumes one org via `/organizations/me`                                                                                                       |
| Token drift vs mobile                        | Tokens are copied by hand; no shared package — [design-system/tokens.md](./design-system/tokens.md)                                                 |
