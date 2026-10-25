# Endpoints

> Responsibility: catalog of `signa-api` endpoints the web calls, via `src/lib/api/`.
> Update when: an endpoint call is added, changed, or removed, or a stub becomes real.
> Sources: src/lib/api/auth.ts, src/lib/api/organizations.ts, src/lib/api/invitations.ts, src/lib/api/admin.ts

Types → [types.md](./types.md). Client behavior → [http-client.md](./http-client.md). The API's own contract is authoritative (`signa-api` controllers / Swagger).

## `authApi` (`src/lib/api/auth.ts`) — mirrors `AuthController`

| Method                              | Path                               | Returns        | Notes                                                           |
| ----------------------------------- | ---------------------------------- | -------------- | --------------------------------------------------------------- |
| `login(identifier, password)`       | `POST /auth/login`                 | `AuthResponse` | `identifier` = email or username. Anonymous                     |
| `forgotPassword(email)`             | `POST /auth/forgot-password`       | `void`         | Anonymous; API answers the same whether or not the email exists |
| `resetPassword(token, newPassword)` | `POST /auth/reset-password?token=` | `void`         | `token` is a **query param**. Anonymous                         |

Refresh (`POST /auth/refresh`) is called internally by the client, not exposed as a module method.

## `organizationsApi` (`src/lib/api/organizations.ts`) — mirrors `Organization*Controller`

| Method                           | Path                                          | Returns                           | Notes                                                                                                                                                                                                                                                                                                 |
| -------------------------------- | --------------------------------------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `me()`                           | `GET /organizations/me`                       | `MyOrganization`                  | Used at login to find the org and confirm `role === "ADMIN"`                                                                                                                                                                                                                                          |
| `redeemInviteCode(code)`         | `POST /organizations/invite-codes/redeem`     | `RedeemInviteCodeResponse`        | Admin invitations only (the API rejects participant codes); for the reserved accept-invite flow                                                                                                                                                                                                       |
| `overview(orgId, params)`        | `GET /organizations/{id}/overview`            | `OrganizationOverview`            | Participation / progress / performance; `courseId` narrows to one contracted course, `period` → `from`/`to` (see below)                                                                                                                                                                               |
| `activity(orgId, params)`        | `GET /organizations/{id}/activity`            | `OrganizationActivity`            | Params `period` → `from`/`to`, `courseId`. Day-by-day figures in Argentina's calendar plus period totals; the whole history starts on the day the organization was created. Feeds the overview's period card                                                                                          |
| `members(orgId, params)`         | `GET /organizations/{id}/members`             | `Page<OrganizationMemberSummary>` | Spring `Page`; params `query`, `status` (`ACTIVE` default / `REMOVED`), `activity` (`ACTIVE`/`INACTIVE`/`NOT_STARTED`/`COMPLETED`), `courseId`, `period` → `from`/`to`, `sort` (`name`/`progress`/`lastActivity`/`joinedAt` + `,asc`/`,desc`), `page`, `size`. Sorted, filtered and paged server-side |
| `member(orgId, userId, period?)` | `GET /organizations/{id}/members/{userId}`    | `MemberProgress`                  | Per-participant progress and per-course breakdown; `period` → `from`/`to`                                                                                                                                                                                                                             |
| `removeMember(orgId, userId)`    | `DELETE /organizations/{id}/members/{userId}` | `void`                            | 204                                                                                                                                                                                                                                                                                                   |
| `modules(orgId, params)`         | `GET /organizations/{id}/modules`             | `ModuleStats[]`                   | Per-module completion and accuracy; `courseId` narrows to one course, `period` → `from`/`to`                                                                                                                                                                                                          |

| `catalog()` | `GET /organizations/catalog` | `PurchaseCatalog` | Anonymous. Paid courses with a published version and their sign count, plus the pricing and range settings |
| `quote(params)` | `GET /organizations/catalog/quote` | `PurchaseQuote` | Anonymous. `courseId`, `seats`, `durationDays` → price per seat and total (seats × days × signs, see signa-api `PurchasePolicy`) |
| `purchases(orgId)` | `GET /organizations/{id}/purchases` | `Purchase[]` | Newest first, with `seatCounts` per state |
| `purchase(orgId, id)` | `GET /organizations/{id}/purchases/{id}` | `PurchaseDetail` | Purchase + seats |
| `createPurchase(orgId, data)` | `POST /organizations/{id}/purchases` | `PurchaseDetail` | `{courseId, durationDays, emails}`; 400 if the org is not validated, 409 if an email already holds a live seat of that course. Starts `PENDING_PAYMENT` |
| `cancelPurchase(orgId, id)` | `POST /organizations/{id}/purchases/{id}/cancel` | `PurchaseDetail` | Only before payment |
| `updateSeatEmail(orgId, p, s, e)` | `PATCH …/purchases/{id}/seats/{seatId}` | `PurchaseDetail` | Only while pending; re-sends with a new link, the deadline does not move |
| `remindSeat(orgId, p, s)` | `POST …/purchases/{id}/seats/{seatId}/reminders` | `PurchaseDetail` | Pending invitations only, one per 24 h (400 otherwise) |

## `invitationsApi` (`src/lib/api/invitations.ts`) — mirrors `InvitationController`

| Method           | Path                               | Returns              | Notes                                                                                       |
| ---------------- | ---------------------------------- | -------------------- | ------------------------------------------------------------------------------------------- |
| `preview(token)` | `GET /invitations/{token}`         | `InvitationPreview`  | Anonymous. 404 for an unknown or replaced link                                              |
| `accept(token)`  | `POST /invitations/{token}/accept` | `AcceptedInvitation` | Bearer of the invited account. 403 other email, 400 expired/revoked, 409 other organization |

## `adminApi` purchases (`src/lib/api/admin.ts`)

`purchases(status?)` → `GET /admin/purchases`; `confirmPayment(id, reference?)` → `POST /admin/purchases/{id}/confirm-payment`. The confirmation is what Mercado Pago will trigger; until then SIGNA confirms by hand.

**Period (`from`/`to`).** `overview`, `activity`, `modules`, `members` and `member` take an optional `period` (`src/lib/date-range.ts`), sent as `from`/`to` ISO dates (inclusive, Argentina's calendar, both or neither, at most 366 days; `null` sends neither = the whole history). `signa-api` (`MetricsPeriod`) counts what _happened_ inside the period (attempts, correct %, lessons and modules completed, minutes, active days, who was active) and measures _states_ as of its end (progress %, who finished, current module, in-progress/completed per module, who had joined). Streaks are always current. With no period, "active" keeps the rolling windows (7 days for people, 30 for active days) and `participation.activeWindowDays` says which; with one, it is the period's length.

## Available in the API, not wired yet

`POST …/admin-invitations` (invite an admin), `GET …/courses`, `POST …/admins`. Shared invite codes and `POST/DELETE …/courses` no longer exist. See [../status.md](../status.md).
