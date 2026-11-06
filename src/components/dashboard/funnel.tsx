"use client";

import { InfoPopover } from "@/components/dashboard/info-popover";
import type { MetricId } from "@/components/dashboard/metric-catalog";
import { Card, CardTitle } from "@/components/dashboard/ui";
import { NUMBER } from "@/components/dashboard/usage-business";

/**
 * A horizontal funnel: each step's bar is sized relative to the first (widest) step, with the count
 * and the conversion from the previous step. Shows exactly where users drop off along a journey.
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
  steps: { key: string; count: number }[];
}) {
  const top = steps[0]?.count ?? 0;
  return (
    <Card className="flex min-w-0 flex-col gap-3">
      <div className="flex items-center gap-1.5">
        <CardTitle>{title}</CardTitle>
        <InfoPopover metric={metric} className="ml-auto" />
      </div>
      {subtitle ? <p className="text-text-muted -mt-1.5 text-[13px]">{subtitle}</p> : null}
      {steps.length === 0 ? (
        <p className="text-text-muted text-sm">Sin datos en este período.</p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {steps.map((step, i) => {
            const prev = i === 0 ? null : (steps[i - 1]?.count ?? 0);
            const fromPrev = prev && prev > 0 ? Math.round((step.count / prev) * 100) : null;
            const width = top > 0 ? Math.max(2, (step.count / top) * 100) : 0;
            return (
              <li key={step.key} className="flex flex-col gap-1">
                <div className="flex items-baseline justify-between gap-2 text-[13px]">
                  <span className="truncate font-bold">{step.key}</span>
                  <span className="shrink-0 font-extrabold">
                    {NUMBER.format(step.count)}
                    {fromPrev != null ? (
                      <span className="text-text-muted ml-1.5 font-semibold">{fromPrev}%</span>
                    ) : null}
                  </span>
                </div>
                <div className="bg-fill h-5 overflow-hidden rounded-md">
                  <div
                    className="bg-primary h-full rounded-md"
                    style={{ width: `${width}%` }}
                    aria-hidden="true"
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
