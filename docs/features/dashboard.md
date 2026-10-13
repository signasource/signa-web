# Admin dashboard

> Responsibility: state and plan of the organization-admin panel.
> Update when: a dashboard screen is added/changed, or an endpoint becomes wired.
> Sources: src/app/(dashboard)/, src/components/dashboard/, src/features/dashboard/, src/lib/api/organizations.ts, src/lib/dashboard-format.ts, src/lib/invitations.ts

Audience: `ADMIN`-role members of an organization (company admins). Scope is enforced by `signa-api` (`requireManage`).
Design source: Claude Design project "Panel Organizacional" (`Panel Organizacional.dc.html`), implemented with real endpoints rather than the prototype's mock data.

## Built

| Screen        | Route                         | Data                                                                                | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ------------- | ----------------------------- | ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Overview      | `/dashboard`                  | `overview`, `modules`, `members` (`INACTIVE`, sorted by `lastActivity` asc, size 4) | 4 stat cards, weekly evolution (Recharts, text summary + table toggle), team funnel, 3 detail cards, per-module accuracy, "needs a nudge" list (server-side inactive filter). Empty state with Lisa when 0 members                                                                                                                                                                                                                      |
| Members       | `/dashboard/members`          | `members` (`query`, `status`, `activity`, `courseId`, `sort`, `page`, size 10)      | Debounced search; state chips Todos / Activos / Inactivos / Sin iniciar / Completaron / Quitados; sortable headers (persona, avance, última vez, incorporación — first click on a number/date shows highest/most recent first); "N personas · Página x de y" with prev/next only when there is more than one page. Status pill and "current module" come from the server (`activityStatus`; a finished course reads "Terminó el curso") |
| Member detail | `/dashboard/members/[userId]` | `member`, `removeMember`                                                            | Stat tiles, progress per course, activity facts, remove confirmation dialog (redirects to the list)                                                                                                                                                                                                                                                                                                                                     |
| Contents      | `/dashboard/modules`          | `modules`, `overview` (total participants)                                          | One card per module: completed / in progress / correct % / attempts. Grouped by course when every course is shown and there are several                                                                                                                                                                                                                                                                                                 |
| Invitations   | `/dashboard/invitations`      | `inviteByEmail`, `inviteCodes`, `createInviteCode`, `deactivateInviteCode`          | react-hook-form + zod (`src/lib/invitations.ts`); one request per email, per-email result list; shareable codes = active codes with no email                                                                                                                                                                                                                                                                                            |

Navigation (header pills) lives in `(dashboard)/dashboard/layout.tsx`, next to the SIGNA logo and the organization name.

**Course filter.** Overview, members and contents can show every contracted course or one of them. The choice lives in the URL (`?curso=<courseId>`, `src/features/dashboard/use-course-filter.ts`) so it survives switching sections (nav links keep it) and can be shared; `CourseSelect` renders it, or a plain label when the organization has a single course. An id the organization did not contract is ignored.

## Design vs. API gaps (deliberate deviations from the prototype)

The prototype mocked data the API does not expose. Revisit if `signa-api` adds it:

- **Funnel** has 3 steps (enrolled / started / completed); the "passed half" step needs per-member data the overview lacks.
- **Members list:** no per-filter counts.
- **Member detail:** progress is per course (`MemberCourseProgressResponse`), not per module/lesson; no "recent activity" feed, no per-module accuracy.
- **Contents:** no signs count, recognition %, or average attempts per module (`ModuleStatsResponse` has lessons, completed/in-progress, accuracy, total attempts).
- **Invite codes:** the response has no `createdAt`; the card shows uses (`useCount`/`maxUses`) and expiry. "Create code" sends no `expiresAt`/`maxUses` (no expiry, unlimited uses).

## Planned

- **Accept-invite flow** (`/accept-invite?code=…`): register/login then redeem.
- Invite-code options (expiry, max uses); admin invitations (`POST …/admin-invitations`).
