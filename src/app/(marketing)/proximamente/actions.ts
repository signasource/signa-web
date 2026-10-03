"use server";

const apiUrl = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080").replace(/\/+$/, "");

export async function subscribeToWaitlist(
  email: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const res = await fetch(`${apiUrl}/waitlist`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (res.ok || res.status === 201 || res.status === 409) return { ok: true };
    return { ok: false, message: "Algo salió mal. Intentá de nuevo." };
  } catch {
    return { ok: false, message: "No pudimos conectarnos. Intentá de nuevo." };
  }
}
