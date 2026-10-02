# Routing

> Responsibility: catalog of routes, route groups, and access rules.
> Update when: a route, page, layout, or guard is added, renamed, or removed.
> Sources: src/app/**/page.tsx, src/app/**/layout.tsx

| URL                           | File                                              | Access | Notes                                                                  |
| ----------------------------- | ------------------------------------------------- | ------ | ---------------------------------------------------------------------- |
| `/`                           | `(marketing)/page.tsx`                            | public | Landing. See [features/landing.md](./features/landing.md)              |
| `/privacidad`                 | `(marketing)/privacidad/page.tsx`                 | public | Privacy policy (draft, `noindex`). See [legal.md](./legal.md)          |
| `/terminos`                   | `(marketing)/terminos/page.tsx`                   | public | Terms and conditions (draft, `noindex`). See [legal.md](./legal.md)    |
| `/login`                      | `(auth)/login/page.tsx`                           | public | Redirects to `/dashboard` when already authenticated                   |
| `/dashboard`                  | `(dashboard)/dashboard/page.tsx`                  | admin  | Overview metrics. See [features/dashboard.md](./features/dashboard.md) |
| `/dashboard/members`          | `(dashboard)/dashboard/members/page.tsx`          | admin  | Participants list (search, status, pagination)                         |
| `/dashboard/members/[userId]` | `(dashboard)/dashboard/members/[userId]/page.tsx` | admin  | Participant detail + remove                                            |
| `/dashboard/modules`          | `(dashboard)/dashboard/modules/page.tsx`          | admin  | Contracted modules and their stats                                     |
| `/dashboard/invitations`      | `(dashboard)/dashboard/invitations/page.tsx`      | admin  | Invite by email, shareable invite codes                                |

## Guard

`(dashboard)/dashboard/layout.tsx` is a client-side guard: while `useAuth().status` is not
`authenticated` it renders a loader, and redirects to `/login` when `unauthenticated`. Once authenticated it also renders the header and the section nav (Resumen / Participantes / Contenidos / Invitaciones). It is UX
only — the API enforces real authorization. Details → [api/session.md](./api/session.md).

## Reserved (not built)

`/accept-invite?code=…` (target of admin-invitation emails from `signa-api`), `/forgot-password`,
`/reset-password?token=…`.
Tracked in [status.md](./status.md).
