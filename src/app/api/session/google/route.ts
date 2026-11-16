import { NextResponse } from "next/server";
import { deny, exchange, sameOrigin } from "@/lib/session-server";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return deny();
  const body = (await request.json().catch(() => null)) as { idToken?: unknown } | null;
  const idToken = body?.idToken;
  if (typeof idToken !== "string" || !idToken || idToken.length > 4096) {
    return NextResponse.json({ message: "Datos inválidos" }, { status: 400 });
  }
  return exchange("/auth/google", { id_token: idToken });
}
