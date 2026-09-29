# Routing

> Responsibility: catalog of routes, route groups, and access rules.
> Update when: a route, page, layout, or guard is added, renamed, or removed.
> Sources: src/app/**/page.tsx, src/app/**/layout.tsx

| URL           | File                              | Access | Notes                                                                  |
| ------------- | --------------------------------- | ------ | ---------------------------------------------------------------------- |
| `/`           | `(marketing)/page.tsx`            | public | Landing. See [features/landing.md](./features/landing.md)              |
| `/privacidad` | `(marketing)/privacidad/page.tsx` | public | Privacy policy (draft, `noindex`). See [legal.md](./legal.md)          |
| `/terminos`   | `(marketing)/terminos/page.tsx`   | public | Terms and conditions (draft, `noindex`). See [legal.md](./legal.md)    |
| `/login`      | `(auth)/login/page.tsx`           | public | Redirects to `/dashboard` when already authenticated                   |
| `/dashboard`  | `(dashboard)/dashboard/page.tsx`  | admin  | Overview metrics. See [features/dashboard.md](./features/dashboard.md) |

## Guard

`(dashboard)/dashboard/layout.tsx` is a client-side guard: while `useAuth().status` is not
`authenticated` it renders a loader, and redirects to `/login` when `unauthenticated`. It is UX
only — the API enforces real authorization. Details → [api/session.md](./api/session.md).

## Reserved (not built)

`/accept-invite?code=…` (target of admin-invitation emails from `signa-api`), `/forgot-password`,
`/reset-password?token=…`, `/dashboard/members`, `/dashboard/members/[userId]`, `/dashboard/modules`.
Tracked in [status.md](./status.md).
