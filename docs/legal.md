# Legal pages

> Responsibility: the privacy policy and terms pages, what facts they rest on, and what is still undecided.
> Update when: the text of either page changes, or ANY code in web/api/mobile changes what personal data is collected, shown, shared, or deleted.
> Sources: src/app/(marketing)/privacidad/page.tsx, src/app/(marketing)/terminos/page.tsx, src/components/legal/legal-page.tsx, src/lib/legal.ts

**Status: draft, not legally reviewed.** Written by the team for a UTN FRC final-year project (Ingeniería en Sistemas de Información); not legal advice. Both pages show a visible «Borrador» banner and are `noindex` until published.

## Pages

| URL           | File                              | Notes                       |
| ------------- | --------------------------------- | --------------------------- |
| `/privacidad` | `(marketing)/privacidad/page.tsx` | Privacy policy (Ley 25.326) |
| `/terminos`   | `(marketing)/terminos/page.tsx`   | Terms and conditions        |

Both are static, listed in `MARKETING_PATHS` ([security.md](./security.md)), and linked from the landing footer. Shared pieces: `LegalPage`/`Section`/`Todo` (`src/components/legal/legal-page.tsx`) and `src/lib/legal.ts` (contact email, institution, **`lastUpdated`** — bump it on every text change).

## The text must match the system

The policy makes factual claims. When the code changes, re-verify the claim (**code wins** — fix the page):

| Claim in the text                                                                                                  | Verify in                                                                                                  |
| ------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| Data collected (name, last name, email, username, progress, XP, streak, social, device token, Play purchase token) | `signa-api` entities: `User`, `UserStats`, `Friendship`, `DeviceToken`, `GemPurchase`, `UserDailyActivity` |
| Camera analysis is fully on-device; nothing uploaded                                                               | `signa-mobile/docs/features/ml.md`                                                                         |
| What org admins see per participant                                                                                | `signa-api` `MemberProgressResponse`, `OrganizationMemberSummaryResponse`, `OrganizationOverviewResponse`  |
| What account deletion does                                                                                         | `signa-api` `UserService.deleteAccount`                                                                    |
| Third parties (Google login/Play, Firebase FCM, Cloudflare R2, mail, hosting)                                      | `signa-api/.env.example`, `signa-api/CLAUDE.md` §4                                                         |

Adding a new third-party SDK, analytics, a new personal-data field, or a new thing admins can see **requires updating both pages and `lastUpdated` in the same PR**.

## Open decisions (search the pages for `COMPLETAR` / `REVISAR`)

1. **Team names and contact email** (`src/lib/legal.ts`, both pages).
2. **Data retention after account deletion.** Today `deleteAccount` only disables the account, anonymizes the **email**, and removes tokens/device tokens; **name, last name, username, and progress remain**. The policy says so honestly, but this likely falls short of the right to erasure (Ley 25.326) — decide between fixing the system (anonymize/delete) or a stated retention period.
3. **Roles with organizations** (controller vs processor) and whether a data-processing agreement is signed with each organization.
4. **AAIP database registration** — ask the faculty/advisor whether it applies.
5. **Minimum age** and parental authorization.
6. **Real-money purchases** (Google Play gem packs) in an academic project: fiscal/commercial status of the team, refund policy, consumer-law right of withdrawal (Ley 24.240).
7. **Jurisdiction** clause (consumers may sue at their domicile).
8. **Licenses** for code and content, third-party credits.
9. **Mail and hosting providers**, and server region (international transfer).
10. **Legal review** by the faculty's advisor or a lawyer before publishing; then remove the banner and the `noindex`.

Also not yet done: linking these pages from the mobile app (store listings and Play Console require a public privacy-policy URL) and consent capture at registration.
