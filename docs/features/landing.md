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

| Component             | Renders                                                                                                                                                                                                             |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `nav.tsx`             | Sticky header, opaque + blurred background (content never shows through), shadow once scrolled. Below `md` the links collapse into `mobile-menu.tsx`                                                                |
| `hero.tsx`            | Headline + CTAs, and a phone mockup running `LessonDemo` next to Lisa waving. Normal document flow (not pinned). `#probar` anchors the demo                                                                         |
| `lesson-demo.tsx`     | Playable "¿Qué significa esta seña?": Lisa signs in 3D (`LisaGlbViewer`), the visitor picks an answer, gets right/wrong feedback and hearts, and moves to the next sign                                             |
| `marquesina.tsx`      | Two word rows looping forever in opposite directions (pure CSS keyframes, pause on hover, decorative)                                                                                                               |
| `lisa-intro.tsx`      | "Conocé a Lisa" (`#lisa`): chat bubbles that pop in one by one, next to the app's home screen and Lisa with arms crossed                                                                                            |
| `que-es.tsx`          | Value prop (text fills in with color as it scrolls) + 3 clickable feature cards, each opening a `FeaturePreview` overlay                                                                                            |
| `cursos.tsx`          | Free basic course ("Probá una lección" → `/proximamente`) + thematic (paid) courses (Salud, Atención al cliente); org call-out at the bottom opens the organizations overlay                                        |
| `equipo.tsx`          | Single team photo (`/images/equipo.jpg`) — one image instead of 6 individual cards                                                                                                                                  |
| `cta-final.tsx`       | Closing CTA + Lisa                                                                                                                                                                                                  |
| `landing-footer.tsx`  | Footer links (`/privacidad`, `/terminos`, organizations, legal)                                                                                                                                                     |
| `org-trigger.tsx`     | Link to `/organizaciones`. Replaces the former modal-open button.                                                                                                                                                   |
| `feature-preview.tsx` | Per-feature overlay opened from a "Qué es Signa" card, showing a phone mockup for that feature. Two are live, in a wider modal with a larger phone: the 3D one (`LessonDemo`) and the camera one (`CameraNameDemo`) |

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
  model-viewer shares one WebGL renderer per page. Preloads are loaded one at a time, so the sign on screen
  is never queued behind the rest, and **only at a loop boundary**: preparing a model blocks the
  page for 300–450 ms, and doing it while Lisa signs made her first sign stutter. The viewer lets
  the visible sign play its first repetition untouched; when a repetition ends it holds Lisa in
  her starting pose, loads the next preload, and resumes once it is ready (`arm()`/`boundary()`/
  `resume()` in the route). Measured: 0 dropped frames during the first sign; a sign picked
  before its preload is loaded on demand (~1 s). **The very first sign plays its first repetition hidden, at 4× speed**
  (spinner on, `WARM_SPEED`), and Lisa appears from the start at normal speed: the first
  playback stuttered on real laptops, and only the first one. Costs ~1 s of extra spinner (a
  normal-speed warm-up cost 4 s), once per viewer. **Downloads run in parallel**: the viewer HTML preloads the first sign's
  GLB and the Draco decoder (`<link rel="preload">`), so they no longer wait for model-viewer's
  script and for each other. Measured on a 20 Mbps connection: Lisa visible at 3.4 s instead of
  4.3 s. What remains is mostly the GLB itself (~2.2 MB per sign). `LessonDemo` preloads its four questions; the camera demo
  preloads every letter of the name but starts recognizing right away — it never waits for the
  models (waiting for all of them used to delay the start by more than 10 s).

Camera framing logic (torso-up crop, FOV 15°, radius derived from bounding box) mirrors
`GlbAnimationView.tsx` in signa-mobile so the two surfaces look identical.

## Camera demo ("Tu cámara te corrige")

`camera-name-demo.tsx` is the real recognizer, not a mockup: the visitor types a name and spells
it in front of the webcam with the LSA manual alphabet. Same flow and look as the app's "Deletreá
tu nombre" and signa-ml's demo (`demo/static/nombre.html`): name input (empty), then per letter a
viewport with the mirrored camera (browser picture-in-picture disabled), the hand skeleton (toggle
with the app's `body` icon), a "¡Correcto!" card, the letter slots, a «Cambiar nombre» button (stops the camera and goes back to the name screen), and a "¡NOMBRE completado!" screen whose title wraps by whole words. No
progress bar and no debug panel. The modal adds a disclaimer that recognition can be wrong and is
still being reviewed.

- **Lisa's picture-in-picture** behaves exactly like `nombre.html`: 104×138 in a corner (top-left
  by default), dragged and snapped to the nearest corner, "tocá para agrandar", tapped to fill the
  viewport with the same spring transition, an X in the corner to shrink it back. After the last letter it stays during the celebration and fades out (`landing-pip-out`) before the completed screen, instead of vanishing. While small, a
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

