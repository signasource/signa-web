import type { SignMedia } from "@/lib/api/types";

/**
 * The signs (of those asked, in order) that have a file in the bucket, with their kind and URLs.
 * Same-origin Next route, not `signa-api`.
 */
export async function fetchSignFormats(signs: string[]): Promise<SignMedia[]> {
  const res = await fetch(`/api/sign-formats?signs=${encodeURIComponent(signs.join(","))}`);
  if (!res.ok) throw new Error(`sign-formats ${res.status}`);
  return (await res.json()) as SignMedia[];
}
