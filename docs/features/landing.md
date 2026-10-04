# Landing

> Responsibility: state and plan of the public marketing site.
> Update when: a landing section/page is added or changed, or SEO setup changes.
> Sources: src/app/(marketing)/, src/components/landing/, src/app/layout.tsx (`metadata`)

**Status: built.** `/` (`src/app/(marketing)/page.tsx`) renders the full one-page landing: nav,
hero (with a playable lesson), "Qué es Signa", feature marquee, "Conocé a Lisa", "Cursos", the
team, and a final CTA. Section order: Hero → QueEs → Marquesina → LisaIntro → Cursos → Equipo →
CtaFinal → Footer. "Para quién es" was removed.

`/proximamente` (`src/app/(marketing)/proximamente/page.tsx`) is the coming-soon page reached by
all "Empezá gratis" CTAs. It explains the app is ready and being submitted to Google Play, shows
a waitlist email form (calls `POST /waitlist` on `signa-api`), and links to `/organizaciones`.

`/organizaciones` (`src/app/(marketing)/organizaciones/page.tsx`) is the organizations marketing
page: hero, four-step flow, an example org dashboard preview, and CTAs to login or register. It
replaces the former `organizations-modal.tsx` overlay that was embedded inside the landing.

`/organizaciones/ingresar` is the org auth page: login tab (uses existing `useAuth().login()`,
redirects to `/organizaciones/panel`) and register tab (CUIT + org name + email + password, with
CUIT validation via `src/lib/cuit.ts`; registration API not yet available — submission shows a
"te avisamos" confirmation).

`/organizaciones/panel` is the post-login holding page shown when the org module is not yet
complete; it redirects unauthenticated users to `/organizaciones/ingresar`.

Rules ([../../CLAUDE.md](../../CLAUDE.md)): static rendering, no client-side data fetching,
`metadata` per page, Spanish copy.

## Sections (`src/components/landing/`)

| Component                 | Renders                                                                                                                                                                      |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `nav.tsx`                 | Sticky header, opaque + blurred background (content never shows through), shadow once scrolled. Below `md` the links collapse into `mobile-menu.tsx`                         |
| `hero.tsx`                | Headline + CTAs, and a phone mockup running `LessonDemo` next to Lisa waving. Normal document flow (not pinned). `#probar` anchors the demo                                  |
| `lesson-demo.tsx`         | Playable "¿Qué significa esta seña?": Lisa signs in 3D (`LisaGlbViewer`), the visitor picks an answer, gets right/wrong feedback and hearts, and moves to the next sign      |
| `marquesina.tsx`          | Two word rows looping forever in opposite directions (pure CSS keyframes, pause on hover, decorative)                                                                        |
| `lisa-intro.tsx`          | "Conocé a Lisa" (`#lisa`): chat bubbles that pop in one by one, next to the app's home screen and Lisa with arms crossed                                                     |
| `que-es.tsx`              | Value prop (text fills in with color as it scrolls) + 3 clickable feature cards, each opening a `FeaturePreview` overlay                                                     |
| `cursos.tsx`              | Free basic course ("Probá una lección" → `/proximamente`) + thematic (paid) courses (Salud, Atención al cliente); org call-out at the bottom opens the organizations overlay |
| `equipo.tsx`              | Single team photo (`/images/equipo.jpg`) — one image instead of 6 individual cards                                                                                           |
| `cta-final.tsx`           | Closing CTA + Lisa                                                                                                                                                           |
| `landing-footer.tsx`      | Footer links (`/privacidad`, `/terminos`, organizations, legal)                                                                                                              |
| `org-trigger.tsx`         | Link to `/organizaciones`. Replaces the former modal-open button.                                                                                                            |
| `feature-preview.tsx`     | Per-feature overlay opened from a "Qué es Signa" card, showing a phone mockup for that feature. Two are live, in a wider modal with a larger phone: the 3D one (`LessonDemo`) and the camera one (`CameraNameDemo`) |

## Interactivity (client boundary)

Server Components by default; client components only where there is state or a browser API:

- `landing-ui-provider.tsx` / `landing-ui-context.tsx` — one `"use client"` boundary at the top of
  the page tree, holding the open feature id, and rendering the `FeaturePreview` overlay. While
  a feature is open the page behind doesn't scroll and Escape closes it.
- `feature-card.tsx`, `mobile-menu.tsx` — small client leaves.
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

**Live phones in the feature modal** (3D lesson and camera demo) use the same idea: a fixed
380×780 canvas (`.landing-live-phone` / `.landing-live-phone-canvas`) scaled as a whole by
`--s` — by width on phones, by viewport height on desktop so the modal always fits — so they
shrink or grow but never stop looking like a phone.

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
- Changing the sign posts `{ type: VIEWER_MESSAGE, sign }` to the iframe — no reload of
  model-viewer or the decoder. Both ends validate with `isSafeSign()`.
