import { NextResponse } from "next/server";
import { deny, exchange, sameOrigin } from "@/lib/session-server";

const FIELDS = ["email", "username", "password", "name", "lastName"] as const;
const MAX_LENGTH = { email: 254, username: 50, password: 72, name: 100, lastName: 100 };

export async function POST(request: Request) {
  if (!sameOrigin(request)) return deny();
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const values: Record<string, string> = {};
  for (const field of FIELDS) {
    const value = body?.[field];
    if (typeof value !== "string" || !value || value.length > MAX_LENGTH[field]) {
      return NextResponse.json({ message: "Datos inválidos" }, { status: 400 });
    }
    values[field] = value;
  }
  return exchange("/auth/register", {
    email: values.email!,
    username: values.username!,
    password: values.password!,
    name: values.name!,
    last_name: values.lastName!,
  });
}
