"use client";

import { useState } from "react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  type TooltipContentProps,
  type TooltipValueType,
} from "recharts";
import { InfoPopover } from "@/components/dashboard/info-popover";
import type { MetricId } from "@/components/dashboard/metric-catalog";
import { Card, CardTitle } from "@/components/dashboard/ui";
import { cn } from "@/lib/utils";

/** Token palette for categorical slices (never Recharts defaults). */
const SLICE_COLORS = [
  "var(--color-primary)",
  "var(--color-accent-teal)",
  "var(--color-streak-orange)",
  "var(--color-gems-blue)",
  "var(--color-success)",
  "var(--color-danger)",
  "var(--color-social-wine)",
  "var(--color-neutral-gray)",
];

const NUMBER = new Intl.NumberFormat("es-AR");

export type PieItem = { label: string; value: number };

type Slice = PieItem & { color: string };

/** Same look as the bar charts' tooltip: a card with the slice's colour, value and share. */
function makeTooltip(total: number) {
  return function SliceTooltip({
    active,
    payload,
  }: TooltipContentProps<TooltipValueType, string | number>) {
    const slice = payload?.[0]?.payload as Slice | undefined;
    if (!active || !slice) return null;
    return (
      <div className="border-border bg-surface rounded-xl border px-3 py-2 text-[13px] whitespace-nowrap shadow-lg">
        <p className="flex items-center gap-1.5 font-bold">
          <span className="size-2 rounded-[3px]" style={{ background: slice.color }} />
          {slice.label}
        </p>
        <p className="mt-0.5">
          <span className="font-extrabold">{NUMBER.format(slice.value)}</span>
          <span className="text-text-muted">
            {" "}
            · {total > 0 ? Math.round((slice.value / total) * 100) : 0}%
          </span>
        </p>
      </div>
    );
  };
}

/**
 * Donut chart for a categorical distribution (statuses, types). Shows a slice legend with counts and
 * shares (percent of total) — the legend is the text alternative. A narrow card (under 22rem, a
 * container query) stacks the legend under the donut so labels stay on one line. Empty data shows a short message.
 */
export function BreakdownPie({
  title,
  metric,
  items,
}: {
  title: string;
  metric?: MetricId;
  items: PieItem[];
}) {
  const data: Slice[] = items
    .filter((i) => i.value > 0)
    .map((i, idx) => ({
      ...i,
      color: SLICE_COLORS[idx % SLICE_COLORS.length] ?? "var(--color-primary)",
    }));
  const total = data.reduce((s, i) => s + i.value, 0);
  // The hovered slice grows a little and the rest fade, so the tooltip reads against its slice.
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <Card className="@container flex min-w-0 flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <CardTitle>{title}</CardTitle>
        {metric ? <InfoPopover metric={metric} /> : null}
      </div>
      {total === 0 ? (
        <p className="text-text-muted text-sm">Sin datos en este período.</p>
      ) : (
        <div className="flex flex-col items-center gap-4 @[22rem]:flex-row">
          <div
            className="h-[128px] w-[128px] shrink-0"
            role="img"
            aria-label={data.map((d) => `${d.label}: ${d.value}`).join(". ")}
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="label"
                  innerRadius={38}
                  outerRadius={62}
                  paddingAngle={2}
                  stroke="var(--color-surface)"
                  strokeWidth={2}
                  isAnimationActive={false}
                  onMouseEnter={(_, i) => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                >
                  {data.map((d, i) => (
                    <Cell
                      key={d.label}
                      fill={d.color}
                      fillOpacity={hovered === null || hovered === i ? 1 : 0.35}
                      className="transition-[fill-opacity] duration-150"
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={makeTooltip(total)}
                  isAnimationActive={false}
                  offset={18}
                  allowEscapeViewBox={{ x: true, y: true }}
                  wrapperStyle={{ pointerEvents: "none", zIndex: 10 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="flex w-full min-w-0 flex-1 flex-col gap-1.5 self-stretch text-[13px] @[22rem]:self-auto">
            {data.map((d, i) => (
              <li
                key={d.label}
                className={cn(
                  "flex items-center gap-2 rounded-md transition-opacity duration-150",
                  hovered !== null && hovered !== i && "opacity-45",
                )}
              >
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ background: d.color }}
                  aria-hidden="true"
                />
                <span className="text-text-muted min-w-0 leading-snug">{d.label}</span>
                <span className="ml-auto font-extrabold">{NUMBER.format(d.value)}</span>
                <span className="text-text-muted w-10 text-right">
                  {Math.round((d.value / total) * 100)}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
