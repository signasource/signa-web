import type { CatalogModule, SignMedia } from "@/lib/api/types";

export type CourseFormat = "video" | "avatar" | "mixed" | "unknown";

/** How the course shows its signs, from the media of the signs it teaches. */
export function courseFormat(media: SignMedia[]): CourseFormat {
  if (media.length === 0) return "unknown";
  const videos = media.filter((m) => m.format === "mp4").length;
  if (videos === media.length) return "video";
  if (videos === 0) return "avatar";
  return "mixed";
}

/** Every distinct sign of the course, in module order. */
export function courseSignList(modules: CatalogModule[]): string[] {
  return [...new Set(modules.flatMap((m) => m.signs))];
}

/**
 * Up to `limit` signs that have an animation, taking one from each module in turn so the sample
 * covers the whole course instead of only its first unit.
 */
export function showcaseSigns(
  modules: CatalogModule[],
  available: ReadonlySet<string>,
  limit: number,
): string[] {
  const queues = modules.map((m) => m.signs.filter((s) => available.has(s)));
  const picked: string[] = [];
  for (let round = 0; ; round++) {
    let progressed = false;
    for (const queue of queues) {
      const sign = queue[round];
      if (sign === undefined) continue;
      progressed = true;
      if (!picked.includes(sign)) picked.push(sign);
      if (picked.length >= limit) return picked;
    }
    if (!progressed) return picked;
  }
}