- **CPU or GPU, chosen per device** (`src/lib/delegate-choice.ts`, run inside the worker).
  Recognition always starts on the CPU, so startup never waits. If no choice is stored yet, the
  first frames are timed: a CPU averaging ≤ 30 ms per hand detection is kept and nothing else is
  tried; a slower one triggers a one-time GPU trial (skipped when WebGL is software-rendered, cut
  short if the GPU is clearly slower), and the faster one wins (GPU must be ≥ 15% faster). Only the
  hand detector switches; the pose stays on the CPU. The result is stored in `localStorage`
  (`signa:reconocimiento:delegado:v1`); later visits switch to a stored GPU after the first frame.
  Cost: one ~0.5 s tracking pause on the visit that switches. Measured on a laptop with Intel Arc:
  CPU 75 ms → GPU 22 ms per detection, 10 → 20 fps; without a usable GPU: no trial, no pause.
- **Two hands:** MediaPipe always looks for up to 2 hands (with only 1 it picks either hand each
  frame and tracking jumped between them, e.g. a visitor standing full-body at the fair). The
  tracked hand starts as the **raised** one (the signing hand, not the one hanging by the side)
  and then follows proximity (`pickPrimary`; its position is kept for 1 s when no hand is seen).
  Both skeletons are drawn and every letter takes the better of the two hands.
  Measured with a full-body video (two hands in view, CPU): frame rate is the same with 1 or 2
  hands (~11 fps); looking for 1 hand made tracking jump 4–5 times in 30 s; classifying only the
  tracked hand dropped clear signs from 18% to 10% of hand frames. Q and W also need both
  hands touching (a fingertip within 0.6 hand sizes of the other hand, `touchWeight`).
