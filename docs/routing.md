# Routing

> Responsibility: catalog of routes, route groups, and access rules.
> Update when: a route, page, layout, or guard is added, renamed, or removed.
> Sources: src/app/**/page.tsx, src/app/**/layout.tsx

| URL                           | File                                                    | Access | Notes                                                                                                                |
| ----------------------------- | ------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------- |
| `/`                           | `(marketing)/page.tsx`                                  | public | Landing. See [features/landing.md](./features/landing.md)                                                            |
| `/privacidad`                 | `(marketing)/privacidad/page.tsx`                       | public | Privacy policy (draft, `noindex`). See [legal.md](./legal.md)                                                        |
| `/terminos`                   | `(marketing)/terminos/page.tsx`                         | public | Terms and conditions (draft, `noindex`). See [legal.md](./legal.md)                                                  |
| `/eliminar-cuenta`            | `(marketing)/eliminar-cuenta/page.tsx`                  | public | Account-deletion instructions for Play Console. See [legal.md](./legal.md)                                           |
| `/proximamente`               | `(marketing)/proximamente/page.tsx`                     | public | Coming-soon page: Google Play status, waitlist email form, org CTA                                                   |
| `/organizaciones`             | `(marketing)/organizaciones/page.tsx`                   | public | Organizations marketing page: steps, panel preview, CTA                                                              |
| `/organizaciones/ingresar`    | `(marketing)/organizaciones/ingresar/page.tsx`          | public | Org login + register (CUIT validation). Redirects to `/organizaciones/panel` on login                                |
| `/organizaciones/panel`       | `(marketing)/organizaciones/panel/page.tsx`             | org    | Post-login holding page ("finalizando el módulo"). Guard: redirects to `/organizaciones/ingresar` if unauthenticated |
| `/login`                      | `(auth)/login/page.tsx`                                 | public | Redirects to `/dashboard` when already authenticated                                                                 |
| `/dashboard`                  | `(dashboard)/dashboard/page.tsx`                        | admin  | Overview metrics. See [features/dashboard.md](./features/dashboard.md)                                               |
| `/dashboard/members`          | `(dashboard)/dashboard/members/page.tsx`                | admin  | Participants list (search, status, pagination)                                                                       |
| `/dashboard/members/[userId]` | `(dashboard)/dashboard/members/[userId]/page.tsx`       | admin  | Participant detail + remove                                                                                          |
| `/dashboard/modules`          | `(dashboard)/dashboard/modules/page.tsx`                | admin  | Contracted modules and their stats                                                                                   |
| `/dashboard/purchases`        | `(dashboard)/dashboard/purchases/page.tsx`              | admin  | Seat purchases with their state counts                                                                               |
| `/dashboard/purchases/new`    | `(dashboard)/dashboard/purchases/new/page.tsx`          | admin  | Buy seats: course, 15–60 days, one email per seat (paste or Excel), live quote                                       |
| `/dashboard/purchases/[id]`   | `(dashboard)/dashboard/purchases/[purchaseId]/page.tsx` | admin  | Purchase detail: seats by state, change a pending email, reminders, cancel before payment                            |
| `/invitacion?token=…`         | `(auth)/invitacion/page.tsx`                            | public | Employee accepts a seat invitation: log in or create the account with the invited email, then accept                 |
| `/admin/purchases`            | `(admin)/admin/purchases/page.tsx`                      | SIGNA  | Back-office: list purchases, confirm a payment (until Mercado Pago confirms them)                                    |

## Guard

`(dashboard)/dashboard/layout.tsx` is a client-side guard: while `useAuth().status` is not
`authenticated` it renders a loader, and redirects to `/login` when `unauthenticated`. Once authenticated it also renders the header and the section nav (Resumen / Participantes / Contenidos / Compras). While the organization is not validated it re-reads `/organizations/me` every 30 s and on window focus, so the banner and the "Comprar cupos" button update without logging in again. It is UX
only — the API enforces real authorization. Details → [api/session.md](./api/session.md).

## Reserved (not built)

`/accept-invite?code=…` (target of admin-invitation emails from `signa-api`), `/forgot-password`,
`/reset-password?token=…`.
Tracked in [status.md](./status.md).
