import { AdminAuthProvider } from "@/features/admin/admin-auth-context";

export default function AdminGroupLayout({ children }: { children: React.ReactNode }) {
  return <AdminAuthProvider>{children}</AdminAuthProvider>;
}
