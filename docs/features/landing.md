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

| Component                 | Renders                                                                                                                                                                                                                                        |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `nav.tsx`                 | Sticky header; scroll-tinted via CSS only (`landing.css`, no JS)                                                                                                                                                                               |
| `hero.tsx`                | Pinned "magic scroll" section: one continuous scroll crossfades the hero headline into Lisa's introduction, and the phone mockup from the home screen into a lesson screen, inside one circular backdrop — see "Scroll-driven animation" below |
| `marquesina.tsx`          | Two looping word rows (pure CSS, decorative)                                                                                                                                                                                                   |
| `que-es.tsx`              | Value prop + 3 clickable feature cards, each opening a `FeaturePreview` overlay                                                                                                                                                                |
| `para-quien.tsx`          | Horizontal pinned scroll, 4 audience cards                                                                                                                                                                                                     |
| `cursos.tsx`              | Free basic course + thematic (paid) courses                                                                                                                                                                                                    |
| `equipo.tsx`              | The 6-person team, UTN FRC Proyecto Final                                                                                                                                                                                                      |
| `cta-final.tsx`           | Closing CTA + Lisa                                                                                                                                                                                                                             |
| `landing-footer.tsx`      | Footer links (`/privacidad`, `/terminos`, organizations, legal)                                                                                                                                                                                |
| `organizations-modal.tsx` | "Signa para organizaciones" overlay: how it works, an example org dashboard, contact form. Triggered from the nav, hero, footer, and final CTA (`org-trigger.tsx`)                                                                             |
| `feature-preview.tsx`     | Per-feature overlay opened from a "Qué es Signa" card, showing a phone mockup for that feature                                                                                                                                                 |

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

## 3D animation (model-viewer)

The lesson screen inside the hero phone mockup renders a live GLB animation via `<model-viewer>`
(`@google/model-viewer` v3.5.0 loaded from CDN). The model is fetched from the shared Cloudflare
R2 bucket at `https://pub-f40a1de4d1fc46b0b6f07299847c66e0.r2.dev/lsa/{seña}.glb` — the same
endpoint used by `signa-mobile` (`src/features/animations/glbUrl.ts`).

`src/components/landing/lisa-glb-viewer.tsx` renders a same-origin `<iframe src="/api/glb-viewer?sign=...">`.
The Route Handler at `src/app/api/glb-viewer/route.ts` serves the model-viewer HTML with its own
CSP (`buildViewerCsp()`) and `X-Frame-Options: SAMEORIGIN`. This mirrors signa-mobile's WebView
approach (`baseUrl: "https://localhost"`) — the iframe needs a real HTTP origin context for the
CDN module script, blob: workers, and R2 fetches to work correctly; `srcDoc` lacks that context.

Camera framing logic (torso-up crop, FOV 15°, radius derived from bounding box) mirrors
`GlbAnimationView.tsx` in signa-mobile so the two surfaces look identical.

## Assets

- `public/images/lisa-waving.png`, `public/images/lisa-arms-crossed.png` — copied from
  `signa-mobile/assets/images/`; keep both repos' copies in sync if Lisa's artwork changes.
- `public/icons/*.svg` — a handful of the project's illustration set (not the gamification icon
  set used in-app); used as-is, no inline coloring.

## Known placeholders

Pricing (`[PRECIO]`), the organizations contact email, and the contact form's submit handler
(currently a no-op button) are unresolved — see [../status.md](../status.md). No `sitemap.ts` /
`robots.ts` / OG image yet.
