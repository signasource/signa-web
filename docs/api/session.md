# Session

> Responsibility: token storage, login, route guard, and logout.
> Update when: token storage, `AuthProvider`, the dashboard guard, or the refresh/logout flow changes.
> Sources: src/lib/api/token-store.ts, src/lib/api/session.ts, src/lib/session-server.ts, src/lib/api/restore.ts, src/app/api/session/, src/features/auth/auth-context.tsx, src/app/(dashboard)/dashboard/layout.tsx, src/app/(marketing)/organizations/login/page.tsx, src/app/(auth)/invitacion/page.tsx, src/components/auth/google-sign-in-button.tsx, src/features/admin/admin-auth-context.tsx

## Storage

| Token   | Where                                                                                                               | Why                                                          |
| ------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Access  | module memory (`tokenStore`)                                                                                        | Never persisted; lost on reload                              |
| Refresh | `signa_refresh` cookie set by this app: `HttpOnly`, `Secure` (prod), `SameSite=Strict`, `Path=/api/session`, 7 days | Page scripts can't read it; keeps the session across reloads |

The browser never sees the refresh token. Route Handlers act as a small backend-for-frontend
(`src/app/api/session/*`, helpers in `src/lib/session-server.ts`):

- `POST /api/session/login` `{identifier, password}` → calls signa-api `/auth/login`, sets the cookie,
  returns only `{access_token}`.
- `POST /api/session/refresh` → reads the cookie, calls `/auth/refresh`, rotates the cookie,
  returns `{access_token}`. No cookie or a rejected refresh → 401 and the cookie is cleared.
- `POST /api/session/register` `{email, username, password, name, lastName}` → calls signa-api `/auth/register` (an employee creating their account from `/invitacion`), sets the cookie, returns `{access_token}`.
- `POST /api/session/logout` → clears the cookie.

**Staying signed in (like Jira/Slack).** The session ends only when `signa-api` definitively rejects the refresh token (4xx) or the user logs out. Network errors and 5xx never clear the cookie or log out: `sessionApi.refresh()` returns `"ok" | "expired" | "unavailable"`, and the client only drops the session on `"expired"`. Refresh tokens rotate, so `/api/session/refresh` shares one upstream call between requests carrying the same token within 30 s (two tabs, remounts, HMR) instead of letting the loser be rejected and logged out. Boot restore (`restoreWithRetry`, `src/lib/api/restore.ts`) retries transient failures with backoff before showing the login, without clearing the cookie. Both providers (org panel and back-office) refresh every 10 minutes and when the tab becomes visible.

All of them reject requests whose `Origin` is not this site (403), on top of `SameSite=Strict`.
`localStorage` only keeps a non-secret hint (`signa.session = "1"`) so pages without a session
don't call refresh on boot; the old `signa.refreshToken` key is deleted on boot and on login.
The signa-api contract is unchanged (still bearer + body refresh), so the mobile app is unaffected.

What this does and doesn't cover: an injected script can no longer steal the session and use it
elsewhere; while the page is open it could still call `/api/session/refresh` from this origin. The
full fix for that is serving the panel from its own subdomain ([../security.md](../security.md)).

## `useAuth()` contract

`{ status: "loading" | "authenticated" | "unauthenticated", organization, login(identifier, password), logout(), refreshOrganization() }`

**Back-office guard:** `(admin)/admin/layout.tsx` redirects to `/admin/login` when unauthenticated, except when already there: replacing to the same URL remounts the login page and loses its error message.

The provider is mounted for the whole app but does nothing on `/admin/*`: the SIGNA back-office has its own session (`AdminAuthProvider`), and restoring an org session there used to fail (`/organizations/me` 404 for a SIGNA admin) and log the back-office out on every reload.

**Invitations:** `/invitacion` does not use `useAuth`. It logs in (or registers) the invited email with `sessionApi`, calls `POST /invitations/{token}/accept` and logs out right after — employees use the mobile app, not the panel.

- **Boot:** no session hint → `unauthenticated`. Otherwise call `GET /organizations/me`; the first call 401s (no access token), the client refreshes, retries, and `status` becomes `authenticated`. Any failure signs out.
- **Login:** `POST /api/session/login` → keep the access token → `GET /organizations/me`. The account must have `role === "ADMIN"` in its org; otherwise the session is dropped and an error is shown (learners cannot use the panel).
- **Logout / expiry:** clears the access token, calls `/api/session/logout` (clears the cookie) and the org; `setOnSessionExpired` routes forced logouts (failed refresh) through the same path.
- **Guard:** dashboard layout redirects to `/organizations/login` when unauthenticated (the login page sends authenticated users on to `/dashboard`). UX only — the API enforces authorization.

Not covered yet: users with the SIGNA-level `ADMIN` role who manage many orgs (the panel assumes one org via `/organizations/me`).

**Back-office admin.** `AdminAuthProvider` (`src/features/admin/admin-auth-context.tsx`) keeps the signed-in admin from `GET /admin/me`; `refresh()` re-reads it, which the edit form calls after an admin edits their own name, email or photo so the sidebar updates. While authenticated it also keeps the session alive: every 10 minutes and whenever the tab becomes visible it calls `sessionApi.refresh()` (rotating the 7-day refresh cookie), so an open or regularly used panel does not lapse. If the refresh is rejected, `onSessionExpired` sets `sessionExpired` and the guard redirects to `/admin/login`, which shows "Tu sesión expiró…". Changing your own password through `PATCH /admin/admins/{id}` drops your refresh tokens: the current access token keeps working until it expires, then the next refresh fails and the panel returns to `/admin/login`.

**Google on `/invitacion`:** `GoogleSignInButton` (Google Identity Services) yields an ID token → `sessionApi.google` → `POST /api/session/google` → `signa-api` `POST /auth/google` (same cookie/refresh handling as login). Needs `NEXT_PUBLIC_GOOGLE_CLIENT_ID` = the Web client ID that `signa-api` uses as `auth.google.client-id`, with this app's origin under "Authorized JavaScript origins"; empty hides the button. The invitation's email must match the Google account (`accept` returns 403 otherwise).
