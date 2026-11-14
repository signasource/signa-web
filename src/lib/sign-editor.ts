import { z } from "zod";
import type { AdminSign, AnimationFormat } from "@/lib/api/admin";

/** Mirrors signa-api AdminSignService.MAX_UPLOAD_BYTES and the multipart limit. */
export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

/** Same rule as signa-api (AdminSignService.MEANING_PATTERN) and the GLB viewer. */
const MEANING_RE = /^[\p{L}\p{N}_\- ]{1,40}$/u;

export function normalizeMeaning(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}

/** Spanish validation message, or null when the meaning is valid. */
export function meaningError(raw: string): string | null {
  const meaning = normalizeMeaning(raw);
  if (!meaning) return "El nombre no puede estar vacío.";
  if (meaning.length > 40) return "Máximo 40 caracteres.";
  if (!MEANING_RE.test(meaning)) return "Solo letras, números, espacios, guiones y guion bajo.";
  return null;
}

/** "Nueva seña" form. */
export const newSignSchema = z.object({
  meaning: z.string().superRefine((value, ctx) => {
    const message = meaningError(value);
    if (message) ctx.addIssue({ code: "custom", message });
  }),
  handedness: z.enum(["ONE_HANDED", "TWO_HANDED"]),
});
export type NewSignValues = z.infer<typeof newSignSchema>;

const YOUTUBE_RE = /^https?:\/\/(www\.|m\.)?(youtube\.com|youtu\.be)\/.+/;

export function youtubeError(raw: string): string | null {
  const url = raw.trim();
  if (!url || YOUTUBE_RE.test(url)) return null;
  return "Tiene que ser un link de YouTube (youtube.com o youtu.be).";
}

/**
 * Detects .glb (binary glTF) or .mp4 from the file's first bytes, the same check the API does.
 * QuickTime (.mov) shares the `ftyp` box but is rejected: Android WebViews don't play it.
 */
export async function detectMediaFormat(file: Blob): Promise<AnimationFormat | null> {
  const head = await readHead(file, 12);
  if (head.length < 12) return null;
  const ascii = (from: number, to: number) => String.fromCharCode(...head.slice(from, to));
  if (ascii(0, 4) === "glTF") return "glb";
  if (ascii(4, 8) === "ftyp" && ascii(8, 10) !== "qt") return "mp4";
  return null;
}

function readHead(file: Blob, length: number): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file.slice(0, length));
  });
}

/** Spanish error for a file picked for upload, or null when it can be sent. */
export async function uploadError(file: File): Promise<string | null> {
  if (file.size === 0) return "El archivo está vacío.";
  if (file.size > MAX_UPLOAD_BYTES) return "El archivo supera los 50 MB.";
  if (!(await detectMediaFormat(file))) return "Solo se aceptan archivos .glb (3D) o .mp4 (video).";
  return null;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
}

export type FormatFilter = "all" | AnimationFormat | "none";
export type SignSort = "az" | "recent" | "used";

const collator = new Intl.Collator("es", { sensitivity: "base" });

function fold(s: string) {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

/** Client-side catalog filter: accent/case-insensitive search + format, then sort. */
export function filterSigns(
  signs: AdminSign[],
  { query, format, sort }: { query: string; format: FormatFilter; sort: SignSort },
): AdminSign[] {
  const q = fold(query.trim());
  const out = signs.filter((s) => {
    if (q && !fold(s.meaning).includes(q)) return false;
    if (format === "none") return !s.animationFormat;
    if (format !== "all") return s.animationFormat === format;
    return true;
  });
  return out.sort((a, b) => {
    if (sort === "recent") {
      const ta = a.animationUpdatedAt ? Date.parse(a.animationUpdatedAt) : 0;
      const tb = b.animationUpdatedAt ? Date.parse(b.animationUpdatedAt) : 0;
      if (ta !== tb) return tb - ta;
    } else if (sort === "used" && a.lessonCount !== b.lessonCount) {
      return b.lessonCount - a.lessonCount;
    }
    return collator.compare(a.meaning, b.meaning);
  });
}

export function countByFormat(signs: AdminSign[]): Record<FormatFilter, number> {
  const counts: Record<FormatFilter, number> = { all: signs.length, glb: 0, mp4: 0, none: 0 };
  for (const s of signs) counts[s.animationFormat ?? "none"]++;
  return counts;
}

export function formatAgo(iso: string | null, now = Date.now()): string {
  if (!iso) return "";
  const mins = Math.floor((now - new Date(iso).getTime()) / 60_000);
  if (mins < 2) return "recién";
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours} h`;
  if (hours < 48) return "ayer";
  return `hace ${Math.floor(hours / 24)} días`;
}
