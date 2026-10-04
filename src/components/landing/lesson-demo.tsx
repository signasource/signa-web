"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { LisaGlbViewer } from "@/components/landing/lisa-glb-viewer";

export const DEMO_QUESTIONS = [
  { sign: "hola", answer: "Hola", options: ["Chau", "Hola", "Gracias", "Perdón"] },
  { sign: "gracias", answer: "Gracias", options: ["Por favor", "Amigo", "Gracias", "Hola"] },
  { sign: "hermano", answer: "Hermano", options: ["Hermano", "Chau", "Amigo", "Perdón"] },
  { sign: "por favor", answer: "Por favor", options: ["Gracias", "Perdón", "Hola", "Por favor"] },
] as const;

const HEARTS = 5;

const PRELOAD = DEMO_QUESTIONS.map((q) => q.sign);

export function LessonDemo({
  className,
  viewerClassName = "h-[300px]",
}: {
  className?: string;
  viewerClassName?: string;
}) {
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [hearts, setHearts] = useState(HEARTS);

  const question = DEMO_QUESTIONS[index % DEMO_QUESTIONS.length] ?? DEMO_QUESTIONS[0];
  const correct = picked === question.answer;
  const done = (index % DEMO_QUESTIONS.length) + (picked ? 1 : 0);

  function pick(option: string) {
    if (picked) return;
    setPicked(option);
    if (option !== question.answer) setHearts((h) => Math.max(1, h - 1));
  }

  function next() {
    setPicked(null);
    setIndex((i) => i + 1);
    if (index % DEMO_QUESTIONS.length === DEMO_QUESTIONS.length - 1) setHearts(HEARTS);
  }

  return (
    <div className={cn("bg-background flex flex-col gap-3 px-4 pt-7 pb-4", className)}>
      <div className="flex items-center gap-2.5">
        <svg
          aria-hidden="true"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          className="stroke-text-muted"
        >
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
        <div
          role="progressbar"
          aria-label="Avance de la lección"
          aria-valuemin={0}
          aria-valuemax={DEMO_QUESTIONS.length}
          aria-valuenow={done}
          className="bg-fill-dark h-2.5 flex-grow overflow-hidden rounded-full"
        >
          <div
            className="bg-primary h-2.5 rounded-full transition-[width] duration-500"
            style={{ width: `${Math.max(8, (done / DEMO_QUESTIONS.length) * 100)}%` }}
          />
        </div>
        <div
          className="text-danger flex items-center gap-1 text-xs font-extrabold"
          aria-label={`${hearts} vidas`}
        >
          <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 21s-8-5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 6-8 11-8 11z" />
          </svg>
          {hearts}
        </div>
      </div>

      <div
        className={cn(
          "bg-primary-light relative shrink-0 overflow-hidden rounded-[20px]",
          viewerClassName,
        )}
      >
        <LisaGlbViewer sign={question.sign} preload={PRELOAD} />
        <span className="bg-surface text-primary-dark pointer-events-none absolute top-2.5 left-2.5 z-10 rounded-full px-2.5 py-1 text-[10px] font-extrabold">
          3D
        </span>
        <span className="bg-surface/85 text-text-muted pointer-events-none absolute top-2.5 right-2.5 z-10 flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold">
          <svg
            aria-hidden="true"
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 12a9 9 0 0 1 15.5-6.2L21 8M21 3v5h-5M21 12a9 9 0 0 1-15.5 6.2L3 16M3 21v-5h5" />
          </svg>
          Girala
        </span>
      </div>

      <p className="font-display text-base font-bold tracking-tight">¿Qué significa esta seña?</p>

      <div className="grid grid-cols-2 gap-2">
        {question.options.map((option) => {
          const isAnswer = option === question.answer;
          const isPicked = option === picked;
          return (
            <button
              key={`${index}-${option}`}
              type="button"
              onClick={() => pick(option)}
              disabled={picked !== null && !isPicked && !isAnswer}
              aria-pressed={isPicked}
              className={cn(
                "flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-2xl border-2 text-[12.5px] font-bold transition-colors disabled:cursor-default",
                !picked && "bg-fill hover:border-primary hover:bg-primary-light border-transparent",
                picked && !isAnswer && !isPicked && "bg-fill border-transparent opacity-50",
                picked &&
                  isAnswer &&
                  "border-success bg-success-light text-success-dark font-extrabold",
                picked &&
                  isPicked &&
                  !isAnswer &&
                  "landing-shake border-danger bg-danger-light text-danger font-extrabold",
              )}
            >
              {picked && isAnswer && (
                <svg
                  aria-hidden="true"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12.5l4.5 4.5L19 7.5" />
                </svg>
              )}
              {option}
            </button>
          );
        })}
      </div>

      <div aria-live="polite" className="mt-auto min-h-11">
        {picked && (
          <button
            type="button"
            onClick={next}
            className={cn(
              "landing-modal-in flex h-11 w-full cursor-pointer items-center justify-between rounded-2xl px-4 text-[13px] font-extrabold text-white",
              correct ? "bg-success" : "bg-danger",
            )}
          >
            <span>{correct ? "¡Seña correcta! +15 XP" : `Era «${question.answer}»`}</span>
            <span className="flex items-center gap-1">
              Seguir
              <svg
                aria-hidden="true"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
