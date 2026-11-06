"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { InfoPopover } from "@/components/dashboard/info-popover";
import type { MetricId } from "@/components/dashboard/metric-catalog";
import { Card, CardTitle } from "@/components/dashboard/ui";

/** Token palette for categorical slices (never Recharts defaults). */
const SLICE_COLORS = [
  "var(--color-primary)",
  "var(--color-accent-teal)",
  "var(--color-streak-orange)",
  "var(--color-accent-violet)",
  "var(--color-success)",
  "var(--color-danger)",
];

const NUMBER = new Intl.NumberFormat("es-AR");

export type PieItem = { label: string; value: number };

/**
 * Donut chart for a categorical distribution (statuses, types). Shows a slice legend with counts and
 * shares (percent of total) — the legend is the text alternative. Empty data shows a short message.
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
  const data = items.filter((i) => i.value > 0);
  const total = data.reduce((s, i) => s + i.value, 0);

  return (
    <Card className="flex min-w-0 flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <CardTitle>{title}</CardTitle>
        {metric ? <InfoPopover metric={metric} /> : null}
      </div>
      {total === 0 ? (
        <p className="text-text-muted text-sm">Sin datos en este período.</p>
      ) : (
        <div className="flex items-center gap-4">
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
                >
                  {data.map((d, i) => (
                    <Cell key={d.label} fill={SLICE_COLORS[i % SLICE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  isAnimationActive={false}
                  formatter={(value, name) => [NUMBER.format(Number(value)), String(name)]}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid var(--color-border)",
                    background: "var(--color-surface)",
                    fontSize: 13,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="flex min-w-0 flex-1 flex-col gap-1.5 text-[13px]">
            {data.map((d, i) => (
              <li key={d.label} className="flex items-center gap-2">
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ background: SLICE_COLORS[i % SLICE_COLORS.length] }}
                  aria-hidden="true"
                />
                <span className="text-text-muted truncate">{d.label}</span>
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
