# Admin sign editor (`/admin/signs`)

> Responsibility: the SIGNA back-office "Señas" screen — the sign catalog and its editor (name,
> handedness, YouTube link, where each sign is used).
> Update when: the catalog, the editor, or the sign API contract change.
> Sources: src/app/(admin)/admin/signs/page.tsx, src/features/admin/signs/{sign-card,sign-editor,sign-animation-view,sign-media-preview,confirm-dialog,errors}.ts(x), src/lib/sign-editor.ts, src/lib/api/admin.ts

Mirrors the look of `/admin/courses` (tinted cards, sticky editor bar, dark summary card) with
design tokens instead of hex. Two views on one route, chosen by the `?id=` search param so the editor
is linkable and the browser's back button works:

- **Catalog** (no `id`): the whole catalog is loaded once (`GET /admin/signs?size=1000`, a few
  hundred signs) and filtered in the browser (`filterSigns`): accent/case-insensitive search, format
  tabs (Todas · 3D · Video · Sin archivo, with counts), sort (A→Z, recent uploads, most used), and
  a **course filter** (`GET /admin/courses` for the picker; on selection loads the best non-archived
  version via `GET /admin/course-versions/{id}` and extracts sign meanings from block configs using
  `BLOCK_TYPES` from `src/lib/course-blocks.ts`; format-tab counts and results narrow to that course).
  "Nueva seña" opens a react-hook-form + zod dialog (`newSignSchema`) and lands in the editor.
- **Editor** (`?id=<sign>`): explicit save (no autosave — a rename rewrites live lessons). Shows
  `Guardado / Sin guardar`, discards, guards leaving with unsaved changes, and deletes. "Eliminar" is disabled, with the reason in a
  tooltip on hover/focus (on a wrapper: disabled buttons get no hover events), while the sign is used in lessons or has open reports (the API refuses those).

## What can be changed

| Field   | Rules (client = API)                                                                                     |
| ------- | -------------------------------------------------------------------------------------------------------- |
| Name    | 1–40 letters (accents ok), digits, spaces, `-`, `_`; unique ignoring case. **Renaming cascades** (below) |
| Manos   | `ONE_HANDED` / `TWO_HANDED`                                                                              |
| YouTube | optional `youtube.com` / `youtu.be` link; empty clears it                                                |

**Rename.** Lessons and learners' learned-sign rows point at a sign by its text, so signa-api rewrites
them in the same transaction (every course version, published included). The editor asks for
confirmation whenever the sign is used, saying how many lessons (and how many published) change.

**YouTube link.** The app reads the link from each `INTRODUCE_SIGN` block's config (`video_url`), not
from the catalog. Saving a new link makes signa-api copy it (or remove it, when cleared) into every
block that presents that sign, in all course versions (published included), in the same transaction.
Only done when the request carries `youtubeUrl`; blocks already holding the value are untouched.

## Animación (read-only)

`SignAnimationView` shows what learners see: `SignMediaPreview` in a phone frame (the .mp4 looping,
with a Frente/Lateral switch when there is a side video; the .glb in the model-viewer iframe), the
format, each file's bucket path with a "descargar" link, and when it was last uploaded. If the sign
points at a file that is not in the bucket (`mediaAvailable === false`) it says so. **Files cannot be
uploaded or replaced from the panel** — the upload panel was removed, and the client no longer has
`uploadSignAnimation` / `removeSignLateral` or the upload checks (`detectMediaFormat`, `uploadError`).

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