- **Letters with a movement (Z):** the classifier is static (one frame in, probabilities out), so
  the movement is checked outside it, with two simple parts:
  - **Shape:** the index or the pinky is out (`fingerUp`, 3D fingertip-to-wrist reach). The other
    fingers and where the hand points don't matter.
  - **Movement:** `TraceTracker` follows the **palm center** (wrist + the four knuckles) of
    **every visible hand**, each on its own path (hands are paired with the nearest path, no
    distance limit: at 10 fps a fast Z moves the palm over 2 hand sizes between frames, and a
    limit split the path). Before, only the primary hand was followed, so a Z drawn with the
    other hand, or a tracking swap mid-Z, never completed — that was the "Z is impossible with
    two hands in view". A path only collects frames with the index or pinky out; with the finger
    down for over 250 ms it is cleared, so a movement made before raising the finger can't count.
    The path lasts 2 s, has no smoothing (it rounded the corners of fast Z) and is measured in
    units of the largest hand size seen in it (turning the hand shrinks it in the image; dividing
    by the per-frame size made the path jump). It is not mirrored: the Z is accepted in both
    directions, and the handedness label flickers.
    `tracesZ` finds horizontal turning points (a reversal counts after 0.12 hand sizes) and accepts
    go–back–go strokes measured **relative to the Z's own width**, so a small Z counts the same as a
    big one: width ≥ 0.3 hand sizes, top and bottom strokes ≥ 40% of the width, the last one at
    least 90% as wide as the diagonal (so it doesn't fire at the third vertex), the diagonal
    drops ≥ 30% of the width and the end is ≥ 40% lower than the start (recorded Z are flat,
    about 0.6 as tall as wide).
    Z score = shape × open gate (1.5 s after a traced Z, enough for the verifier on a slow phone;
    it was 2.5 s and any earlier movement plus a raised finger within that time fired a Z;
    cleared when a letter is confirmed and re-armed only once the finger comes down).
    Measured: the 6 recorded Z are found at full size, at 2× speed, and 4 of 6 at 30% of their
    size (2 of 6 before); synthetic raises, diagonal drops, waves and a still far hand never
    fire; the 30 s full-body two-hands video fires no Z. Lower minimums (reversal 0.08, width
    0.2) added little and fired 7/40 times with a still, far, jittery hand — the false Z seen
    on a phone with the hands down.
    With `?captura`, «Grabar Z 8 s» and «Grabar «no Z» 8 s» record both hands frame by frame for
    this kind of check.
- **The camera fades in** once two frames have been decoded at the final size, plus 120 ms
  (`videoReady`, `requestVideoFrameCallback`): iOS Safari showed it letterboxed for a moment
  before applying `object-fit: cover`.
- **Detection:** MediaPipe Tasks (`HandLandmarker` + `PoseLandmarker`, image mode, one hand,
  (see above)). The library is the npm package `@mediapipe/tasks-vision` (pinned to
  `0.10.22-rc.20250304`), bundled, and its WebAssembly is self-hosted under `/mediapipe/wasm`
  (copied from `node_modules` by `scripts/copy-mediapipe-wasm.mjs` before `dev`/`build`;
  `public/mediapipe/` is git-ignored). The `.task` models come from
  `storage.googleapis.com/mediapipe-models` (hand float16/1, pose lite float16/1) — the same bytes
  `signa-mobile` ships and the dataset was extracted with — and are checked against a pinned
  SHA-256 before use (`src/lib/integrity.ts`); a changed file is rejected. Loaded only when "Empezar" is
  pressed (`src/lib/alphabet-engine.ts`), so the landing's first load doesn't pay for it.
- **Classifier:** plain TypeScript (`src/lib/hand-features.ts` + `src/lib/alphabet-classifier.ts`),
  no TFLite/TensorFlow.js — the TFLite web runtime's loader needs `eval`, which the CSP forbids.
  Weights in `public/reconocedor/alfabeto.{json,bin}` (6 MB), exported by signa-ml
  `scripts/export_alphabet_for_web.py`, which folds normalization and BatchNorm into the dense
  layers. `alphabet-classifier.test.ts` checks the port against signa-ml on real hands
  (`alphabet-classifier.vectors.json`, generated by the same script): same features (< 1e-4) and
  probabilities (< 1e-5).
- **Decision** (`src/lib/alphabet-recognizer.ts`): verification of the requested letter against
  its calibrated threshold, averaged over 7 frames and held for 5; the T/I height rule; location
  zones (`LOCATION_ZONES`): H only counts with the index fingertip by the face, S and J on the chin and F at
  the shoulder of the signing side,
  in eyes-to-mouth units, with a soft edge — with no face detected they are not applied; the hand's
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
- Team photos (`public/images/equipo/`) can't be dragged or long-pressed/right-clicked as an
  image (no "open in new tab"/"save image"): `pointer-events: none`, `draggable={false}`,
  `-webkit-touch-callout: none`. This only deters casual copying — the files are public URLs.

## Page zoom

On screens 1024 px and wider the whole landing is rendered at 90% (`zoom: 0.9` on
`html:has(.landing-root)` in `landing.css`), which is how the design reads best on a desktop
monitor. It behaves like the browser's own zoom: viewport units are compensated (the hero still
fills the screen) and pointer coordinates stay consistent with `getBoundingClientRect()`. Phones
and tablets render at 100%.

## No pinch zoom on phones

The landing (`/` only) can't be zoomed with the fingers: `viewport` in
`src/app/(marketing)/page.tsx` sets `maximumScale: 1, userScalable: false` (also stops iOS from
zooming into the name field), `touch-action: pan-x pan-y` on `html`/`body` (`landing.css`) and
`LandingUIProvider` cancels Safari's `gesturestart`/`gesturechange`. Trade-off: visitors with low
vision lose pinch zoom on this page; the browser's text-size setting and "force enable zoom"
accessibility options still work.

## Feature preview modals

All four "Ver cómo funciona" modals share one size: almost the whole screen (up to 1280×960,
with a margin around it), text on the left and the phone on the right (stacked on phones, with
scroll inside the card). Each phone is drawn at its fixed design size (live demos 380×780, static
screens 300×640) and `FitPhone` in `feature-preview.tsx` scales it with a `ResizeObserver` to
fill the space left, so every phone has the same height and keeps its proportions. On phones (and on
desktops zoomed past the `md` breakpoint) text and phone are stacked and the phone's size is
computed once from the screen height when the modal opens: tracking the height made the phone
shrink when the keyboard opened, which moved the name field and made the page bounce. Also, on touch screens focusing the name
field centers the phone instantly (before the keyboard rises) and smooth scrolling is off while a modal
is open: a half-visible field made the browser scroll the modal smoothly while the keyboard was
resizing the screen, and the two fought (flicker).

Closing (X, backdrop or Escape) plays the opening animation in reverse (280 ms) before
unmounting; with `prefers-reduced-motion` it closes at once.

