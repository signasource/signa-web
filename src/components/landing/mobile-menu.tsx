"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useLandingUI } from "@/components/landing/landing-ui-context";
import { NAV_LINKS } from "@/components/landing/nav-links";

export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const { openOrg } = useLandingUI();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={open}
        aria-controls="landing-mobile-menu"
        onClick={() => setOpen((o) => !o)}
        className="border-border bg-surface text-text flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border"
      >
        <svg
          aria-hidden="true"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
        >
          {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
      </button>
      <div
        id="landing-mobile-menu"
        hidden={!open}
        className={cn(
          "border-border bg-background absolute inset-x-0 top-full border-b px-5 pt-2 pb-5 shadow-lg",
          open && "landing-modal-in",
        )}
      >
        <ul className="flex flex-col">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                onClick={() => setOpen(false)}
                className="border-border flex min-h-12 items-center border-b text-lg font-bold"
              >
                {link.label}
              </Link>
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                openOrg();
              }}
              className="flex min-h-12 w-full cursor-pointer items-center text-left text-lg font-bold"
            >
              Organizaciones
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
}
