"use client";

import { useState } from "react";
import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, XAxis } from "recharts";
import { Card, CardTitle, pillButton } from "@/components/dashboard/ui";
import type { WeeklyPerformance } from "@/lib/api/types";
import { formatDayMonth } from "@/lib/dashboard-format";
import { cn } from "@/lib/utils";

type Metric = "attempts" | "correct";

const METRICS: { key: Metric; label: string; caption: string }[] = [
  { key: "attempts", label: "Ejercicios", caption: "Ejercicios realizados en cada semana" },
  {
    key: "correct",
    label: "Respuestas correctas",
    caption: "Porcentaje de respuestas correctas por semana",
  },
];

export function WeeklyEvolution({ weeks, delay }: { weeks: WeeklyPerformance[]; delay?: number }) {
  const [metric, setMetric] = useState<Metric>("attempts");
  const [asTable, setAsTable] = useState(false);
  const current = METRICS.find((m) => m.key === metric)!;

  const data = weeks.map((w) => ({
    label: formatDayMonth(w.weekStart),
    attempts: w.exerciseAttempts,
    correct: w.correctPercentage,
    value: metric === "attempts" ? w.exerciseAttempts : w.correctPercentage,
    text: metric === "attempts" ? String(w.exerciseAttempts) : `${w.correctPercentage}%`,
  }));
  const summary = data.map((d) => `Semana del ${d.label}: ${d.text}`).join(". ");

  return (
    <Card delay={delay} className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <CardTitle>Evolución semanal</CardTitle>
          <p className="text-text-muted mt-0.5 text-[13px]">{current.caption}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div role="group" aria-label="Métrica" className="bg-fill flex rounded-full p-[3px]">
            {METRICS.map((m) => (
              <button
                key={m.key}
                type="button"
                aria-pressed={metric === m.key}
                onClick={() => setMetric(m.key)}
                className={cn(
                  "cursor-pointer rounded-full px-3 py-1.5 text-[13px] font-bold whitespace-nowrap transition-all duration-200",
                  metric === m.key
                    ? "bg-surface text-text shadow-sm"
                    : "text-text-muted hover:text-text",
                )}
              >
                {m.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setAsTable((v) => !v)}
            className={cn(pillButton, "px-3 py-1.5")}
          >
            {asTable ? "Ver gráfico" : "Ver tabla"}
          </button>
        </div>
      </div>

      {asTable ? (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="text-text-muted text-xs font-extrabold tracking-wider">
                <th scope="col" className="border-border border-b py-2 text-left">
                  SEMANA
                </th>
                <th scope="col" className="border-border border-b py-2 text-right">
                  EJERCICIOS
                </th>
                <th scope="col" className="border-border border-b py-2 text-right">
                  CORRECTAS
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((d) => (
                <tr key={d.label}>
                  <td className="border-fill border-b py-2">Semana del {d.label}</td>
                  <td className="border-fill border-b py-2 text-right font-bold">{d.attempts}</td>
                  <td className="border-fill border-b py-2 text-right font-bold">{d.correct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div role="img" aria-label={summary} className="h-[210px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 4, left: 4, bottom: 0 }}>
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--color-text-muted)", fontSize: 12 }}
              />
              <Bar
                dataKey="value"
                radius={[10, 10, 4, 4]}
                maxBarSize={44}
                isAnimationActive
                animationDuration={700}
                animationEasing="ease-out"
              >
                {data.map((d, i) => (
                  <Cell
                    key={d.label}
                    fill={
                      i === data.length - 1
                        ? "var(--color-primary)"
                        : "var(--color-primary-medallion)"
                    }
                  />
                ))}
                <LabelList
                  dataKey="text"
                  position="top"
                  fill="var(--color-text)"
                  fontSize={12}
                  fontWeight={800}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}
