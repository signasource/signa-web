import { ApiError } from "@/lib/api/client";

const RETRY_DELAYS_MS = [1000, 2500, 5000];

/** Network failures, 5xx and a 401 left over from an unavailable refresh: the session may be fine. */
export function isTransientError(err: unknown): boolean {
  if (err instanceof ApiError) return err.status >= 500 || err.status === 401;
  return err instanceof TypeError;
}

/**
 * Runs `load` (the boot-time "who am I" call) and retries while the failure looks transient, so a
 * restarting API or a flaky connection doesn't log anyone out. Definitive errors reject at once.
 */
export async function restoreWithRetry<T>(
  load: () => Promise<T>,
  delays: readonly number[] = RETRY_DELAYS_MS,
): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await load();
    } catch (err) {
      const delay = delays[attempt];
      if (delay === undefined || !isTransientError(err)) throw err;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}
