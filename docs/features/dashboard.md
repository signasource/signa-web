# Admin dashboard

> Responsibility: state and plan of the organization-admin panel.
> Update when: a dashboard screen is added/changed, or an endpoint becomes wired.
> Sources: src/app/(dashboard)/, src/lib/api/organizations.ts

Audience: `ADMIN`-role members of an organization (company admins). Read-only progress tracking for their participants; scope is enforced by `signa-api` (`requireManage`).

## Built

| Screen   | Route        | Data                        | Notes                                                                                               |
| -------- | ------------ | --------------------------- | --------------------------------------------------------------------------------------------------- |
| Overview | `/dashboard` | `organizationsApi.overview` | 4 stat cards (participants, active last 7 days, average progress, completed lessons). No charts yet |

## Planned (API already exposes the data — see [../api/endpoints.md](../api/endpoints.md))

- **Members** table: search/status filter, pagination, progress + last activity + current module.
- **Member detail:** individual progress per course.
- **Modules:** per-topic performance.
- **Weekly evolution chart** on the overview (Recharts; colors from tokens; table fallback).
- **Invitations:** invite codes and invite-by-email; remove member.
- **Accept-invite flow** (`/accept-invite?code=…`): register/login then redeem.
