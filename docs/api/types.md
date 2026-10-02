# API types

> Responsibility: DTO shapes the web uses and where they come from.
> Update when: a DTO is added or changed here, or the API's DTO changes.
> Sources: src/lib/api/types.ts; signa-api `organizations/dto/*`, `auth/dto/*`

Types live in `src/lib/api/types.ts`, camelCase (the client converts). They are **hand-mirrored** from the Java records — when the API changes a record, update the type here in the same change.

| Web type                    | API record                          | Notes                                                                            |
| --------------------------- | ----------------------------------- | -------------------------------------------------------------------------------- |
| `AuthResponse`              | `AuthResponse`                      | `{ accessToken, refreshToken }`                                                  |
| `MyOrganization`            | `MyOrganizationResponse`            | `role: "ADMIN" \| "MEMBER"`                                                      |
| `RedeemInviteCodeResponse`  | `RedeemInviteCodeResponse`          |                                                                                  |
| `OrganizationOverview`      | `OrganizationOverviewResponse`      | `participation` / `progress` / `performance`                                     |
| `OrganizationMemberSummary` | `OrganizationMemberSummaryResponse` | `lastActivityAt`, `currentModule` nullable                                       |
| `MemberProgress`            | `MemberProgressResponse`            | `lastActivityAt`, `currentModule` nullable; `courses: MemberCourseProgress[]`    |
| `ModuleStats`               | `ModuleStatsResponse`               |                                                                                  |
| `InviteCode`                | `InviteCodeResponse`                | `email` null for shareable codes; `expiresAt`, `maxUses` nullable                |
| `CourseSummary`             | `CourseSummaryResponse`             |                                                                                  |
| `WeeklyPerformance`         | `WeeklyPerformanceResponse`         | `weekStart` is an ISO date                                                       |
| `Page<T>`                   | Spring Data `Page`                  | Only the fields used: `content`, `totalElements`, `totalPages`, `number`, `size` |

## Loose placeholders

None at the moment — every DTO the panel uses is typed.
