"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { CourseContents, CourseHero, CourseShowcase } from "@/components/dashboard/course-preview";
import { Icon } from "@/components/dashboard/icons";
import { ErrorState, LoadingState } from "@/components/dashboard/ui";
import { organizationsApi } from "@/lib/api/organizations";

/**
 * The purchased course as the buy screen showed it — hero, how its signs look and its contents —
 * from the version that was bought (`GET …/purchases/{id}/course`). A portal modal closed by its
 * ✕, Escape or the backdrop; focus goes to the ✕ and back on close.
 */
export function CourseDetailsDialog({
  orgId,
  purchaseId,
  onClose,
}: {
  orgId: string;
  purchaseId: string;
  onClose: () => void;
}) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const { data, isPending, error } = useQuery({
    queryKey: ["organization", orgId, "purchases", purchaseId, "course"],
    queryFn: () => organizationsApi.purchasedCourse(orgId, purchaseId),
  });

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previous?.focus?.();
    };
  }, [onClose]);

  return createPortal(
    <div
      className="bg-ink-900/50 fixed inset-0 z-60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="bg-background flex max-h-[90vh] w-[880px] max-w-full flex-col gap-4 overflow-y-auto rounded-3xl p-5 shadow-[0_24px_60px_rgba(30,23,20,.25)] sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-start gap-3">
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="font-display text-xl font-extrabold">
              Detalles del curso
            </h2>
            <p className="text-text-muted mt-0.5 text-[13px]">
              La versión del curso que compraste, como la viste al comprarla.
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="text-text-muted hover:bg-fill hover:text-text -mt-1 -mr-1 grid size-9 shrink-0 cursor-pointer place-items-center rounded-full"
          >
            <Icon name="close" className="size-5" />
          </button>
        </div>
        {isPending ? (
          <LoadingState>Cargando el curso…</LoadingState>
        ) : error ? (
          <ErrorState>No pudimos cargar los detalles del curso.</ErrorState>
        ) : (
          <div className="flex shrink-0 flex-col gap-4">
            <CourseHero course={data} />
            <CourseShowcase course={data} />
            <CourseContents course={data} />
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
