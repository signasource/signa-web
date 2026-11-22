import type { PurchaseType } from "@/lib/api/admin";

const TYPES: readonly PurchaseType[] = ["SEATS", "GEMS", "COURSE"];

/** A link that opens one purchase's detail in the back-office "Compras" page. */
export function adminPurchaseHref(id: string, type: PurchaseType): string {
  return `/admin/purchases?${new URLSearchParams({ purchase: id, type }).toString()}`;
}

/** The purchase a "Compras" URL points at (`?purchase=&type=`), or `null` for the list. */
export function purchaseFromSearch(search: string): { id: string; type: PurchaseType } | null {
  const params = new URLSearchParams(search);
  const id = params.get("purchase");
  const type = params.get("type");
  if (!id || !type || !(TYPES as readonly string[]).includes(type)) return null;
  return { id, type: type as PurchaseType };
}
