"use client";

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  type YAxisTickContentProps,
} from "recharts";
import { InfoPopover } from "@/components/dashboard/info-popover";
import type { MetricId } from "@/components/dashboard/metric-catalog";
import { Card, CardTitle } from "@/components/dashboard/ui";

const NUMBER = new Intl.NumberFormat("es-AR");

/** Width (px) of the count column at the end of each row chart. */
const COUNT_COLUMN = 36;

/**
 * One answer of a survey question. `tick` is a shorter label for the column axis (narrow screens);
 * `muted` greys out the "Sin respuesta" bar.
 */
export type SurveyBar = { label: string; value: number; tick?: string; muted?: boolean };

type Datum = SurveyBar & { share: number };

/** Width (px) of a row chart's label column for these labels (13 px text ≈ 6.9 px a character). */
export function surveyLabelWidth(labels: string[]): number {
  return Math.ceil(Math.max(...labels.map((l) => l.length), 4) * 6.9) + 12;
}

/**
 * The answers to one onboarding-survey question as bars: `columns` (vertical bars, for an ordered
 * scale like age ranges; no y axis, each bar carries its count) or `rows` (horizontal bars, labels
 * flush with the card's left edge, the longest bar reaching the right one). No tooltip or hover:
 * every bar already shows its count. Under the chart, how many people answered this question
 * (`base` minus the `muted` "Sin respuesta" item, which is not drawn). A visually hidden table
 * (every answer, "Sin respuesta" included) is the text alternative.
 */
export function SurveyBarChart({
  title,
  subtitle,
  metric,
  items,
  base,
  orientation,
  labelWidth: sharedLabelWidth,
  className,
}: {
  title: string;
  subtitle?: string;
  metric: MetricId;
  items: SurveyBar[];
  /** Denominator of each share (the window's signups). */
  base: number;
  orientation: "columns" | "rows";
  /** Rows only: width (px) of the label column, so charts side by side line their bars up. */
  labelWidth?: number;
  className?: string;
}) {
  const data: Datum[] = items.map((i) => ({
    ...i,
    tick: i.tick ?? i.label,
    share: base > 0 ? Math.round((i.value / base) * 100) : 0,
  }));
  // "Sin respuesta" is not drawn: it would dwarf the real answers.
  const answers = data.filter((d) => !d.muted);
  // People who answered this question (multiple choice counts each person once).
  const responses = Math.max(
    0,
    base - data.filter((d) => d.muted).reduce((n, d) => n + d.value, 0),
  );
  const answered = answers.some((d) => d.value > 0);
  const rows = orientation === "rows";
  // Rows: labels sit flush with the card's left edge, so the label column is as wide as the
  // longest label (13 px text ≈ 6.9 px per character) and the bars take the rest.
  const labelWidth = sharedLabelWidth ?? surveyLabelWidth(answers.map((d) => d.label));
  // A fixed height per row, so every row chart has the same bar thickness and spacing.
  const height = rows ? answers.length * 38 : 200;

  return (
    <Card className={className ?? "flex min-w-0 flex-col gap-3"}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <CardTitle>{title}</CardTitle>
          {subtitle ? <p className="text-text-muted mt-0.5 text-[13px]">{subtitle}</p> : null}
        </div>
        <InfoPopover metric={metric} />
      </div>
      {base === 0 ? (
        <p className="text-text-muted py-8 text-center text-sm">Sin registros en este período.</p>
      ) : (
        <>
          {answered ? (
            <div aria-hidden="true" style={{ height }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={answers}
                  layout={rows ? "vertical" : "horizontal"}
                  margin={
                    rows
                      ? { top: 0, right: 0, left: 0, bottom: 0 }
                      : { top: 22, right: 0, left: 0, bottom: 0 }
                  }
                  barCategoryGap={rows ? "28%" : "22%"}
                >
                  {rows ? (
                    <>
                      <XAxis type="number" hide domain={[0, "dataMax"]} />
                      <YAxis
                        type="category"
                        dataKey="label"
                        axisLine={{ stroke: "var(--color-border)" }}
                        tickLine={false}
                        width={labelWidth}
                        tick={(props: YAxisTickContentProps) => (
                          <text
                            x={0}
                            y={props.y}
                            dy={4}
                            textAnchor="start"
                            fill="var(--color-text)"
                            fontSize={13}
                          >
                            {String(props.payload.value)}
                          </text>
                        )}
                      />
                      {/* The counts in their own column after the track, aligned in every row. */}
                      <YAxis
                        yAxisId="count"
                        orientation="right"
                        type="category"
                        dataKey="label"
                        axisLine={false}
                        tickLine={false}
                        width={COUNT_COLUMN}
                        tick={(props: YAxisTickContentProps) => (
                          <text
                            x={props.x}
                            y={props.y}
                            dy={4}
                            textAnchor="end"
                            dx={COUNT_COLUMN - 8}
                            fill="var(--color-text-muted)"
                            fontSize={12}
                          >
                            {NUMBER.format(
                              answers.find((d) => d.label === String(props.payload.value))?.value ??
                                0,
                            )}
                          </text>
                        )}
                      />
                    </>
                  ) : (
                    <>
                      <XAxis
                        dataKey="tick"
                        axisLine={{ stroke: "var(--color-border)" }}
                        tickLine={false}
                        interval={0}
                        tick={{ fill: "var(--color-text-muted)", fontSize: 12 }}
                      />
                      <YAxis hide domain={[0, "dataMax"]} />
                    </>
                  )}
                  <Bar
                    dataKey="value"
                    fill="var(--color-primary)"
                    // Rows run on a light full-width track, so a small count reads as a nearly
                    // empty bar of the same scale rather than a stray dot.
                    background={rows ? { fill: "var(--color-fill)", radius: 6 } : false}
                    radius={rows ? 6 : [6, 6, 0, 0]}
                    maxBarSize={rows ? 22 : 40}
                    label={
                      rows
                        ? false
                        : {
                            position: "top",
                            fill: "var(--color-text-muted)",
                            fontSize: 12,
                            formatter: (v: unknown) => NUMBER.format(Number(v)),
                          }
                    }
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-text-muted py-8 text-center text-sm">
              Nadie respondió esta pregunta en este período.
            </p>
          )}
          <p className="text-text-muted mt-auto text-[13px]">
            {NUMBER.format(responses)} {responses === 1 ? "respuesta" : "respuestas"}
          </p>
          {/* sr-only on a wrapper: some browsers paint a <caption> outside the table box, so
              hiding the table itself leaks the caption on screen. */}
          <div className="sr-only">
            <table>
              <caption>{title}</caption>
              <thead>
                <tr>
                  <th scope="col">Respuesta</th>
                  <th scope="col">Cuentas</th>
                  <th scope="col">Porcentaje</th>
                </tr>
              </thead>
              <tbody>
                {data.map((d) => (
                  <tr key={d.label}>
                    <th scope="row">{d.label}</th>
                    <td>{NUMBER.format(d.value)}</td>
                    <td>{d.share}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Card>
  );
}
