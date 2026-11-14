import { env } from "@/lib/env";

/** Full URL of a profile photo from the path the API sends, or null when there is none. */
export function avatarSrc(avatarUrl: string | null | undefined): string | null {
  return avatarUrl ? `${env.apiUrl}${avatarUrl}` : null;
}
