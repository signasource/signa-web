# Design tokens

> Responsibility: color and font tokens and how they map to Tailwind.
> Update when: a token is added, changed, or removed, or fonts change.
> Sources: src/app/globals.css (`@theme`), src/app/layout.tsx

Tokens **mirror `signa-mobile`** (`src/theme/colors.ts`, `typography.ts`; see its `docs/design-system/`). Keep both in sync. Hex values below mirror `globals.css` (authoritative). Rule: every visual value comes from a token; never hardcode hex.

## Colors → Tailwind classes (`bg-*`, `text-*`, `border-*`)

| Token                            | Hex                               | Use                                                                         |
| -------------------------------- | --------------------------------- | --------------------------------------------------------------------------- |
| `primary`                        | `#7857FF`                         | brand violet                                                                |
| `primary-light`                  | `#EEE8FF`                         | soft fills over primary                                                     |
| `primary-dark`                   | `#5E3ED1`                         | pressed/emphasis                                                            |
| `background`                     | `#FAF6F2`                         | page background                                                             |
| `surface`                        | `#FFFFFF`                         | cards                                                                       |
| `fill` / `fill-dark`             | `#F2ECE6` / `#EBE3DB`             | field fill / stronger fill                                                  |
| `text`                           | `#241A16`                         | primary text; **primary buttons use `bg-text text-on-dark`** (as in mobile) |
| `text-muted`                     | `#8C817A`                         | secondary text                                                              |
| `on-primary` / `on-dark`         | `#F5F0FF` / `#FBF6F2`             | text over primary / dark                                                    |
| `border`                         | `#ECE5DE`                         | borders                                                                     |
| `success` / `warning` / `danger` | `#4CA65C` / `#FBBF24` / `#E14E22` | status                                                                      |

Mobile's gamification/social palettes are not ported; add a token here only when a web screen needs it.

## Fonts

- `font-display` — **Bricolage Grotesque** (titles).
- `font-sans` — **Figtree** (body, labels, buttons; default on `body`).

Loaded with `next/font/google` in `src/app/layout.tsx`, exposed as `--font-bricolage` / `--font-figtree`.

## UI primitives

None extracted yet — pages use token classes directly. When a pattern repeats (button, card, input), extract it to `src/components/ui/` and list it here.
