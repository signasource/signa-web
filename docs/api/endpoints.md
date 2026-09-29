# Endpoints

> Responsibility: catalog of `signa-api` endpoints the web calls, via `src/lib/api/`.
> Update when: an endpoint call is added, changed, or removed, or a stub becomes real.
> Sources: src/lib/api/auth.ts, src/lib/api/organizations.ts

Types → [types.md](./types.md). Client behavior → [http-client.md](./http-client.md). The API's own contract is authoritative (`signa-api` controllers / Swagger).

## `authApi` (`src/lib/api/auth.ts`) — mirrors `AuthController`

| Method                              | Path                               | Returns        | Notes                                                           |
| ----------------------------------- | ---------------------------------- | -------------- | --------------------------------------------------------------- |
| `login(identifier, password)`       | `POST /auth/login`                 | `AuthResponse` | `identifier` = email or username. Anonymous                     |
| `forgotPassword(email)`             | `POST /auth/forgot-password`       | `void`         | Anonymous; API answers the same whether or not the email exists |
| `resetPassword(token, newPassword)` | `POST /auth/reset-password?token=` | `void`         | `token` is a **query param**. Anonymous                         |

Refresh (`POST /auth/refresh`) is called internally by the client, not exposed as a module method.

## `organizationsApi` (`src/lib/api/organizations.ts`) — mirrors `Organization*Controller`

| Method                   | Path                                      | Returns                           | Notes                                                        |
| ------------------------ | ----------------------------------------- | --------------------------------- | ------------------------------------------------------------ |
| `me()`                   | `GET /organizations/me`                   | `MyOrganization`                  | Used at login to find the org and confirm `role === "ADMIN"` |
| `redeemInviteCode(code)` | `POST /organizations/invite-codes/redeem` | `RedeemInviteCodeResponse`        | Used by the (reserved) accept-invite flow                    |
| `overview(orgId)`        | `GET /organizations/{id}/overview`        | `OrganizationOverview`            | Participation / progress / performance                       |
| `members(orgId, params)` | `GET /organizations/{id}/members`         | `Page<OrganizationMemberSummary>` | Spring `Page`; params: `query`, `status`, `page`, `size`     |

## Available in the API, not wired yet

`GET …/members/{userId}`, `DELETE …/members/{userId}`, `GET …/modules`, invite codes (`GET/POST/DELETE …/invite-codes`), `POST …/invitations` (invite by email), `GET …/courses`. See [../status.md](../status.md).
