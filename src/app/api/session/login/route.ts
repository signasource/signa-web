import { NextResponse } from "next/server";
import { deny, exchange, sameOrigin } from "@/lib/session-server";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return deny();
  const body = (await request.json().catch(() => null)) as {
    identifier?: unknown;
    password?: unknown;
  } | null;
  const { identifier, password } = body ?? {};
  if (
    typeof identifier !== "string" ||
    typeof password !== "string" ||
    !identifier ||
    !password ||
    identifier.length > 254 ||
    password.length > 256
  ) {
    return NextResponse.json({ message: "Datos inválidos" }, { status: 400 });
  }
  return exchange("/auth/login", { identifier, password });
}
