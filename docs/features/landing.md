# Landing

> Responsibility: state and plan of the public marketing site.
> Update when: a landing section/page is added or changed, or SEO setup changes.
> Sources: src/app/(marketing)/, src/components/landing/, src/app/layout.tsx (`metadata`)

**Status: built.** `/` (`src/app/(marketing)/page.tsx`) renders the full one-page landing: nav,
hero (with a playable lesson), feature marquee, "Conocé a Lisa", "Qué es Signa", "Para quién es",
"Cursos", an organizations overlay, the team, and a final CTA.

Rules ([../../CLAUDE.md](../../CLAUDE.md)): static rendering, no client-side data fetching,
`metadata` per page, Spanish copy.

## Sections (`src/components/landing/`)

| Component                 | Renders                                                                                                                                                                    |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `nav.tsx`                 | Sticky header, opaque + blurred background (content never shows through), shadow once scrolled. Below `md` the links collapse into `mobile-menu.tsx`                       |
| `hero.tsx`                | Headline + CTAs, and a phone mockup running `LessonDemo` next to Lisa waving. Normal document flow (not pinned). `#probar` anchors the demo                                |
| `lesson-demo.tsx`         | Playable "¿Qué significa esta seña?": Lisa signs in 3D (`LisaGlbViewer`), the visitor picks an answer, gets right/wrong feedback and hearts, and moves to the next sign    |
| `marquesina.tsx`          | Two word rows looping forever in opposite directions (pure CSS keyframes, pause on hover, decorative)                                                                      |
| `lisa-intro.tsx`          | "Conocé a Lisa" (`#lisa`): chat bubbles that pop in one by one, next to the app's home screen and Lisa with arms crossed                                                   |
| `que-es.tsx`              | Value prop (text fills in with color as it scrolls) + 3 clickable feature cards, each opening a `FeaturePreview` overlay                                                   |
| `para-quien.tsx`          | 4 audience cards in `card-rail.tsx`: native horizontal scroller (scroll-snap, prev/next buttons, progress bar, mouse drag). Each card has a CTA (demo, cursos, or org)     |
| `cursos.tsx`              | Free basic course (CTA → the hero demo) + thematic (paid) courses; each thematic course opens the organizations overlay                                                    |
| `equipo.tsx`              | The 6-person team, UTN FRC Proyecto Final                                                                                                                                  |
| `cta-final.tsx`           | Closing CTA + Lisa                                                                                                                                                         |
| `landing-footer.tsx`      | Footer links (`/privacidad`, `/terminos`, organizations, legal)                                                                                                            |
| `organizations-modal.tsx` | "Signa para organizaciones" overlay: how it works, an example org dashboard, contact form. Triggered from the nav, hero, audience cards, thematic courses, footer, and CTA |
| `feature-preview.tsx`     | Per-feature overlay opened from a "Qué es Signa" card, showing a phone mockup for that feature (the 3D one is a live `LessonDemo`)                                         |

## Interactivity (client boundary)

Server Components by default; client components only where there is state or a browser API:

- `landing-ui-provider.tsx` / `landing-ui-context.tsx` — one `"use client"` boundary at the top of
  the page tree, holding `orgOpen` and the open feature id, and rendering the two overlays. While
  one is open the page behind doesn't scroll and Escape closes it (the feature preview also closes
  on a backdrop click).
- `org-trigger.tsx`, `feature-card.tsx`, `mobile-menu.tsx` — small client leaves.
- `lesson-demo.tsx`, `lisa-glb-viewer.tsx` — the playable lesson and its 3D iframe.
- `card-rail.tsx` — the horizontal scroller.
- `landing-scroll-effects.tsx` — see below.

## Scroll effects

**No CSS scroll timelines.** The first version drove everything with `animation-timeline`
(pinned hero, pinned horizontal section). Firefox doesn't ship it, so Firefox users saw the
hero's two acts and both Lisa images stacked on top of each other, dead marquees, a transparent
nav, and two pinned sections that swallowed ~3000px of scrolling without moving. Don't reintroduce
it (nor pinned/scroll-jacked sections) without a real fallback.

Today `landing-scroll-effects.tsx` (renders nothing) runs one passive, rAF-throttled scroll
listener + an `IntersectionObserver`, and `src/app/(marketing)/landing.css` reacts to what it sets
(the landing code carries no inline comments; this section is the reference):

- `html[data-landing-js]` — only with JS running do `[data-reveal]` elements start hidden, so the
  page is fully readable without JS.
- `[data-reveal="up|left|right|pop|tilt-a|tilt-b|zoom|peek"]` → `data-in` once it enters the
  viewport (one-shot); CSS transitions animate it. Stagger with the `--delay` custom property.
  Don't put `data-reveal` on an element that also has a hover transform — wrap it instead.
- `--landing-scroll` (0→1 on `<html>`) → the top progress bar.
- `[data-progress]` → `--p` (0→1, `elementProgress()` in `src/lib/landing-scroll.ts`) → the
  "Qué es" text fill.
- `[data-landing-nav][data-scrolled]` → the nav's shadow.

Above-the-fold content uses `landing-enter` (a plain on-load keyframe), not reveals.
`prefers-reduced-motion: reduce` turns off every animation and shows reveals in their final state.

**Phone mockups** are laid out on a fixed design canvas (`--stage-w` × `--stage-h`) inside
`.landing-stage-wrap` and scaled with `--s` per breakpoint, so the composition shrinks instead
of breaking; the wrapper reserves the scaled height.

## 3D animation (model-viewer)

`LessonDemo` renders a live GLB animation via `<model-viewer>` (`@google/model-viewer` v3.5.0
from CDN). Models come from the shared Cloudflare R2 bucket
`https://pub-f40a1de4d1fc46b0b6f07299847c66e0.r2.dev/lsa/{seña}.glb` (`R2_GLB_BASE` in
`src/lib/glb.ts`) — the same files `signa-mobile` uses. Every sign in `DEMO_QUESTIONS` must exist
there (verified: `hola`, `gracias`, `hermano`, `por favor`; also available: `chau`, `perdón`,
`amigo`).

`lisa-glb-viewer.tsx` renders a same-origin `<iframe src="/api/glb-viewer?sign=...">`. The Route
Handler at `src/app/api/glb-viewer/route.ts` serves the model-viewer page with its own CSP
(`buildViewerCsp()`) and `X-Frame-Options: SAMEORIGIN`. This mirrors signa-mobile's WebView
approach (`baseUrl: "https://localhost"`) — the iframe needs a real HTTP origin context for the
CDN module script, blob: workers, and R2 fetches; `srcDoc` lacks that context.

- The GLBs are **Draco-compressed**: the viewer CSP must allow the decoder from `www.gstatic.com`
  and `'wasm-unsafe-eval'`, or no model ever loads — see [../security.md](../security.md).
- While a model loads (first load or a sign swap) the viewer hides model-viewer and shows only a
  centered spinner; the new model is framed first and then faded in, so the previous sign or a
  camera jump is never visible. A failed load shows "No pudimos cargar la seña."
- The visitor can drag to rotate (`camera-controls`, zoom/pan off, `touch-action: pan-y` so the
  page still scrolls on touch).
- Changing the sign posts `{ type: VIEWER_MESSAGE, sign }` to the iframe, which swaps `src` in
  place — no reload of model-viewer or the decoder. Both ends validate with `isSafeSign()`.

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
