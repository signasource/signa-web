"use client";

import { InfoPopover } from "@/components/dashboard/info-popover";
import type { MetricId } from "@/components/dashboard/metric-catalog";
import { Card, CardTitle } from "@/components/dashboard/ui";
import { NUMBER } from "@/components/dashboard/usage-business";
import { cn } from "@/lib/utils";

export type FunnelStep = { key: string; count: number };

/**
 * Keeps only the steps that form a path: a step reached by fewer people than a later one is not a
 * stage everyone goes through (e.g. reading-only lessons complete without any exercise), and
 * leaving it in would print a "108% sigue". The first step is always kept.
 */
export function funnelPath(steps: FunnelStep[]): FunnelStep[] {
  return steps.filter(
    (step, i) => i === 0 || steps.slice(i + 1).every((s) => s.count <= step.count),
  );
}

/** Share (0–100, whole) of each step that reaches the next one; `null` when a step is empty. */
export function funnelTransitions(steps: FunnelStep[]): (number | null)[] {
  return steps.slice(0, -1).map((step, i) => {
    const next = steps[i + 1]!.count;
    return step.count > 0 ? Math.round((next / step.count) * 100) : null;
  });
}

/** Index of the transition with the biggest drop (lowest continuation), or -1 when there is none. */
export function biggestDrop(transitions: (number | null)[]): number {
  let worst = -1;
  transitions.forEach((t, i) => {
    if (t == null || t >= 100) return;
    const current = worst < 0 ? null : transitions[worst];
    if (current == null || t < current) worst = i;
  });
  return worst;
}

/**
 * A horizontal funnel: each step's bar is sized relative to the first step, and every transition
 * reads the same way ("N% sigue"); the one with the biggest drop is called out in red, so the place
 * where users are lost reads at a glance.
 */
export function Funnel({
  title,
  metric,
  subtitle,
  steps: rawSteps,
  className,
}: {
  title: string;
  metric: MetricId;
  subtitle?: string;
  steps: FunnelStep[];
  className?: string;
}) {
  const steps = funnelPath(rawSteps);
  const top = steps[0]?.count ?? 0;
  const transitions = funnelTransitions(steps);
  const worst = biggestDrop(transitions);
  return (
    <Card className={cn("flex min-w-0 flex-col gap-3", className)}>
      <div className="flex items-center gap-1.5">
        <CardTitle>{title}</CardTitle>
        <InfoPopover metric={metric} className="ml-auto" />
      </div>
      {subtitle ? <p className="text-text-muted -mt-1.5 text-[13px]">{subtitle}</p> : null}
      {steps.length === 0 || top === 0 ? (
        <p className="text-text-muted text-sm">Sin datos todavía.</p>
      ) : (
        <ol className="flex flex-col">
          {steps.map((step, i) => {
            const width = Math.max(1, (step.count / top) * 100);
            const continues = transitions[i];
            return (
              <li key={step.key} className="flex flex-col gap-1.5">
                <div className="flex items-baseline justify-between gap-2 text-[13px]">
                  <span className="truncate font-bold">{step.key}</span>
                  <span className="shrink-0 font-extrabold">{NUMBER.format(step.count)}</span>
                </div>
                <div className="bg-fill h-2.5 overflow-hidden rounded-full">
                  <div
                    className="bg-primary h-full rounded-full"
                    style={{ width: `${width}%` }}
                    aria-hidden="true"
                  />
                </div>
                {continues != null ? (
                  <span
                    className={cn(
                      "my-1.5 self-start text-[12px] font-bold",
                      i === worst ? "text-danger" : "text-text-muted",
                    )}
                  >
                    ↓ {continues}% sigue{i === worst ? " · mayor caída" : ""}
                  </span>
                ) : null}
              </li>
            );
          })}
        </ol>
      )}
    </Card>
  );
}
