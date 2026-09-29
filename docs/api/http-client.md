# HTTP client

> Responsibility: how the web talks to `signa-api` — base URL, casing, auth header, refresh, errors, CORS.
> Update when: `client.ts`, `case.ts`, `env.ts`, or the API's CORS/auth assumptions change.
> Sources: src/lib/api/client.ts, src/lib/case.ts, src/lib/env.ts, .env.example

All calls go through `api()` in `src/lib/api/client.ts`. **Never call `fetch` from a component** — use the endpoint modules ([endpoints.md](./endpoints.md)).

## Behavior

- **Base URL:** `NEXT_PUBLIC_API_URL` (no trailing slash, no `/api` prefix — the API has none).
- **Casing:** request bodies are converted camelCase → snake_case; JSON responses snake_case → camelCase (`src/lib/case.ts`). Query params are passed as-is (write them in the API's spelling).
- **Auth:** attaches `Authorization: Bearer <access>` unless `anonymous: true` (login, refresh, forgot/reset password).
- **Refresh on 401:** one single-flight `POST /auth/refresh` with the stored refresh token, then the original request is retried once. If refresh fails, tokens are cleared and the `setOnSessionExpired` callback (registered by `AuthProvider`) signs the user out.
- **Errors:** non-2xx throws `ApiError(status, message)`; `message` comes from the API's `ErrorResponse.message` when present. UI code maps these to Spanish copy.
- **204/empty body** resolves to `undefined`.

## API-side requirements

Owned by `signa-api` (see its `CLAUDE.md` §4):

- `CORS_ALLOWED_ORIGINS` must include this app's origin; an empty value closes the API to browsers. No credentials are used (bearer in header).
- `PANEL_URL` must point to this app; admin-invitation emails link to `<PANEL_URL>/accept-invite?code=…`.
- Panel endpoints require role `ORG_ADMIN` (scoped to own org) or `ADMIN`.
