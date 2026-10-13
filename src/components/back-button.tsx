import Link from "next/link";
import { cn } from "@/lib/utils";

export function BackButton({ href, className }: { href: string; className?: string }) {
  return (
    <Link
      href={href}
      aria-label="Volver"
      className={cn(
        "border-border bg-surface text-text absolute top-5 left-5 z-10 flex h-11 w-11 items-center justify-center rounded-full border shadow-sm transition-[translate,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 sm:left-8",
        className,
      )}
    >
      <svg
        aria-hidden="true"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M19 12H5M12 5l-7 7 7 7" />
      </svg>
    </Link>
  );
}
