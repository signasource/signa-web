import { cn } from "@/lib/utils";

export function CloseButton({ onClick, className }: { onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      aria-label="Cerrar"
      onClick={onClick}
      className={cn(
        "flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-border bg-surface text-text",
        className,
      )}
    >
      <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
        <path d="M6 6l12 12M18 6L6 18" />
      </svg>
    </button>
  );
}
