# Admin sign editor (`/admin/signs`)

> Responsibility: the SIGNA back-office "Señas" screen — the sign catalog and its editor (name,
> handedness, YouTube link, animation upload, where each sign is used).
> Update when: the catalog, the editor, the upload rules, or the sign API contract change.
> Sources: src/app/(admin)/admin/signs/page.tsx, src/features/admin/signs/{sign-card,sign-editor,sign-animation-panel,sign-media-preview,confirm-dialog,errors}.ts(x), src/lib/sign-editor.ts, src/lib/glb.ts, src/app/api/glb-viewer/file/route.ts, src/lib/api/admin.ts

Mirrors the look of `/admin/courses` (tinted cards, sticky editor bar, dark summary card) with
design tokens instead of hex. Two views on one route, chosen by the `?id=` search param so the editor
is linkable and the browser's back button works:

- **Catalog** (no `id`): the whole catalog is loaded once (`GET /admin/signs?size=1000`, a few
  hundred signs) and filtered in the browser (`filterSigns`): accent/case-insensitive search, format
  tabs (Todas · 3D · Video · Sin animación, with counts) and sort (A→Z, recent uploads, most used).
  "Nueva seña" opens a react-hook-form + zod dialog (`newSignSchema`) and lands in the editor.
- **Editor** (`?id=<sign>`): explicit save (no autosave — a rename rewrites live lessons). Shows
  `Guardado / Sin guardar`, discards, guards leaving with unsaved changes, and deletes. "Eliminar" is disabled, with the reason in a
  tooltip on hover/focus (on a wrapper: disabled buttons get no hover events), while the sign is used in lessons or has open reports (the API refuses those).

## What can be changed

| Field     | Rules (client = API)                                                                                                           |
| --------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Name      | 1–40 letters (accents ok), digits, spaces, `-`, `_`; unique ignoring case. **Renaming cascades** (below)                       |
| Manos     | `ONE_HANDED` / `TWO_HANDED`                                                                                                    |
| YouTube   | optional `youtube.com` / `youtu.be` link; empty clears it                                                                      |
| Animation | Choose **Avatar 3D** (one `.glb`) or **Video** (front `.mp4` + optional lateral `.mp4`); type detected from the bytes, ≤ 50 MB |

**Rename.** Lessons and learners' learned-sign rows point at a sign by its text, so signa-api rewrites
them in the same transaction (every course version, published included). The editor asks for
confirmation whenever the sign is used, saying how many lessons (and how many published) change.

**Formats.** `SignAnimationPanel` (`sign-animation-panel.tsx`) has a format switch. A `.glb` sign is one
file. An `.mp4` sign has a front video and an optional **lateral** one (`view=lateral`, enabled once
the front is an `.mp4`; it can be removed). Uploading a `.glb` front drops the lateral video (the
avatar can be rotated instead). Each slot rejects the wrong file type with its own message.

**Missing files.** Imported signs point at `lsa/<meaning>.glb` even when that file was never uploaded
(e.g. "ayer"). The API checks it (`mediaAvailable`) and the editor shows "Falta el archivo" instead of
a failing 3D viewer.

**Upload.** Picking or dropping a file validates it client-side, asks to confirm when it replaces an
existing animation, and uploads it (`adminApi.uploadSignAnimation`, multipart). The app shows it right
away: it asks signa-api which file to load per sign (`POST /signs/media`) instead of deriving the
`.glb` URL from the name. The previous file is kept by the API under `<lang>/_history/`.

## Preview

`SignMediaPreview` frames the animation like the app's "Presentar seña" block: an `.mp4` plays as a
looping muted `<video>`; a `.glb` loads in `/api/glb-viewer/file?src=<url>` — a single-model
model-viewer page whose `src` must pass `isAllowedGlbSource` (the public R2 bucket, or the API's
`/media/` fallback used locally). See [security.md](../security.md#glb-viewer-routes).

## Where it is used

The editor lists every lesson that references the sign (course, version + status, unit, lesson, block
types) with "Abrir lección →", a deep link (`courseLessonHref`, `src/lib/course-deep-link.ts`) to
`/admin/courses?course=…&lesson=…&version=…` that opens the course editor on that exact version and
lesson (without `version`, the published one, else the latest). The catalog's "Lecciones" counts distinct
lessons in draft or published versions only.

## Local development

Without R2 credentials, signa-api stores uploads in `build/sign-media` and serves them at
`<api>/media/…`; the web CSP allows the API origin in `media-src` (video) and in the viewer's
`connect-src` (GLB) for that case.
