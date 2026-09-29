# Design tokens

> Responsibility: color and font tokens and how they map to Tailwind.
> Update when: a token is added, changed, or removed, or fonts change.
> Sources: src/app/globals.css (`@theme`), src/app/layout.tsx

Tokens **mirror `signa-mobile`** (`src/theme/colors.ts`, `typography.ts`; see its `docs/design-system/`). Keep both in sync. Hex values below mirror `globals.css` (authoritative). Rule: every visual value comes from a token; never hardcode hex.

## Colors → Tailwind classes (`bg-*`, `text-*`, `border-*`)

| Token                            | Hex                               | Use                                                                           |
| -------------------------------- | --------------------------------- | ----------------------------------------------------------------------------- |
| `primary`                        | `#7857FF`                         | brand violet                                                                  |
| `primary-light`                  | `#EEE8FF`                         | soft fills over primary                                                       |
| `primary-dark`                   | `#5E3ED1`                         | pressed/emphasis                                                              |
| `background`                     | `#FAF6F2`                         | page background                                                               |
| `surface`                        | `#FFFFFF`                         | cards                                                                         |
| `fill` / `fill-dark`             | `#F2ECE6` / `#EBE3DB`             | field fill / stronger fill                                                    |
| `text`                           | `#241A16`                         | primary text; **primary buttons use `bg-text text-on-dark`** (as in mobile)   |
| `text-muted`                     | `#8C817A`                         | secondary text                                                                |
| `on-primary` / `on-dark`         | `#F5F0FF` / `#FBF6F2`             | text over primary / dark                                                      |
| `border`                         | `#ECE5DE`                         | borders                                                                       |
| `success` / `warning` / `danger` | `#4CA65C` / `#FBBF24` / `#E14E22` | status                                                                        |
| `success-dark` / `success-light` | `#2E7D45` / `#E7F5EA`             | status, active/positive state (e.g. "¡Te salió!")                             |
| `danger-light`                   | `#FBE0D8`                         | icon medallion tint for danger-toned items                                    |
| `primary-medallion`              | `#E0D5FF`                         | decorative rings/strokes over `primary` (mirrors mobile's `primaryMedallion`) |

## Landing-only accent palette

Card backgrounds on the marketing page ("Qué es Signa", "Para quién es"). Not used outside `src/components/landing/`.

| Token           | Hex       |
| --------------- | --------- |
| `accent-coral`  | `#FF8577` |
| `accent-amber`  | `#F7B32F` |
| `accent-teal`   | `#47BFA9` |
| `accent-violet` | `#8469EA` |

## Ported from signa-mobile's gamification/social palette

Mobile's full gamification/social palette is not ported wholesale; these are the ones the landing's
app mockups, team avatars, and org dashboard preview need (hex mirrors `signa-mobile`'s
`colors.ts` — see its `docs/design-system/colors.md`). Add more only when a web screen needs them.

| Token                | Hex       | Use                                               |
| -------------------- | --------- | ------------------------------------------------- |
| `streak-orange`      | `#FB8B24` | streak badge                                      |
| `gems-blue`          | `#29B6E8` | gems icon/border                                  |
| `gems-blue-dark`     | `#1B84AB` | gems text/count, avatar pairing                   |
| `course-teal`        | `#2FA8A0` | camera-recognition mockup accent                  |
| `course-teal-light`  | `#E4F1EC` | icon medallion tint                               |
| `social-wine`        | `#8A2C5E` | avatar pairing                                    |
| `shop-amber`         | `#DE7211` | shop/thematic-course accent                       |
| `shop-amber-dark`    | `#B85806` | avatar pairing, emphasis text                     |
| `shop-amber-light`   | `#FEF0DE` | icon medallion tint, badge background             |
| `avatar-teal-light`  | `#E0F4F2` | avatar background, paired with `avatar-teal-dark` |
| `avatar-teal-dark`   | `#1F7E77` | avatar foreground                                 |
| `avatar-wine-light`  | `#FDE8F1` | avatar background, paired with `social-wine`      |
| `avatar-blue-light`  | `#E4F1FB` | avatar background, paired with `gems-blue-dark`   |
| `avatar-green-light` | `#E9F3EB` | avatar background, paired with `success-dark`     |

## Landing-only dark ink shades

Camera-recognition phone mockup only (`feature-preview.tsx`).

| Token     | Hex       |
| --------- | --------- |
| `ink-900` | `#1E1714` |
| `ink-800` | `#2A211D` |
| `ink-700` | `#3A2F2A` |

Any other mobile gamification/social palette entry not listed above is not ported; add a token here only when a web screen needs it.

## Fonts

- `font-display` — **Bricolage Grotesque** (titles).
- `font-sans` — **Figtree** (body, labels, buttons; default on `body`).

Loaded with `next/font/google` in `src/app/layout.tsx`, exposed as `--font-bricolage` / `--font-figtree`.

## UI primitives

None extracted yet — pages use token classes directly. When a pattern repeats (button, card, input), extract it to `src/components/ui/` and list it here.
