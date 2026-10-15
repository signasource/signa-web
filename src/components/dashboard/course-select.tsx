"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Icon } from "@/components/dashboard/icons";
import { headerChip } from "@/components/dashboard/ui";
import { useCourseFilter } from "@/features/dashboard/use-course-filter";
import { cn } from "@/lib/utils";

/**
 * Picks which contracted course the section shows. With a single course there is nothing to
 * choose, so it renders as a plain label.
 */
export function CourseSelect() {
  const { courses, course, setCourseId } = useCourseFilter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (
        e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)
      )
        setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  if (courses.length === 0) return null;

  if (courses.length === 1) {
    return (
      <span className={cn(headerChip, "bg-shop-amber-light text-shop-amber-dark")}>
        <Icon name="book" className="size-4" />
        <span className="max-w-[180px] truncate">{courses[0]!.name}</span>
      </span>
    );
  }

  const options = [{ id: null, name: "Todos los cursos" }, ...courses];
  const pick = (id: string | null) => {
    setCourseId(id);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          headerChip,
          "bg-shop-amber-light text-shop-amber-dark cursor-pointer transition-shadow hover:shadow-sm",
        )}
      >
        <Icon name="book" className="size-4" />
        <span className="max-w-[180px] truncate">{course?.name ?? "Todos los cursos"}</span>
        <Icon
          name="chevronDown"
          className={cn("size-3.5 transition-transform", open && "rotate-180")}
        />
      </button>
      {open ? (
        <ul
          id={menuId}
          role="listbox"
          aria-label="Curso"
          className="border-border bg-surface dash-card-enter absolute right-0 z-30 mt-2 flex w-64 flex-col gap-0.5 rounded-2xl border p-1.5 shadow-lg"
        >
          {options.map((o) => {
            const selected = (course?.id ?? null) === o.id;
            return (
              <li key={o.id ?? "all"} role="option" aria-selected={selected}>
                <button
                  type="button"
                  onClick={() => pick(o.id)}
                  className={cn(
                    "flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-bold transition-colors",
                    selected ? "bg-primary-light text-primary-dark" : "hover:bg-fill text-text",
                  )}
                >
                  <span className="truncate">{o.name}</span>
                  {selected ? <Icon name="check" className="size-4" /> : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
