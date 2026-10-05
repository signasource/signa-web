# Status

> Responsibility: what is real vs stub, and the tech-debt list.
> Update when: a feature advances or flips stub↔real, or debt is added/resolved.
> Sources: whole repo; feature docs under docs/features/

## Real

- Scaffold: Next.js 16, TypeScript strict, Tailwind v4 tokens, ESLint/Prettier/Vitest, CI.
- API client (Bearer, casing, single-flight refresh), token store, `AuthProvider`.
- `/login` and the guarded dashboard: overview, members list + detail (remove), contents, invitations — see [features/dashboard.md](./features/dashboard.md).
- Landing page (`/`) — full one-page site with a playable 3D lesson demo; scroll effects work in
  every browser (no CSS scroll timelines). See [features/landing.md](./features/landing.md).
- Landing camera demo ("Tu cámara te corrige") — real in-browser recognition: spell your name with the LSA alphabet, signa-ml v7 (v5 plus S and O recorded on an iPhone and the Z, which also needs its trace; the native app still ships v5). See [features/landing.md](./features/landing.md).
- `/proximamente` — coming-soon page with waitlist email form: the browser calls signa-api `POST /waitlist` directly (202 for valid emails; rate limiting is done by Cloudflare in front of the API), validates the email first, has a hidden honeypot field and a minimum fill time, and shows the real result. All "Empezá gratis" CTAs link here.

## Stub / placeholder

- Privacy policy and terms (`/privacidad`, `/terminos`) — **draft, not legally reviewed**; open decisions in [legal.md](./legal.md).
- Landing page (`/`) — thematic courses show no price yet (removed until the final number is set); no `sitemap.ts` / `robots.ts` / OG image yet — [features/landing.md](./features/landing.md).
- `/organizaciones/ingresar` — register tab collects CUIT + org data but the registration API does not exist yet; submission shows a "te avisamos" confirmation. CUIT validation works client-side.
- `/organizaciones/panel` — holding page only; shows "finalizando el módulo" message. Will be replaced by the real org dashboard when the module is complete.
- `/proximamente` — `POST /waitlist` only exists from signa-api PR #88 on (before that the form never stored anything); no captcha yet (Cloudflare Turnstile needs an account); `/images/equipo.jpg` team photo is a placeholder — replace with actual photo.
- `Equipo` section shows `/images/equipo.jpg` — file does not exist yet; replace with the actual team photo.
- Dashboard screens omit some prototype data the API does not expose (sort, inactivity filters, per-module member progress, activity feed) — [features/dashboard.md](./features/dashboard.md).

- Security headers + two-tier CSP (strict nonce for panel, relaxed static for landing) — [security.md](./security.md).

## Not started

Accept-invite, forgot/reset password, admin invitations, sitemap/robots/OG, E2E tests.

## Tech debt / open decisions

| Item                                         | Notes                                                                                                                                                                       |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Org registration API not built               | `/organizaciones/ingresar` register tab submits a no-op; shows confirmation. Needs a `POST /organizations/register` endpoint — [features/landing.md](./features/landing.md) |
| CI workflow never run on GitHub              | `npm run check` and `npm run build` pass locally; confirm the first `.github/workflows/ci.yml` run                                                                          |
| CSP unverified on `next dev` and on the host | Verified on `next start` only; re-check on first deploy — [security.md](./security.md)                                                                                      |
| Hosting, analytics, E2E                      | Undecided — [stack.md](./stack.md)                                                                                                                                          |
| Multi-org SIGNA `ADMIN`                      | Panel assumes one org via `/organizations/me`                                                                                                                               |
| Token drift vs mobile                        | Tokens are copied by hand; no shared package — [design-system/tokens.md](./design-system/tokens.md)                                                                         |
