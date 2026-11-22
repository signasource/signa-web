# Routing

> Responsibility: catalog of routes, route groups, and access rules.
> Update when: a route, page, layout, or guard is added, renamed, or removed.
> Sources: src/app/**/page.tsx, src/app/**/layout.tsx, src/app/api/**/route.ts

## Route groups

| Group         | Layout                                     | Rendering                                                        |
| ------------- | ------------------------------------------ | ---------------------------------------------------------------- |
| `(marketing)` | none (each page brings its own)            | Static, relaxed CSP (see below for the two dynamic exceptions)   |
| `(auth)`      | `await connection()`                       | Dynamic, strict nonce CSP                                        |
| `(dashboard)` | `await connection()`                       | Dynamic, strict CSP; the `dashboard/layout.tsx` client guard     |
| `(admin)`     | `await connection()` + `AdminAuthProvider` | Dynamic, strict CSP; `admin/layout.tsx` is the back-office shell |

`/organizations/login`, `/organizations/forgot-password` and `/organizations/panel` live under `(marketing)` but are **not** in
`MARKETING_PATHS`: their own `layout.tsx` calls `await connection()` so they render dynamically with the
strict CSP ([security.md](./security.md)).

## Pages

| URL                              | File                                                    | Access | Notes                                                                                                                                                                                                                                                                                                                 |
| -------------------------------- | ------------------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                              | `(marketing)/page.tsx`                                  | public | Landing. See [features/landing.md](./features/landing.md)                                                                                                                                                                                                                                                             |
| `/privacidad`                    | `(marketing)/privacidad/page.tsx`                       | public | Privacy policy (not legally reviewed yet). See [legal.md](./legal.md)                                                                                                                                                                                                                                                 |
| `/terminos`                      | `(marketing)/terminos/page.tsx`                         | public | Terms and conditions (not legally reviewed yet). See [legal.md](./legal.md)                                                                                                                                                                                                                                           |
| `/eliminar-cuenta`               | `(marketing)/eliminar-cuenta/page.tsx`                  | public | Account-deletion instructions for Play Console. See [legal.md](./legal.md)                                                                                                                                                                                                                                            |
| `/proximamente`                  | `(marketing)/proximamente/page.tsx`                     | public | Coming-soon page: Google Play status, waitlist email form (`waitlist-form.tsx`), org CTA                                                                                                                                                                                                                              |
| `/organizations`                 | `(marketing)/organizations/page.tsx`                    | public | Organizations marketing page: steps, panel preview, CTA                                                                                                                                                                                                                                                               |
| `/organizations/login`           | `(marketing)/organizations/login/page.tsx`              | public | Org login + register tabs (CUIT validation, `organizationsApi.register`). Redirects to `/dashboard` once authenticated. Dynamic (strict CSP)                                                                                                                                                                          |
| `/organizations/forgot-password` | `(marketing)/organizations/forgot-password/page.tsx`    | public | Password recovery, same flow as `signa-mobile`: email → 6-digit code + new password (resend / other email) → automatic sign-in → `/dashboard`. Linked from the login form. Dynamic (strict CSP)                                                                                                                       |
| `/organizations/panel`           | `(marketing)/organizations/panel/page.tsx`              | —      | Legacy entry point; redirects to `/dashboard`                                                                                                                                                                                                                                                                         |
| `/invitacion?token=…`            | `(auth)/invitacion/page.tsx`                            | public | Employee accepts a seat invitation: log in (email/password or Google) or create the account with the invited email, then accept                                                                                                                                                                                       |
| `/dashboard`                     | `(dashboard)/dashboard/page.tsx`                        | org    | Overview metrics. See [features/dashboard.md](./features/dashboard.md)                                                                                                                                                                                                                                                |
| `/dashboard/members`             | `(dashboard)/dashboard/members/page.tsx`                | org    | Participants, in two tabs (`?tab=invitados` for the second): **Participantes** (search, state chips, sort, pagination) and **Invitados** (pending email invitations)                                                                                                                                                  |
| `/dashboard/members/[userId]`    | `(dashboard)/dashboard/members/[userId]/page.tsx`       | org    | Participant detail + remove                                                                                                                                                                                                                                                                                           |
| `/dashboard/profile`             | `(dashboard)/dashboard/profile/page.tsx`                | org    | The signed-in org admin's photo (`ProfilePhotoCard`, `PUT/DELETE /users/me/avatar`). Reached from the avatar at the right of the header                                                                                                                                                                               |
| `/dashboard/purchases`           | `(dashboard)/dashboard/purchases/page.tsx`              | org    | Seat purchases with their state counts                                                                                                                                                                                                                                                                                |
| `/dashboard/purchases/new`       | `(dashboard)/dashboard/purchases/new/page.tsx`          | org    | Buy seats: course preview, 5–60 days, one email per seat (paste or Excel), live quote → summary → Mercado Pago                                                                                                                                                                                                        |
| `/dashboard/purchases/[id]`      | `(dashboard)/dashboard/purchases/[purchaseId]/page.tsx` | org    | Purchase detail: pay, return URL (`?pago=…`), seats by state, emails, reminders, cancel, withdraw, refund request                                                                                                                                                                                                     |
| `/admin`                         | `(admin)/admin/page.tsx`                                | SIGNA  | Back-office "Inicio": "Requiere atención" widget (pending organizations + unresolved sign reports). See [features/admin-usage-metrics.md](./features/admin-usage-metrics.md)                                                                                                                                          |
| `/admin/login`                   | `(admin)/admin/login/page.tsx`                          | public | Back-office login (`AdminAuthProvider.login`)                                                                                                                                                                                                                                                                         |
| `/admin/organizations`           | `(admin)/admin/organizations/page.tsx`                  | SIGNA  | Organization review: tabs Pendientes / Activas / Rechazadas / Suspendidas / Todas (excludes suspended), approve / reject / suspend (mandatory reason) / reactivate / "Dar de baja" (delete)                                                                                                                           |
| `/admin/courses`                 | `(admin)/admin/courses/page.tsx`                        | SIGNA  | Course CMS: course versions (Borradores / Publicadas / Archivadas, editor avatar + name chip, enrollment count), create, fork, full editor (units → lessons → blocks incl. `PERFORM_SIGN` signs and check blocks), publish with confirmation. Deep link `?course=&lesson=[&version=]` (`src/lib/course-deep-link.ts`) |
| `/admin/signs`                   | `(admin)/admin/signs/page.tsx`                          | SIGNA  | Sign catalog + editor (`?id=`). See [features/admin-signs.md](./features/admin-signs.md)                                                                                                                                                                                                                              |
| `/admin/sign-reports`            | `(admin)/admin/sign-reports/page.tsx`                   | SIGNA  | Individual sign reports with status tabs (Pendientes default), reason / sign / date filters, review → resolve / reject with an internal note                                                                                                                                                                          |
| `/admin/purchases`               | `(admin)/admin/purchases/page.tsx`                      | SIGNA  | Back-office purchases (SEATS / GEMS / COURSE) + **Reembolsos** tab (refund requests). Read-only: no manual payment confirmation any more. See [features/dashboard.md](./features/dashboard.md#admin--compras-adminpurchases)                                                                                          |
| `/admin/users`                   | `(admin)/admin/users/page.tsx`                          | SIGNA  | Tabs **Usuarios** (search, role filter, role-aware detail modal), **Administradores** (`AdminsPanel`) and **Lista de espera**                                                                                                                                                                                         |
| `/admin/profile`                 | `(admin)/admin/profile/page.tsx`                        | SIGNA  | The signed-in admin's profile (click their name/photo in the sidebar); "Editar" opens `EditAdminForm`                                                                                                                                                                                                                 |
| `/admin/usage-metrics`           | `(admin)/admin/usage-metrics/page.tsx`                  | SIGNA  | Back-office "Métricas": usage dashboard in tabs (`?tab=`), one datetime range picker + live. Tabs: Negocio, Usuarios, Aprendizaje, Infraestructura. See [features/admin-usage-metrics.md](./features/admin-usage-metrics.md)                                                                                          |

There is **no** standalone `/login`, `/organizaciones*`, `/admin/content` or `/accept-invite` page.

## Route handlers (`src/app/api/`)

| URL                              | File                            | Notes                                                                                             |
| -------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------- |
| `POST /api/session/login`        | `api/session/login/route.ts`    | Backend-for-frontend for the refresh cookie — see [api/session.md](./api/session.md)              |
| `POST /api/session/google`       | `api/session/google/route.ts`   | Google ID token → `signa-api` `/auth/google`                                                      |
| `POST /api/session/register`     | `api/session/register/route.ts` | Employee registration from `/invitacion`                                                          |
| `POST /api/session/refresh`      | `api/session/refresh/route.ts`  | Rotates the cookie, returns the access token                                                      |
| `POST /api/session/logout`       | `api/session/logout/route.ts`   | Clears the cookie                                                                                 |
| `GET /api/glb-viewer?sign=…`     | `api/glb-viewer/route.ts`       | Landing's 3D viewer page (iframe). See [security.md](./security.md#glb-viewer-routes)             |
| `GET /api/glb-viewer/file?src=…` | `api/glb-viewer/file/route.ts`  | Single GLB by URL (bucket or API `/media/` only): sign editor preview and purchase course preview |

## Guards

- **Org panel** — `(dashboard)/dashboard/layout.tsx` is a client-side guard: while `useAuth().status` is not
  `authenticated` it renders a loader, and redirects to `/organizations/login` when `unauthenticated`. Once
  authenticated it renders the header (logo, organization name, avatar → `/dashboard/profile`) and the section
  nav (Resumen / Participantes / Compras). While the organization is not validated it re-reads
  `/organizations/me` every 30 s and on window focus, so the banner and the "Comprar cupos" button update
  without logging in again.
- **Back-office** — `(admin)/admin/layout.tsx` redirects to `/admin/login` when `AdminAuthProvider` is
  unauthenticated (unless already there). Sidebar: Inicio, Métricas, Organizaciones, Compras, Reportes de señas, Cursos,
  Señas, Usuarios; the profile link sits at the bottom.

Both are UX only — the API enforces real authorization. Details → [api/session.md](./api/session.md).

## Reserved (not built)

`/accept-invite?code=…` (target of admin-invitation emails from `signa-api`). Tracked in [status.md](./status.md).