- **One model-viewer per sign, kept loaded.** Loading a model (parse, GPU upload, shaders)
  blocks the page's main thread for a moment — the iframe is same-origin, so it shares it with
  the landing; measured 172 ms per sign change. That froze the camera demo's skeleton on every
  correct letter. Pages send `{ type: VIEWER_PRELOAD, signs }` (validated with
  `safeSignList()`) to load signs ahead of time; switching to a loaded sign only swaps which one
  is visible (measured 0 ms of blocking). Hidden viewers are paused and don't render;
  model-viewer shares one WebGL renderer per page. The iframe reports each loaded (or failed)
  sign back with `{ type: VIEWER_LOADED, sign }`. `LessonDemo` preloads its four questions; the
  camera demo preloads every letter of the name and only starts recognizing once they are in
  ("Preparando las señas…", at most 10 s).

Camera framing logic (torso-up crop, FOV 15°, radius derived from bounding box) mirrors
`GlbAnimationView.tsx` in signa-mobile so the two surfaces look identical.

## Camera demo ("Tu cámara te corrige")

`camera-name-demo.tsx` is the real recognizer, not a mockup: the visitor types a name and spells
it in front of the webcam with the LSA manual alphabet. Same flow and look as the app's "Deletreá
tu nombre" and signa-ml's demo (`demo/static/nombre.html`): name input (empty), then per letter a
viewport with the mirrored camera (browser picture-in-picture disabled), the hand skeleton (toggle
with the app's `body` icon), a "¡Correcto!" card, the letter slots, a pause button (keeps tracking,
stops recognizing), and a "¡NOMBRE completado!" screen whose title wraps by whole words. No
progress bar and no debug panel. The modal adds a disclaimer that recognition can be wrong and is
still being reviewed.

- **Lisa's picture-in-picture** behaves exactly like `nombre.html`: 104×138 in a corner (top-right
  by default), dragged and snapped to the nearest corner, "tocá para agrandar", tapped to fill the
  viewport with the same spring transition, an X in the corner to shrink it back. While small, a
  transparent layer over the `LisaGlbViewer` iframe takes the drag/tap (an iframe swallows pointer
  events); when big it is removed and dragging rotates the model.
- **Detection runs in a Web Worker** (`src/lib/alphabet-worker.ts`, driven by
  `src/lib/alphabet-client.ts`), exactly as signa-ml's demo page runs it on its server: the page
  sends one 480 px frame at a time and only draws, easing the skeleton 35% per animation frame
  toward the latest detection and hiding it without a hand (the same as `LandmarkRenderer` in
  `demo/static/signa.js`). Run on the page's thread, each detection froze the drawing for a few
  milliseconds and the skeleton moved in jerks. The worker is a same-origin script, covered by
  `worker-src 'self'`.

Everything runs on the visitor's device; no frame leaves the browser.

- **Detection:** MediaPipe Tasks (`HandLandmarker` + `PoseLandmarker`, image mode, one hand,
  GPU with CPU fallback) from the CDN, pinned to `0.10.22-rc.20250304`; the `.task` models come
  from `storage.googleapis.com/mediapipe-models` (hand float16/1, pose lite float16/1) — the same
  bytes `signa-mobile` ships and the dataset was extracted with. Loaded only when "Empezar" is
  pressed (`src/lib/alphabet-engine.ts`), so the landing's first load doesn't pay for it.
- **Classifier:** plain TypeScript (`src/lib/hand-features.ts` + `src/lib/alphabet-classifier.ts`),
  no TFLite/TensorFlow.js — the TFLite web runtime's loader needs `eval`, which the CSP forbids.
  Weights in `public/reconocedor/alfabeto.{json,bin}` (6 MB), exported by signa-ml
  `scripts/export_alphabet_for_web.py`, which folds normalization and BatchNorm into the dense
  layers. `alphabet-classifier.test.ts` checks the port against signa-ml on real hands
  (`alphabet-classifier.vectors.json`, generated by the same script): same features (< 1e-4) and
  probabilities (< 1e-5).
- **Decision** (`src/lib/alphabet-recognizer.ts`): verification of the requested letter against
  its calibrated threshold, averaged over 7 frames and held for 5; the T/I height rule; the hand's
  position relative to the face (from the pose). Only what the viewport shows is analyzed: what
  `object-fit: cover` crops out is blanked before detection.
- **Updating the model:** retrain/calibrate in signa-ml, then `python scripts/export_alphabet_for_web.py`
  (writes the weights here and regenerates the test vectors) and run `npm run test`.

## Assets

- `public/reconocedor/alfabeto.json`, `public/reconocedor/alfabeto.bin` — the camera demo's
  classifier (labels, per-letter thresholds, folded weights), exported from signa-ml.
- `public/images/lisa-waving.png`, `public/images/lisa-arms-crossed.png` — copied from
  `signa-mobile/assets/images/`; keep both repos' copies in sync if Lisa's artwork changes.
- `public/icons/*.svg` — a handful of the project's illustration set (not the gamification icon
  set used in-app); used as-is, no inline coloring.

## Known placeholders

Pricing (`[PRECIO]`), the organizations contact email, and the contact form's submit handler
(currently a no-op button) are unresolved — see [../status.md](../status.md). No `sitemap.ts` /
`robots.ts` / OG image yet.
