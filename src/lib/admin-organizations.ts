import type { AdminOrganization } from "@/lib/api/admin";

/** Accent- and case-insensitive match on name, contact email, admin email or CUIT (digits only). */
export function matchesOrganization(org: AdminOrganization, query: string): boolean {
  const plain = (v: string) =>
    v
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase();
  const q = plain(query.trim());
  if (!q) return true;
  const digits = q.replace(/\D/g, "");
  return (
    [org.name, org.contactEmail, org.adminEmail ?? "", org.adminName ?? ""].some((v) =>
      plain(v).includes(q),
    ) ||
    (digits.length >= 3 && (org.cuit ?? "").replace(/\D/g, "").includes(digits))
  );
}
