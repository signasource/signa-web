import { NextResponse } from "next/server";
import { parseSignList, resolveSignMedia } from "@/lib/sign-formats";

/**
 * Which signs have a file in the public bucket, and which kind (`.glb` avatar or `.mp4` video with
 * an optional `_lateral.mp4`). Asked server-side because the browser's CSP and the bucket's CORS do
 * not allow probing R2 from the page. Only public objects are checked; names pass `isSafeSign`.
 * Used by the purchase page's course preview.
 */
async function exists(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(4000) });
    return res.ok;
  } catch {
    return false;
  }
}

export async function GET(request: Request) {
  const signs = parseSignList(new URL(request.url).searchParams.get("signs"));
  const found = await Promise.all(signs.map((sign) => resolveSignMedia(sign, exists)));
  return NextResponse.json(
    found.filter((m) => m !== null),
    {
      headers: { "Cache-Control": "private, max-age=600" },
    },
  );
}
