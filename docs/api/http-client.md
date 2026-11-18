# HTTP client

> Responsibility: how the web talks to `signa-api` — base URL, casing, auth header, refresh, errors, CORS.
> Update when: `client.ts`, `case.ts`, `env.ts`, or the API's CORS/auth assumptions change.
> Sources: src/lib/api/client.ts, src/lib/api/session.ts, src/lib/case.ts, src/lib/env.ts, .env.example

All calls go through `api()` in `src/lib/api/client.ts`. **Never call `fetch` from a component** — use the endpoint modules ([endpoints.md](./endpoints.md)).

## Behavior

- **Base URL:** `NEXT_PUBLIC_API_URL` (no trailing slash, no `/api` prefix — the API has none).
- **Casing:** request bodies are converted camelCase → snake_case; JSON responses snake_case → camelCase (`src/lib/case.ts`). Query params are passed as-is (write them in the API's spelling); `undefined` values are skipped and arrays repeat the key.
- **Auth:** attaches `Authorization: Bearer <access>` (from the in-memory `tokenStore`) unless `anonymous: true` (catalog, quote, forgot/reset password, organization register).
- **Refresh on 401:** one single-flight `sessionApi.refresh()` → this app's `POST /api/session/refresh` (the refresh token lives in an `HttpOnly` cookie the browser never reads — [session.md](./session.md)), then the original request is retried once. If refresh fails, the access token is cleared and the `setOnSessionExpired` callback (registered by `AuthProvider`) signs the user out. Anonymous calls never refresh.
- **Errors:** non-2xx throws `ApiError(status, message)`; `message` comes from the API's `ErrorResponse.message` when present. UI code maps these to Spanish copy.
- **Uploads:** pass `formData` instead of `body` — it is sent untouched (no casing conversion, no JSON `Content-Type`; the browser sets the multipart boundary). Used by `adminApi.uploadSignAnimation`.
- **204/empty body** resolves to `undefined`.
- **Outside the client:** the session Route Handlers (`/api/session/*`) use a server-side `fetch` in `src/lib/session-server.ts`, and two public best-effort calls use bare `fetch` (`POST /waitlist`, `POST /telemetry/events`) — see [endpoints.md](./endpoints.md#direct-calls-outside-the-client).

## API-side requirements

Owned by `signa-api` (see its `CLAUDE.md` §4):

- `CORS_ALLOWED_ORIGINS` must include this app's origin; an empty value closes the API to browsers. No credentials are used (bearer in header).
- `PANEL_URL` must point to this app; admin-invitation emails link to `<PANEL_URL>/accept-invite?code=…`.
- Panel endpoints require role `ORG_ADMIN` (scoped to own org) or `ADMIN`.

## Environment

| Variable                       | Use                                                                                                                                                   |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL`          | `signa-api` base URL, no trailing slash (default `http://localhost:8080`). Also feeds the CSP `connect-src`/`img-src`/`media-src` (rebuild on change) |
| `NEXT_PUBLIC_SITE_URL`         | This app's public origin: `metadataBase`, and the fallback for the same-origin check of the session handlers                                          |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google _Web_ client ID for "Continuar con Google" on `/invitacion` (empty hides the button)                                                           |

All three are read through `src/lib/env.ts`; copy `.env.example` → `.env.local`.
