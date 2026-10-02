# Admin dashboard

> Responsibility: state and plan of the organization-admin panel.
> Update when: a dashboard screen is added/changed, or an endpoint becomes wired.
> Sources: src/app/(dashboard)/, src/components/dashboard/, src/lib/api/organizations.ts, src/lib/dashboard-format.ts, src/lib/invitations.ts

Audience: `ADMIN`-role members of an organization (company admins). Scope is enforced by `signa-api` (`requireManage`).
Design source: Claude Design project "Panel Organizacional" (`Panel Organizacional.dc.html`), implemented with real endpoints rather than the prototype's mock data.

## Built

| Screen        | Route                         | Data                                                                       | Notes                                                                                                                                                                                                                                   |
| ------------- | ----------------------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Overview      | `/dashboard`                  | `overview`, `modules`, `members` (ACTIVE, size 100)                        | 4 stat cards, weekly evolution (Recharts, text summary + table toggle), team funnel, 3 detail cards, per-module accuracy, "needs a nudge" list (active members with >7 days inactivity and <100%). Empty state with Lisa when 0 members |
| Members       | `/dashboard/members`          | `members` (`query`, `status`, `page`, size 8)                              | Debounced search, Activos/Quitados chips (server `status`), pagination. Row status pill is derived client-side (`memberDisplayStatus`)                                                                                                  |
| Member detail | `/dashboard/members/[userId]` | `member`, `removeMember`                                                   | Stat tiles, progress per course, activity facts, remove confirmation dialog (redirects to the list)                                                                                                                                     |
| Contents      | `/dashboard/modules`          | `modules`, `overview` (total participants)                                 | One card per module: completed / in progress / correct % / attempts                                                                                                                                                                     |
| Invitations   | `/dashboard/invitations`      | `inviteByEmail`, `inviteCodes`, `createInviteCode`, `deactivateInviteCode` | react-hook-form + zod (`src/lib/invitations.ts`); one request per email, per-email result list; shareable codes = active codes with no email                                                                                            |

Navigation (header pills) lives in `(dashboard)/dashboard/layout.tsx`. Shared UI primitives: `src/components/dashboard/` (`ui.tsx`, `icons.tsx` — inline SVG, no icon dependency, `weekly-evolution.tsx`).

## Design vs. API gaps (deliberate deviations from the prototype)

The prototype mocked data the API does not expose. Revisit if `signa-api` adds it:

- **Weekly chart** shows exercises done / % correct per week (`WeeklyPerformanceResponse`), not "active participants per week".
- **Funnel** has 3 steps (enrolled / started / completed); the "passed half" step needs per-member data the overview lacks.
- **Members list:** no sort selector (API sorts by `joinedAt`) and no derived filters (inactive / not started / completed) — only `ACTIVE`/`REMOVED` exist server-side. No per-filter counts.
- **Member detail:** progress is per course (`MemberCourseProgressResponse`), not per module/lesson; no "recent activity" feed, no per-module accuracy.
- **Contents:** no signs count, recognition %, or average attempts per module (`ModuleStatsResponse` has lessons, completed/in-progress, accuracy, total attempts).
- **Invite codes:** the response has no `createdAt`; the card shows uses (`useCount`/`maxUses`) and expiry. "Create code" sends no `expiresAt`/`maxUses` (no expiry, unlimited uses).
- **"Needs a nudge"** is computed client-side from the first 100 active members.

## Planned

- **Accept-invite flow** (`/accept-invite?code=…`): register/login then redeem.
- Sorting and inactivity/status filters once the API supports them; invite-code options (expiry, max uses); admin invitations (`POST …/admin-invitations`).
