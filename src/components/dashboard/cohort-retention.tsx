"use client";

import { InfoPopover } from "@/components/dashboard/info-popover";
import { Card, CardTitle } from "@/components/dashboard/ui";
import type { CohortRetention } from "@/lib/api/metrics";
import { cn } from "@/lib/utils";

const WEEK = new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "short" });

/** Greener as retention climbs; a muted fill when the horizon isn't observable yet ("—"). */
function cellTone(percent: number | null): string {
  if (percent == null) return "bg-fill text-text-muted";
  if (percent >= 50) return "bg-success-light text-success-dark";
  if (percent >= 25) return "bg-avatar-green-light text-success-dark";
  return "bg-shop-amber-light text-shop-amber-dark";
}

function Cell({ count, percent }: { count: number | null; percent: number | null }) {
  const observable = percent != null;
  return (
    <td className="py-1.5 pl-3">
      <div
        className={cn(
          "relative flex h-7 items-center justify-center overflow-hidden rounded-md text-[13px] font-extrabold",
          cellTone(percent),
        )}
      >
        {observable ? (
          <div
            className="bg-success/25 absolute inset-y-0 left-0"
            style={{ width: `${Math.max(0, Math.min(100, percent))}%` }}
            aria-hidden="true"
          />
        ) : null}
        <span className="relative">
          {observable ? `${percent}%` : "—"}
          {observable && count != null ? (
            <span className="text-text-muted ml-1 font-semibold">({count})</span>
          ) : null}
        </span>
      </div>
    </td>
  );
}

/**
 * Weekly retention cohorts: one row per signup week, columns for the D1/D7/D30 horizons. Dashes mark
 * weeks not yet observable at that horizon, so an early week never reads as a misleading 0%.
 */
export function CohortRetentionTable({ cohorts }: { cohorts: CohortRetention[] }) {
  return (
    <Card>
      <div className="flex items-center gap-1.5">
        <CardTitle>Retención de usuarios por cohorte</CardTitle>
        <InfoPopover metric="cohort_retention" className="ml-auto" />
      </div>
      <p className="text-text-muted mt-1 text-[13px]">
        Usuarios que vuelven a estar activos 1, 7 y 30 días después de registrarse.
      </p>
      {cohorts.length === 0 ? (
        <p className="text-text-muted mt-4 text-sm">
          No hay cohortes con usuarios registrados en este período.
        </p>
      ) : (
        <table className="mt-3 w-full border-collapse">
          <thead>
            <tr className="text-text-muted text-left text-xs font-bold">
              <th className="pb-2 font-bold">Cohorte (semana)</th>
              <th className="pb-2 pl-3 font-bold">Usuarios</th>
              <th className="pb-2 pl-3 text-center font-bold">Día 1</th>
              <th className="pb-2 pl-3 text-center font-bold">Día 7</th>
              <th className="pb-2 pl-3 text-center font-bold">Día 30</th>
            </tr>
          </thead>
          <tbody>
            {cohorts.map((c) => (
              <tr key={c.weekStart} className="border-fill border-t">
                <td className="py-1.5 text-sm font-bold">{WEEK.format(new Date(c.weekStart))}</td>
                <td className="text-text-muted py-1.5 pl-3 text-sm">{c.cohortSize}</td>
                <Cell count={c.d1} percent={c.d1Percent} />
                <Cell count={c.d7} percent={c.d7Percent} />
                <Cell count={c.d30} percent={c.d30Percent} />
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="text-text-muted mt-3 text-[13px]">Los guiones indican períodos todavía no observables.</p>
    </Card>
  );
}
