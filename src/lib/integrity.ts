export async function sha256Hex(data: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

const RETRY_MS = [700, 2000];

async function fetchOnce(url: string, sha256: string): Promise<Uint8Array> {
  const res = await fetch(url, { credentials: "omit", referrerPolicy: "no-referrer" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.arrayBuffer();
  if ((await sha256Hex(data)) !== sha256) throw new Error("Integrity check failed");
  return new Uint8Array(data);
}

export async function fetchVerified(url: string, sha256: string): Promise<Uint8Array> {
  for (const wait of RETRY_MS) {
    try {
      return await fetchOnce(url, sha256);
    } catch {
      await new Promise((r) => setTimeout(r, wait));
    }
  }
  return fetchOnce(url, sha256);
}
