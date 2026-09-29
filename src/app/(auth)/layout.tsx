import { connection } from "next/server";

// Render per request so the CSP nonce set in src/proxy.ts can be applied (docs/security.md).
export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  await connection();
  return children;
}
