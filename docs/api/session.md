# Session

> Responsibility: token storage, login, route guard, and logout.
> Update when: token storage, `AuthProvider`, the dashboard guard, or the refresh/logout flow changes.
> Sources: src/lib/api/token-store.ts, src/features/auth/auth-context.tsx, src/app/(dashboard)/dashboard/layout.tsx, src/app/(auth)/login/page.tsx

## Storage

| Token   | Where                                 | Why                              |
| ------- | ------------------------------------- | -------------------------------- |
| Access  | module memory (`tokenStore`)          | Never persisted; lost on reload  |
| Refresh | `localStorage` (`signa.refreshToken`) | Keeps the session across reloads |

**Known trade-off:** a persisted refresh token is readable by any XSS. Accepted because the API is bearer-only (no cookie option). Mitigated by the strict CSP in [../security.md](../security.md) (blocks injected scripts and exfiltration) and by never rendering untrusted HTML; revisit if the API adds httpOnly-cookie refresh ([../status.md](../status.md)).

## `useAuth()` contract

`{ status: "loading" | "authenticated" | "unauthenticated", organization, login(identifier, password), logout() }`

- **Boot:** no refresh token → `unauthenticated`. Otherwise call `GET /organizations/me`; the first call 401s (no access token), the client refreshes, retries, and `status` becomes `authenticated`. Any failure signs out.
- **Login:** `POST /auth/login` → store tokens → `GET /organizations/me`. The account must have `role === "ADMIN"` in its org; otherwise the session is dropped and an error is shown (learners cannot use the panel).
- **Logout / expiry:** clears both tokens and the org; `setOnSessionExpired` routes forced logouts (failed refresh) through the same path.
- **Guard:** dashboard layout redirects to `/login` when unauthenticated. UX only — the API enforces authorization.

Not covered yet: users with the SIGNA-level `ADMIN` role who manage many orgs (the panel assumes one org via `/organizations/me`).
