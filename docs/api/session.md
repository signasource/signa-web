# Session

> Responsibility: token storage, login, route guard, and logout.
> Update when: token storage, `AuthProvider`, the dashboard guard, or the refresh/logout flow changes.
> Sources: src/lib/api/token-store.ts, src/lib/api/session.ts, src/lib/session-server.ts, src/app/api/session/, src/features/auth/auth-context.tsx, src/app/(dashboard)/dashboard/layout.tsx, src/app/(auth)/login/page.tsx

## Storage

| Token   | Where                                                                                                               | Why                                                          |
| ------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Access  | module memory (`tokenStore`)                                                                                        | Never persisted; lost on reload                              |
| Refresh | `signa_refresh` cookie set by this app: `HttpOnly`, `Secure` (prod), `SameSite=Strict`, `Path=/api/session`, 7 days | Page scripts can't read it; keeps the session across reloads |

The browser never sees the refresh token. Three Route Handlers act as a small backend-for-frontend
(`src/app/api/session/*`, helpers in `src/lib/session-server.ts`):

- `POST /api/session/login` `{identifier, password}` → calls signa-api `/auth/login`, sets the cookie,
  returns only `{access_token}`.
- `POST /api/session/refresh` → reads the cookie, calls `/auth/refresh`, rotates the cookie,
  returns `{access_token}`. No cookie or a rejected refresh → 401 and the cookie is cleared.
- `POST /api/session/logout` → clears the cookie.

All three reject requests whose `Origin` is not this site (403), on top of `SameSite=Strict`.
`localStorage` only keeps a non-secret hint (`signa.session = "1"`) so pages without a session
don't call refresh on boot; the old `signa.refreshToken` key is deleted on boot and on login.
The signa-api contract is unchanged (still bearer + body refresh), so the mobile app is unaffected.

What this does and doesn't cover: an injected script can no longer steal the session and use it
elsewhere; while the page is open it could still call `/api/session/refresh` from this origin. The
full fix for that is serving the panel from its own subdomain ([../security.md](../security.md)).

## `useAuth()` contract

`{ status: "loading" | "authenticated" | "unauthenticated", organization, login(identifier, password), logout() }`

- **Boot:** no session hint → `unauthenticated`. Otherwise call `GET /organizations/me`; the first call 401s (no access token), the client refreshes, retries, and `status` becomes `authenticated`. Any failure signs out.
- **Login:** `POST /api/session/login` → keep the access token → `GET /organizations/me`. The account must have `role === "ADMIN"` in its org; otherwise the session is dropped and an error is shown (learners cannot use the panel).
- **Logout / expiry:** clears the access token, calls `/api/session/logout` (clears the cookie) and the org; `setOnSessionExpired` routes forced logouts (failed refresh) through the same path.
- **Guard:** dashboard layout redirects to `/login` when unauthenticated. UX only — the API enforces authorization.

Not covered yet: users with the SIGNA-level `ADMIN` role who manage many orgs (the panel assumes one org via `/organizations/me`).
