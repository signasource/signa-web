import { env } from "@/lib/env";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const MIN_FILL_MS = 1500;

export function isValidEmail(email: string): boolean {
  return email.length <= 254 && EMAIL_RE.test(email);
}

export type WaitlistResult = { ok: true } | { ok: false; message: string };

export async function subscribeToWaitlist(email: string): Promise<WaitlistResult> {
  const clean = email.trim().toLowerCase();
  if (!isValidEmail(clean)) return { ok: false, message: "Revisá el email, parece incompleto." };
  try {
    const res = await fetch(`${env.apiUrl}/waitlist`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: clean }),
    });
    if (res.status === 400) return { ok: false, message: "Revisá el email, parece incompleto." };
    return { ok: true };
  } catch {
    return { ok: true };
  }
}
