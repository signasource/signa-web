# API types

> Responsibility: DTO shapes the web uses and where they come from.
> Update when: a DTO is added or changed here, or the API's DTO changes.
> Sources: src/lib/api/types.ts; signa-api `organizations/dto/*`, `auth/dto/*`

Types live in `src/lib/api/types.ts`, camelCase (the client converts). They are **hand-mirrored** from the Java records — when the API changes a record, update the type here in the same change.

| Web type                    | API record                          | Notes                                                                                                                                                                                |
| --------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `AuthResponse`              | `AuthResponse`                      | `{ accessToken, refreshToken }`                                                                                                                                                      |
| `MyOrganization`            | `MyOrganizationResponse`            | `role: "ADMIN" \| "MEMBER"`; `status: "PENDING" \| "ACTIVE"`                                                                                                                         |
| `RedeemInviteCodeResponse`  | `RedeemInviteCodeResponse`          |                                                                                                                                                                                      |
| `OrganizationOverview`      | `OrganizationOverviewResponse`      | `participation` / `progress` / `performance`; with a period, `averageActiveDaysLast30` is per period and `progress.completedLessons` counts completions in it                        |
| `OrganizationMemberSummary` | `OrganizationMemberSummaryResponse` | `lastActivityAt`, `currentModule`, `currentCourse` nullable; `activityStatus` is the server-side status (the pill and the filter use it)                                             |
| `MemberProgress`            | `MemberProgressResponse`            | `lastActivityAt`, `currentModule` nullable; `activityStatus`; `courses: MemberCourseProgress[]`; with a period, `activeDaysLast30` counts the period                                 |
| `ModuleStats`               | `ModuleStatsResponse`               |                                                                                                                                                                                      |
| `InviteCode`                | `InviteCodeResponse`                | `email` null for shareable codes; `expiresAt`, `maxUses` nullable                                                                                                                    |
| `CourseSummary`             | `CourseSummaryResponse`             |                                                                                                                                                                                      |
| `WeeklyPerformance`         | `WeeklyPerformanceResponse`         | `weekStart` is an ISO date; typed but no longer rendered (the period card replaced it)                                                                                               |
| `OrganizationActivity`      | `OrganizationActivityResponse`      | `from`/`to` and `days[].date` are ISO dates; `ActivityFigures`, `DailyActivity` are its nested records. `totals.activeParticipants` counts distinct people (not the sum of the days) |
| `Page<T>`                   | Spring Data `Page`                  | Only the fields used: `content`, `totalElements`, `totalPages`, `number`, `size`                                                                                                     |

## Loose placeholders

None at the moment — every DTO the panel uses is typed.
