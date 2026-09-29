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
| `Page<T>`                   | Spring Data `Page`                  | Only the fields used: `content`, `totalElements`, `totalPages`, `number`, `size` |

## Loose placeholders (tighten when used)

- `CourseSummary` — only `id` is typed; the rest is `unknown` until a screen renders courses.
- `WeeklyPerformance` — `Record<string, unknown>` until the evolution chart is built (read `WeeklyPerformanceResponse.java` then).
