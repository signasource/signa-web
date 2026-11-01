import type { PurchaseStatus, SeatStatus } from "@/lib/api/types";
import { PURCHASE_STATUS_LABEL, seatStatusLabel } from "@/lib/purchases";
import { cn } from "@/lib/utils";

const PILL = "inline-block rounded-full px-2.5 py-1 text-xs font-extrabold whitespace-nowrap";

const PURCHASE_TONE: Record<PurchaseStatus, string> = {
  PENDING_PAYMENT: "bg-shop-amber-light text-shop-amber-dark",
  PAID: "bg-success-light text-success-dark",
  CANCELLED: "bg-fill text-text-muted",
  REFUNDED: "bg-danger-light text-danger",
};

const SEAT_TONE: Record<SeatStatus, string> = {
  PENDING_PAYMENT: "bg-fill text-text",
  INVITED: "bg-primary-light text-primary-dark",
  INVITATION_EXPIRED: "bg-danger-light text-danger",
  ACTIVE: "bg-success-light text-success-dark",
  ACCESS_EXPIRED: "bg-shop-amber-light text-shop-amber-dark",
  REVOKED: "bg-danger-light text-danger",
  CANCELLED: "bg-fill text-text-muted",
};

export function PurchaseStatusPill({ status }: { status: PurchaseStatus }) {
  return <span className={cn(PILL, PURCHASE_TONE[status])}>{PURCHASE_STATUS_LABEL[status]}</span>;
}

export function SeatStatusPill({
  status,
  purchaseStatus = "PAID",
}: {
  status: SeatStatus;
  purchaseStatus?: PurchaseStatus;
}) {
  return (
    <span className={cn(PILL, SEAT_TONE[status])}>{seatStatusLabel(status, purchaseStatus)}</span>
  );
}
