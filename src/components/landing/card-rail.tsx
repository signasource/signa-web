"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { cn } from "@/lib/utils";

export function CardRail({ label, children }: { label: string; children: React.ReactNode }) {
  const rail = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [edges, setEdges] = useState({ start: true, end: false });

  useEffect(() => {
    const el = rail.current;
    if (!el) return;
    const update = () => {
      const max = el.scrollWidth - el.clientWidth;
      setProgress(max > 0 ? el.scrollLeft / max : 1);
      setEdges({ start: el.scrollLeft <= 4, end: el.scrollLeft >= max - 4 });
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  useEffect(() => {
    const el = rail.current;
    if (!el) return;
    let startX = 0;
    let startLeft = 0;
    let moved = false;
    let down = false;
    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      down = true;
      moved = false;
      startX = e.clientX;
      startLeft = el.scrollLeft;
    };
    const onMove = (e: PointerEvent) => {
      if (!down) return;
      const dx = e.clientX - startX;
      if (!moved && Math.abs(dx) > 5) {
        moved = true;
        el.setAttribute("data-dragging", "");
      }
      if (moved) el.scrollLeft = startLeft - dx;
    };
    const onUp = () => {
      if (!down) return;
      down = false;
      if (!moved) return;
      el.removeAttribute("data-dragging");
      el.scrollBy({ left: 0, behavior: "smooth" });
    };
    const onClick = (e: MouseEvent) => {
      if (moved) {
        e.preventDefault();
        e.stopPropagation();
        moved = false;
      }
    };
    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    el.addEventListener("click", onClick, true);
    const onDragStart = (e: DragEvent) => e.preventDefault();
    el.addEventListener("dragstart", onDragStart);
    return () => {
      el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      el.removeEventListener("click", onClick, true);
      el.removeEventListener("dragstart", onDragStart);
    };
  }, []);

  function step(dir: 1 | -1) {
    const el = rail.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-rail-item]");
    const amount = card ? card.offsetWidth + 24 : el.clientWidth * 0.8;
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  }

  return (
    <div className="flex flex-col gap-8">
      <div
        ref={rail}
        role="region"
        aria-label={label}
        tabIndex={0}
        className="landing-rail flex cursor-grab snap-x snap-mandatory gap-6 overflow-x-auto pb-6 focus-visible:outline-none"
      >
        {children}
      </div>
      <div className="mx-auto flex w-full max-w-6xl items-center gap-5 px-5 sm:px-8">
        <div
          className="bg-border h-1 flex-1 overflow-hidden rounded-full"
          style={{ "--rail": progress } as CSSProperties}
        >
          <div className="landing-rail-bar bg-text h-1 origin-left" />
        </div>
        <div className="flex gap-2">
          <RailButton label="Anterior" disabled={edges.start} onClick={() => step(-1)}>
            <path d="M19 12H5M11 6l-6 6 6 6" />
          </RailButton>
          <RailButton label="Siguiente" disabled={edges.end} onClick={() => step(1)}>
            <path d="M5 12h14M13 6l6 6-6 6" />
          </RailButton>
        </div>
      </div>
    </div>
  );
}

function RailButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "landing-btn border-border bg-surface text-text flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border-[1.5px]",
        "disabled:cursor-default disabled:opacity-35 disabled:hover:transform-none disabled:hover:shadow-none",
      )}
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
        strokeLinejoin="round"
      >
        {children}
      </svg>
    </button>
  );
}
