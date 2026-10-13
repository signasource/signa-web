import { NextResponse } from "next/server";
import { clearSession, deny, sameOrigin } from "@/lib/session-server";

export function POST(request: Request) {
  if (!sameOrigin(request)) return deny();
  return clearSession(new NextResponse(null, { status: 204 }));
}
