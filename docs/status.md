# Status

> Responsibility: what is real vs stub, and the tech-debt list.
> Update when: a feature advances or flips stub↔real, or debt is added/resolved.
> Sources: whole repo; feature docs under docs/features/

## Real

- Scaffold: Next.js 16, TypeScript strict, Tailwind v4 tokens, ESLint/Prettier/Vitest, CI.
- API client (Bearer, casing, single-flight refresh), token store, `AuthProvider`.
- `/login` and the guarded `/dashboard` overview (4 stat cards).

## Stub / placeholder

- Landing page (`/`) — [features/landing.md](./features/landing.md).
- `CourseSummary` and `WeeklyPerformance` types are loose — [api/types.md](./api/types.md).

## Not started

Accept-invite, forgot/reset password, members list/detail, modules, charts, invitations UI, sitemap/robots/OG, E2E tests.

## Tech debt / open decisions

| Item                            | Notes                                                                                               |
| ------------------------------- | --------------------------------------------------------------------------------------------------- |
| Refresh token in `localStorage` | XSS-exposed; needs CSP and/or cookie-based refresh in the API — [api/session.md](./api/session.md)  |
| CI workflow never run on GitHub | `npm run check` and `npm run build` pass locally; confirm the first `.github/workflows/ci.yml` run  |
| Hosting, analytics, E2E         | Undecided — [stack.md](./stack.md)                                                                  |
| Multi-org SIGNA `ADMIN`         | Panel assumes one org via `/organizations/me`                                                       |
| Token drift vs mobile           | Tokens are copied by hand; no shared package — [design-system/tokens.md](./design-system/tokens.md) |
