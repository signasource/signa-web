"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState, type ReactNode } from "react";
import { CourseSigns } from "@/components/dashboard/course-signs";
import { SignMediaPreview } from "@/features/admin/signs/sign-media-preview";
import { signsApi } from "@/lib/api/signs";
import type { CatalogCourse } from "@/lib/api/types";
import {
  courseFormat,
  courseSignList,
  showcaseSigns,
  MAX_PREVIEW_CANDIDATES,
  type CourseFormat,
} from "@/lib/course-preview";
import { cn } from "@/lib/utils";

const SHOWCASE_SIZE = 3;

const FORMAT_COPY: Record<CourseFormat, { label: string; text: string } | null> = {
  video: {
    label: "Señas en video",
    text: "Cada seña se enseña con un video real de una persona señando, con vista de frente y, en muchas, también lateral.",
  },
  avatar: {
    label: "Señas con avatar 3D",
    text: "Cada seña la hace un avatar 3D que tu equipo puede girar para mirarla desde cualquier ángulo.",
  },
  mixed: {
    label: "Videos y avatar 3D",
    text: "Las señas combinan videos reales y un avatar 3D que se puede girar para verlas desde todos los ángulos.",
  },
  unknown: null,
};

/** The pitch for a course an admin is about to buy: what it is, how signs look, what it covers. */
export function CoursePreview({ course }: { course: CatalogCourse }) {
  // Signs are looked up in signa-api in an order that spreads over the modules; the ones with no
  // file are skipped, so the sample is the first few that do have an avatar or a video.
  const candidates = useMemo(
    () =>
      showcaseSigns(
        course.modules,
        new Set(courseSignList(course.modules)),
        MAX_PREVIEW_CANDIDATES,
      ),
    [course.modules],
  );
  const media = useQuery({
    queryKey: ["course-preview-media", course.id],
    queryFn: async () => {
      const byName = new Map((await signsApi.media(candidates)).map((m) => [m.meaning, m]));
      // The API does not keep the request order, which decides what the sample shows.
      return candidates.flatMap((sign) => byName.get(sign) ?? []);
    },
    enabled: candidates.length > 0,
    staleTime: 10 * 60 * 1000,
  });

  const found = useMemo(() => media.data ?? [], [media.data]);
  const byMeaning = useMemo(() => new Map(found.map((m) => [m.meaning, m])), [found]);
  const copy = FORMAT_COPY[courseFormat(found.slice(0, SHOWCASE_SIZE))];
  const samples = useMemo(() => found.slice(0, SHOWCASE_SIZE).map((m) => m.meaning), [found]);

  const [picked, setPicked] = useState<{ courseId: string; sign: string } | null>(null);
  const selected =
    picked?.courseId === course.id && samples.includes(picked.sign) ? picked.sign : samples[0];
  const current = selected ? byMeaning.get(selected) : undefined;

  return (
    <div className="flex flex-col gap-4">
      <section
        aria-label={`Resumen de ${course.name}`}
        className="bg-ink-900 text-on-dark relative overflow-hidden rounded-3xl p-6 sm:p-8"
      >
        <div
          aria-hidden
          className="bg-primary/30 absolute -top-24 -right-16 size-72 rounded-full blur-3xl"
        />
        <div className="relative flex flex-col gap-4">
          <span className="text-primary-medallion text-[11px] font-bold tracking-widest uppercase">
            Curso de lengua de señas argentina
          </span>
          <h2 className="font-display text-3xl leading-tight font-bold text-balance sm:text-4xl">
            {course.name}
          </h2>
          <p className="text-on-dark/80 max-w-2xl text-[15px] text-pretty">
            {course.description ??
              "Tu equipo aprende señas reales de la comunidad sorda, a su ritmo y desde el celular."}
          </p>
          <ul className="flex flex-wrap gap-2">
            <Pill>
              {course.signCount} {course.signCount === 1 ? "seña" : "señas"}
            </Pill>
            <Pill>
              {course.modules.length} {course.modules.length === 1 ? "módulo" : "módulos"}
            </Pill>
            {course.hasAnimations && <Pill highlight>Animaciones 3D</Pill>}
            {course.hasVideos && <Pill highlight>Señas en video</Pill>}
            {course.hasCameraRecognition && <Pill>Práctica con cámara</Pill>}
          </ul>
        </div>
      </section>

      {candidates.length > 0 && media.isPending ? (
        <p className="text-text-muted text-sm">Cargando las señas del curso…</p>
      ) : samples.length > 0 && current ? (
        <section
          aria-label="Así se verán las señas en tu curso"
          className="border-border bg-surface grid items-center gap-6 rounded-3xl border p-5 sm:grid-cols-[1fr_auto] sm:p-8"
        >
          <div className="flex flex-col gap-4">
            <span className="text-primary-dark text-[11px] font-bold tracking-widest uppercase">
              Mirá cómo se ve
            </span>
            <h3 className="font-display text-2xl leading-tight font-bold text-balance">
              Así se verán las señas en tu curso
            </h3>
            {copy ? <p className="text-text-muted text-[15px] text-pretty">{copy.text}</p> : null}
            <div
              role="group"
              aria-label="Elegí una seña para verla"
              className="flex flex-wrap gap-2"
            >
              {samples.map((sign) => (
                <button
                  key={sign}
                  type="button"
                  aria-pressed={sign === selected}
                  onClick={() => setPicked({ courseId: course.id, sign })}
                  className={cn(
                    "rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors",
                    sign === selected
                      ? "border-primary bg-primary-light text-primary-dark"
                      : "border-border bg-surface hover:bg-fill",
                  )}
                >
                  {sign}
                </button>
              ))}
            </div>
            <p className="text-text-muted text-[13px]">
              Son señas reales del curso: tus equipos las ven igual en la app.
            </p>
          </div>
          <SignMediaPreview
            meaning={current.meaning}
            format={current.format}
            url={current.url}
            lateralUrl={current.lateralUrl}
            protectedMedia
          />
        </section>
      ) : null}

      <section className="border-border bg-surface flex flex-col gap-3 rounded-3xl border p-5 sm:p-6">
        <h3 className="font-display text-lg font-bold tracking-tight">
          Todo lo que van a aprender
        </h3>
        <CourseSigns course={course} />
      </section>
    </div>
  );
}

function Pill({ children, highlight }: { children: ReactNode; highlight?: boolean }) {
  return (
    <li
      className={cn(
        "rounded-full px-3 py-1 text-[13px] font-semibold",
        highlight ? "bg-primary text-on-primary" : "bg-on-dark/10 text-on-dark",
      )}
    >
      {children}
    </li>
  );
}