**Inside a modal, the 3D viewer starts 400 ms after it is mounted** (`LisaGlbViewer`'s `delay`, passed by the Señas en 3D modal; the hero's viewer starts at once and is part of the server HTML). Booting model-viewer
(script, WebGL, shaders) blocks the page's main thread for ~300 ms — the iframe is same-origin —
and doing it while the modal opens froze the whole opening animation. Measured: 0 dropped frames
during the opening now; the boot happens once the card is in place.

## Full pages (Próximamente, Organizaciones, Ingresar, Panel, legal)

Each one enters with `page-enter` (`globals.css`: 0.5 s fade + 8 px rise; off with
`prefers-reduced-motion`) on its content — the nav stays put, so moving from the landing feels
continuous. Going back is a single round arrow button (`src/components/back-button.tsx`) at the
top-left corner of the content, under the top bar: to `/` from Próximamente, Organizaciones and
the legal pages, to `/organizaciones` from Ingresar and Panel. There are no "Volver a…" text
links.

## 3D memory, Lisa's thumbnail and the progress bar

- **At most 3 models loaded per viewer** (`MAX_LOADED` in `src/lib/glb.ts`): each sign's GLB
  carries 18 textures of 1024×1024, ~100 MB of GPU memory. Preloading every letter of a name plus
  the hero's four questions reached ~1.1 GB, and phones killed the tab (the page reloaded at the
  top, typically when enlarging Lisa). Lessons and the camera demo preload only the next
  `PRELOAD_AHEAD` (2) signs, the viewer evicts the oldest loaded model, and the hero releases its
  viewer while a modal is open (`releaseViewerWithModal`). Measured peak: 11 → 3 models.
- **Lisa's thumbnail in the camera demo never resizes the 3D canvas.** The viewer is always laid
  out at the enlarged size; the thumbnail is that same render scaled down and cropped (`inner`
  transform in `SignPip`), and enlarging animates the box and the scale. Resizing the canvas on
  every frame made the animation stutter, and resizing it once flashed a tiny Lisa for a frame.
  Measured with CPU ÷4: 0 dropped frames enlarging or shrinking.
- **Top progress bar:** driven by the scroll itself (`animation-timeline: scroll(root)`) where
  supported; elsewhere (Firefox) the JS fallback writes `--landing-scroll` on the bar only, not
  on `<html>` — that forced a style recalc of the whole page on every scroll frame.
- **Keyboard on phones:** the viewport declares `interactive-widget=resizes-visual` (the keyboard
  overlays the page instead of resizing it), and focusing the name field centers the whole phone.

## Images are not selectable

`img`, `svg`, `canvas` and `video` are `user-select: none` and not draggable site-wide
(`globals.css`), so dragging a text selection across a section never highlights Lisa or a photo.
Text stays selectable.

## Marquee outline row

The second row is outlined, not filled. Bricolage Grotesque is a variable font whose glyphs are
built from overlapping contours, so a plain `-webkit-text-stroke` also draws the joints inside
each letter. The row is filled with the page background and stroked at twice the width with
`paint-order: stroke fill`, so the fill hides the inner half of the stroke and the joints. It
relies on the row sitting on `bg-background`; over another color, change the fill to match. Both
rows are `select-none`. Each word and its `·` separator are sibling spans, so hovering grows only
the word; the dot ignores the pointer.

## Opening the dev server from a phone

`next dev` only serves its dev scripts to `localhost` unless the origin is listed in
`allowedDevOrigins` (`next.config.ts`: `192.168.*.*`, `10.*.*.*`, `*.local`); otherwise the page
never hydrates on a phone and buttons/modals do nothing. The camera demo also needs a secure context, which plain `http://<LAN IP>` is not (the browser
hides `getUserMedia`; the demo then says the camera needs https). For the phone run
`npm run dev:celu`: `scripts/dev-cert.mjs` creates a self-signed certificate for `localhost` and
the machine's LAN IPs in `certificates/` (git-ignored, regenerated when the IPs change) and starts
`next dev` over https (it prints the phone URL as "Network"). Open `https://<LAN IP>:3000` on
the phone — not `0.0.0.0`, which browsers block — and accept
the certificate warning once.

## Known placeholders

Pricing (the thematic courses card shows no price until it is decided), the organizations contact email, and the contact form's submit handler
(currently a no-op button) are unresolved — see [../status.md](../status.md). No `sitemap.ts` /
`robots.ts` / OG image yet.
