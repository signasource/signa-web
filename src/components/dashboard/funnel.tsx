"use client";

import { InfoPopover } from "@/components/dashboard/info-popover";
import type { MetricId } from "@/components/dashboard/metric-catalog";
import { Card, CardTitle } from "@/components/dashboard/ui";
import { NUMBER } from "@/components/dashboard/usage-business";
import { cn } from "@/lib/utils";

export type FunnelStep = { key: string; count: number };

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
 * A horizontal funnel: each step's bar is sized relative to the first step, and between steps a
 * pill says what share continues. The transition with the biggest drop is called out in red
 * ("mayor caída"), so the place where users are lost reads at a glance.
 */
export function Funnel({
  title,
  metric,
  subtitle,
  steps,
}: {
  title: string;
  metric: MetricId;
  subtitle?: string;
  steps: FunnelStep[];
}) {
  const top = steps[0]?.count ?? 0;
  const transitions = funnelTransitions(steps);
  const worst = biggestDrop(transitions);
  return (
    <Card className="flex min-w-0 flex-col gap-3">
      <div className="flex items-center gap-1.5">
        <CardTitle>{title}</CardTitle>
        <InfoPopover metric={metric} className="ml-auto" />
      </div>
      {subtitle ? <p className="text-text-muted -mt-1.5 text-[13px]">{subtitle}</p> : null}
      {steps.length === 0 || top === 0 ? (
        <p className="text-text-muted text-sm">Sin datos en este período.</p>
      ) : (
        <ol className="flex flex-col gap-1.5">
          {steps.map((step, i) => {
            const width = Math.max(1, (step.count / top) * 100);
            const continues = transitions[i];
            return (
              <li key={step.key} className="flex flex-col gap-1">
                <div className="flex items-baseline justify-between gap-2 text-[13px]">
                  <span className="truncate font-bold">{step.key}</span>
                  <span className="shrink-0 font-extrabold">{NUMBER.format(step.count)}</span>
                </div>
                <div className="bg-fill h-5 overflow-hidden rounded-md">
                  <div
                    className="bg-primary h-full rounded-md"
                    style={{ width: `${width}%` }}
                    aria-hidden="true"
                  />
                </div>
                {continues != null ? (
                  <span
                    className={cn(
                      "mt-0.5 mb-1 self-start rounded-full px-2 py-0.5 text-[11px] font-extrabold",
                      i === worst ? "bg-danger-light text-danger" : "bg-fill text-text-muted",
                    )}
                  >
                    {i === worst
                      ? `▼ ${100 - continues}% no sigue · mayor caída`
                      : `${continues}% sigue`}
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
