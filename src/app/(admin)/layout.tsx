import { connection } from "next/server";
import { AdminAuthProvider } from "@/features/admin/admin-auth-context";

export default async function AdminGroupLayout({ children }: { children: React.ReactNode }) {
  await connection();
  return <AdminAuthProvider>{children}</AdminAuthProvider>;
}
