# Landing

> Responsibility: state and plan of the public marketing site.
> Update when: a landing section/page is added or changed, or SEO setup changes.
> Sources: src/app/(marketing)/, src/components/landing/, src/app/layout.tsx (`metadata`)

**Status: built.** `/` (`src/app/(marketing)/page.tsx`) renders the full one-page landing: nav,
hero (merged with the "Conocé a Lisa" intro), feature marquee, "Qué es Signa", "Para quién es",
"Cursos", an organizations overlay, the team, and a final CTA.

Rules ([../../CLAUDE.md](../../CLAUDE.md)): static rendering, no client-side data fetching,
`metadata` per page, Spanish copy.

## Sections (`src/components/landing/`)

| Component               | Renders                                                                                                                     |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| `nav.tsx`                 | Sticky header; scroll-tinted via CSS only (`landing.css`, no JS)                                                              |
| `hero.tsx`                | Pinned "magic scroll" section: one continuous scroll crossfades the hero headline into Lisa's introduction, and the phone mockup from the home screen into a lesson screen, inside one circular backdrop — see "Scroll-driven animation" below |
| `marquesina.tsx`          | Two looping word rows (pure CSS, decorative)                                                                                  |
| `que-es.tsx`               | Value prop + 3 clickable feature cards, each opening a `FeaturePreview` overlay                                               |
| `para-quien.tsx`           | Horizontal pinned scroll, 4 audience cards                                                                                     |
| `cursos.tsx`               | Free basic course + thematic (paid) courses                                                                                   |
| `equipo.tsx`               | The 6-person team, UTN FRC Proyecto Final                                                                                      |
| `cta-final.tsx`            | Closing CTA + Lisa                                                                                                             |
| `landing-footer.tsx`       | Footer links (`/privacidad`, `/terminos`, organizations, legal)                                                                |
| `organizations-modal.tsx`  | "Signa para organizaciones" overlay: how it works, an example org dashboard, contact form. Triggered from the nav, hero, footer, and final CTA (`org-trigger.tsx`) |
| `feature-preview.tsx`      | Per-feature overlay opened from a "Qué es Signa" card, showing a phone mockup for that feature                                |

## Interactivity (client boundary)

The only client components are the ones that hold or read UI state — everything else stays a
Server Component:

- `landing-ui-provider.tsx` / `landing-ui-context.tsx` — one `"use client"` boundary at the top of
  the page tree, holding `orgOpen` and the open feature id, and rendering the two overlays.
- `org-trigger.tsx`, `feature-card.tsx` — small client leaves that read the context to open an
  overlay.

## Scroll-driven animation ("magic scroll")

`src/app/(marketing)/landing.css` (imported only by the landing page) holds every scroll effect,
built on CSS `animation-timeline` (`view()`, `scroll(root)`, and a named `--hero` / `--hz`
timeline) — no JS. Wrapped in `@supports (animation-timeline: view())`, so it's progressive
enhancement; `prefers-reduced-motion: reduce` turns all of it off, and a `max-width: 900px` block
turns the two pinned sections (hero, "Para quién es") into a normal static/vertical layout.

The hero is the centerpiece: it is one pinned section (`view-timeline-name: --hero`) whose single
scroll range drives every effect inside it — the headline fading into Lisa's introduction, the
phone crossfading from its home screen to a lesson screen, and Lisa's waving photo crossfading
into her arms-crossed one — all keyed off percentages of that same timeline, so they always stay
in sync.

## Assets

- `public/images/lisa-waving.png`, `public/images/lisa-arms-crossed.png` — copied from
  `signa-mobile/assets/images/`; keep both repos' copies in sync if Lisa's artwork changes.
- `public/icons/*.svg` — a handful of the project's illustration set (not the gamification icon
  set used in-app); used as-is, no inline coloring.

## Known placeholders

Pricing (`[PRECIO]`), the organizations contact email, and the contact form's submit handler
(currently a no-op button) are unresolved — see [../status.md](../status.md). No `sitemap.ts` /
`robots.ts` / OG image yet.
