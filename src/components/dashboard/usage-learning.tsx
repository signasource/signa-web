"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/components/dashboard/icons";
import { InfoPopover } from "@/components/dashboard/info-popover";
import { KpiCard } from "@/components/dashboard/kpi-card";
import {
  Card,
  CardTitle,
  ErrorState,
  headerChip,
  LoadingState,
  ProgressBar,
} from "@/components/dashboard/ui";
import { NUMBER } from "@/components/dashboard/usage-business";
import { pct0, pct1, rateOrNull } from "@/components/dashboard/usage-math";
import {
  useBusinessQuery,
  useGamificationQuery,
  useLearningQuery,
} from "@/components/dashboard/usage-queries";
import type { LearningMetrics, SignDifficulty } from "@/lib/api/metrics";
import type { DateTimeRange } from "@/lib/datetime-range";
import { cn } from "@/lib/utils";

/** Spanish names for the exercise (block) types. */
export const BLOCK_TYPE_LABEL: Record<string, string> = {
  SELECT_MEANING: "Elegir el significado",
  SELECT_SIGN: "Elegir la seña",
  PERFORM_SIGN: "Hacer la seña (cámara)",
  SPELL_NAME: "Deletrear nombre (cámara)",
  VISUAL_RECOGNITION: "Reconocer señas (cámara)",
  MATCH: "Unir pares",
  CONTEXT_RESPONSE: "Responder en contexto",
  INVISIBLE_SIGNS: "Señas invisibles",
  INTRODUCE_SIGN: "Presentar seña",
  INFO: "Información",
};

/** Accuracy tint: < 60 % danger, < 75 % warning. */
function accuracyClass(p: number): string {
  if (p < 60) return "text-danger font-extrabold";
  if (p < 75) return "text-shop-amber-dark font-extrabold";
  return "font-bold";
}

/** Stable key that uniquely identifies a course+version combination. */
function courseKey(courseId: string, courseVersion: string) {
  return `${courseId}:${courseVersion}`;
}

/** Course picker: a single select like the organizations panel's (all courses or one). */
function CoursePicker({
  courses,
  value,
  onChange,
}: {
  courses: {
    courseId: string;
    courseName: string;
    courseVersion: string;
    enrolled: number;
    completed: number;
  }[];
  /** Composite "courseId:version" key, or null for "all courses". */
  value: string | null;
  onChange: (key: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (
        e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)
      )
        setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  const current = courses.find((c) => courseKey(c.courseId, c.courseVersion) === value);
  const withUsers = courses.filter((c) => c.enrolled > 0 || c.completed > 0);
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div ref={ref} className="relative">
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={menuId}
          onClick={() => setOpen((o) => !o)}
          className={cn(
            headerChip,
            "border-border bg-surface text-text cursor-pointer border transition-shadow hover:shadow-sm",
          )}
        >
          <Icon name="book" className="size-4" />
          <span className="max-w-[280px] truncate">
            {current && current.courseVersion
              ? `${current.courseName} · v${current.courseVersion}`
              : (current?.courseName ?? "Todos los cursos")}
          </span>
          <Icon
            name="chevronDown"
            className={cn("size-3.5 transition-transform", open && "rotate-180")}
          />
        </button>
        {open ? (
          <ul
            id={menuId}
            role="listbox"
            aria-label="Curso"
            className="border-border bg-surface dash-card-enter absolute left-0 z-30 mt-2 flex w-72 flex-col gap-0.5 rounded-2xl border p-1.5 shadow-lg"
          >
            <li role="option" aria-selected={value === null}>
              <button
                type="button"
                onClick={() => {
                  onChange(null);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-bold transition-colors",
                  value === null ? "bg-primary-light text-primary-dark" : "hover:bg-fill text-text",
                )}
              >
                <span className="truncate">Todos los cursos</span>
                {value === null ? <Icon name="check" className="size-4" /> : null}
              </button>
            </li>
            {withUsers.map((o) => {
              const key = courseKey(o.courseId, o.courseVersion);
              const selected = value === key;
              const label = o.courseVersion
                ? `${o.courseName} · v${o.courseVersion}`
                : o.courseName;
              return (
                <li key={key} role="option" aria-selected={selected}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(key);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-bold transition-colors",
                      selected ? "bg-primary-light text-primary-dark" : "hover:bg-fill text-text",
                    )}
                  >
                    <span className="truncate">{label}</span>
                    {selected ? <Icon name="check" className="size-4" /> : null}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
      <span className="text-text-muted text-[13px]">
        {NUMBER.format(withUsers.length)}{" "}
        {withUsers.length === 1 ? "curso con usuarios" : "cursos con usuarios"}
      </span>
    </div>
  );
}

type SignSortKey = "sign" | "precision" | "evaluated" | "reports";
type SortDir = "asc" | "desc";

/** Sortable column header button for tables. */
function SortTh({
  label,
  col,
  currentCol,
  currentDir,
  align = "left",
  onSort,
}: {
  label: string;
  col: SignSortKey;
  currentCol: SignSortKey;
  currentDir: SortDir;
  align?: "left" | "right";
  onSort: (col: SignSortKey) => void;
}) {
  const active = currentCol === col;
  return (
    <th className={cn("pb-2 font-bold", align === "right" && "pl-3 text-right")}>
      <button
        type="button"
        onClick={() => onSort(col)}
        className={cn(
          "inline-flex cursor-pointer items-center gap-1 transition-colors hover:text-text",
          active ? "text-text" : "text-text-muted",
          align === "right" && "flex-row-reverse",
        )}
      >
        <span>{label}</span>
        <Icon
          name={active ? (currentDir === "asc" ? "arrowUp" : "arrowDown") : "sortable"}
          className="size-3.5 shrink-0"
        />
      </button>
    </th>
  );
}

const SIGN_PREVIEW_ROWS = 6;

function signSort(
  signs: SignDifficulty[],
  col: SignSortKey,
  dir: SortDir,
  reportsBySign: Map<string, number>,
) {
  return [...signs].sort((a, b) => {
    const mult = dir === "asc" ? 1 : -1;
    if (col === "sign") return mult * a.sign.localeCompare(b.sign, "es");
    if (col === "precision") return mult * ((100 - a.errorPercent) - (100 - b.errorPercent));
    if (col === "evaluated") return mult * (a.evaluated - b.evaluated);
    return mult * ((reportsBySign.get(a.sign) ?? 0) - (reportsBySign.get(b.sign) ?? 0));
  });
}

const MODAL_PAGE_SIZE = 20;

/** Full-screen sortable modal for the sign analysis table. */
function SignAnalysisModal({
  signs,
  reportsBySign,
  onClose,
}: {
  signs: SignDifficulty[];
  reportsBySign: Map<string, number>;
  onClose: () => void;
}) {
  const [sortCol, setSortCol] = useState<SignSortKey>("precision");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(0);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  function handleSort(col: SignSortKey) {
    if (col === sortCol) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortCol(col); setSortDir("asc"); }
    setPage(0);
  }

  const sorted = signSort(signs, sortCol, sortDir, reportsBySign);
  const totalPages = Math.ceil(sorted.length / MODAL_PAGE_SIZE);
  const paginated = totalPages > 1 ? sorted.slice(page * MODAL_PAGE_SIZE, (page + 1) * MODAL_PAGE_SIZE) : sorted;

  return createPortal(
    <div
      className="bg-ink-900/50 fixed inset-0 z-60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Análisis de contenido"
        className="bg-surface flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl shadow-[0_24px_60px_rgba(30,23,20,.25)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-border flex items-center justify-between border-b p-4">
          <div>
            <h2 className="font-display text-lg font-extrabold tracking-tight">Análisis de contenido</h2>
            <p className="text-text-muted text-xs">{NUMBER.format(signs.length)} señas</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="text-text-muted hover:bg-fill hover:text-text -mr-1 grid size-9 shrink-0 cursor-pointer place-items-center rounded-full"
          >
            <Icon name="close" className="size-5" />
          </button>
        </div>
        <div className="overflow-y-auto p-4">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="text-text-muted text-left text-xs font-bold">
                <SortTh label="Seña" col="sign" currentCol={sortCol} currentDir={sortDir} onSort={handleSort} />
                <SortTh label="Intentos" col="evaluated" currentCol={sortCol} currentDir={sortDir} align="right" onSort={handleSort} />
                <SortTh label="Precisión" col="precision" currentCol={sortCol} currentDir={sortDir} align="right" onSort={handleSort} />
                <SortTh label="Reportes" col="reports" currentCol={sortCol} currentDir={sortDir} align="right" onSort={handleSort} />
              </tr>
            </thead>
            <tbody>
              {paginated.map((s) => {
                const reports = reportsBySign.get(s.sign) ?? 0;
                return (
                  <tr key={s.sign} className="border-fill border-t">
                    <td className="py-2.5 font-extrabold">
                      {s.signId ? (
                        <Link
                          href={`/admin/signs?id=${s.signId}`}
                          className="text-primary hover:underline"
                        >
                          {s.sign}
                        </Link>
                      ) : (
                        s.sign
                      )}
                    </td>
                    <td className="py-2.5 pl-3 text-right font-bold">
                      {NUMBER.format(s.evaluated)}
                    </td>
                    <td className={cn("py-2.5 pl-3 text-right", accuracyClass(100 - s.errorPercent))}>
                      {pct0(100 - s.errorPercent)}
                    </td>
                    <td className={cn("py-2.5 pl-3 text-right", reports >= 3 ? "text-danger font-extrabold" : "font-bold")}>
                      {NUMBER.format(reports)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {totalPages > 1 ? (
          <div className="border-border flex items-center justify-between border-t px-4 py-3">
            <span className="text-text-muted text-xs">
              Página {page + 1} de {totalPages}
            </span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 0}
                className="text-text-muted hover:bg-fill hover:text-text disabled:opacity-30 grid size-8 cursor-pointer place-items-center rounded-lg disabled:cursor-default"
                aria-label="Página anterior"
              >
                <Icon name="chevronBack" className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                disabled={page === totalPages - 1}
                className="text-text-muted hover:bg-fill hover:text-text disabled:opacity-30 grid size-8 cursor-pointer place-items-center rounded-lg disabled:cursor-default"
                aria-label="Página siguiente"
              >
                <Icon name="chevronForward" className="size-4" />
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}

/**
 * "Análisis de contenido": señas ranked by error rate with sortable columns — precision and
 * pending report count — so content editors can spot signs that need attention. Shows the first
 * 6 rows; "Ver todas las señas" opens a sortable modal with the full list.
 */
function SignAnalysis({
  signs,
  reportsBySign,
}: {
  signs: SignDifficulty[];
  reportsBySign: Map<string, number>;
}) {
  const [sortCol, setSortCol] = useState<SignSortKey>("precision");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [modalOpen, setModalOpen] = useState(false);

  function handleSort(col: SignSortKey) {
    if (col === sortCol) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(col);
      setSortDir("asc");
    }
  }

  const sorted = signSort(signs, sortCol, sortDir, reportsBySign);
  const preview = sorted.slice(0, SIGN_PREVIEW_ROWS);

  return (
    <Card className="flex min-w-0 flex-col gap-3">
      <CardTitle>Análisis de contenido</CardTitle>
      {signs.length === 0 ? (
        <p className="text-text-muted text-sm">
          Sin señas con muestra suficiente en el período.
        </p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[320px] border-collapse text-sm">
              <thead>
                <tr className="text-text-muted text-left text-xs font-bold">
                  <SortTh
                    label="Seña"
                    col="sign"
                    currentCol={sortCol}
                    currentDir={sortDir}
                    onSort={handleSort}
                  />
                  <SortTh
                    label="Intentos"
                    col="evaluated"
                    currentCol={sortCol}
                    currentDir={sortDir}
                    align="right"
                    onSort={handleSort}
                  />
                  <SortTh
                    label="Precisión"
                    col="precision"
                    currentCol={sortCol}
                    currentDir={sortDir}
                    align="right"
                    onSort={handleSort}
                  />
                  <SortTh
                    label="Reportes"
                    col="reports"
                    currentCol={sortCol}
                    currentDir={sortDir}
                    align="right"
                    onSort={handleSort}
                  />
                </tr>
              </thead>
              <tbody>
                {preview.map((s) => {
                  const reports = reportsBySign.get(s.sign) ?? 0;
                  return (
                    <tr key={s.sign} className="border-fill border-t">
                      <td className="py-2.5 font-extrabold">
                        {s.signId ? (
                          <Link
                            href={`/admin/signs?id=${s.signId}`}
                            className="text-primary hover:underline"
                          >
                            {s.sign}
                          </Link>
                        ) : (
                          s.sign
                        )}
                      </td>
                      <td className="py-2.5 pl-3 text-right font-bold">
                        {NUMBER.format(s.evaluated)}
                      </td>
                      <td
                        className={cn(
                          "py-2.5 pl-3 text-right",
                          accuracyClass(100 - s.errorPercent),
                        )}
                      >
                        {pct0(100 - s.errorPercent)}
                      </td>
                      <td
                        className={cn(
                          "py-2.5 pl-3 text-right",
                          reports >= 3 ? "text-danger font-extrabold" : "font-bold",
                        )}
                      >
                        {NUMBER.format(reports)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {signs.length > SIGN_PREVIEW_ROWS ? (
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="text-primary hover:text-primary-dark cursor-pointer self-start pt-1 text-[13px] font-extrabold"
            >
              Ver todas las señas ({NUMBER.format(signs.length)}) →
            </button>
          ) : null}
        </>
      )}
      {modalOpen ? (
        <SignAnalysisModal signs={signs} reportsBySign={reportsBySign} onClose={() => setModalOpen(false)} />
      ) : null}
    </Card>
  );
}

/** All-achievements modal: scrollable list with individual unlock progress bars and sort toggle. */
function AchievementsModal({
  achievements,
  eligibleUsers,
  onClose,
}: {
  achievements: { name: string; count: number }[];
  eligibleUsers: number;
  onClose: () => void;
}) {
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const sorted = [...achievements].sort((a, b) =>
    sortDir === "asc" ? a.count - b.count : b.count - a.count,
  );

  return createPortal(
    <div
      className="bg-ink-900/50 fixed inset-0 z-60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Todos los logros"
        className="bg-surface flex max-h-[85vh] w-full max-w-lg flex-col rounded-2xl shadow-[0_24px_60px_rgba(30,23,20,.25)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-border flex items-center justify-between border-b p-4">
          <h2 className="font-display text-lg font-extrabold tracking-tight">Todos los logros</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
              className={cn(
                headerChip,
                "border-border bg-fill text-text cursor-pointer border transition-shadow hover:shadow-sm",
              )}
            >
              <Icon name={sortDir === "asc" ? "arrowUp" : "arrowDown"} className="size-3.5" />
              <span>{sortDir === "asc" ? "Menos desbloqueados" : "Más desbloqueados"}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="text-text-muted hover:bg-fill hover:text-text grid size-9 shrink-0 cursor-pointer place-items-center rounded-full"
            >
              <Icon name="close" className="size-5" />
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-4 overflow-y-auto p-4">
          {sorted.length === 0 ? (
            <p className="text-text-muted text-sm">Sin logros desbloqueados en el período.</p>
          ) : (
            sorted.map((a) => {
              const percent =
                eligibleUsers > 0 ? Math.min(100, (a.count / eligibleUsers) * 100) : 0;
              return (
                <div key={a.name} className="flex flex-col gap-1.5">
                  <div className="flex justify-between gap-2 text-[13px] font-extrabold">
                    <span>{a.name}</span>
                    <span className="shrink-0">{pct1(percent)}</span>
                  </div>
                  <ProgressBar
                    percent={percent}
                    tone="primary"
                    label={`${a.name}: ${pct1(percent)} de usuarios`}
                  />
                  <span className="text-text-muted text-xs">
                    {NUMBER.format(a.count)}{" "}
                    {a.count === 1 ? "usuario lo desbloqueó" : "usuarios lo desbloquearon"}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

/**
 * Achievements analytics table: sorted by least/most unlocked with toggle, and a modal that shows
 * every achievement's unlock rate as a progress bar — useful for detecting unreachable or trivial
 * achievements.
 */
function AchievementsTable({ range, live }: { range: DateTimeRange; live: boolean }) {
  const gamification = useGamificationQuery(range, live);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [modalOpen, setModalOpen] = useState(false);

  if (gamification.isPending)
    return (
      <Card className="flex min-w-0 flex-col gap-3">
        <LoadingState />
      </Card>
    );
  if (!gamification.data) return null;

  const g = gamification.data;
  const eligibleUsers = g.achievements.eligibleUsers;

  const allMap = new Map<string, number>();
  for (const a of g.achievements.topUnlocked) allMap.set(a.name, a.count);
  for (const a of g.achievements.leastUnlocked) allMap.set(a.name, a.count);
  const allAchievements = Array.from(allMap.entries()).map(([name, count]) => ({ name, count }));

  const sorted = [...allAchievements].sort((a, b) =>
    sortDir === "asc" ? a.count - b.count : b.count - a.count,
  );

  return (
    <Card className="flex min-w-0 flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2.5">
        <CardTitle>Sistema de logros</CardTitle>
        <span className="text-text-muted text-[11px] font-bold uppercase tracking-wide">
          Independiente del curso
        </span>
        <InfoPopover metric="achievements_least" className="ml-auto" />
      </div>
      {allAchievements.length === 0 ? (
        <p className="text-text-muted text-sm">Sin logros desbloqueados en el período.</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] border-collapse text-sm">
              <thead>
                <tr className="text-text-muted text-left text-xs font-bold">
                  <th className="pb-2 font-bold">Logro</th>
                  <th className="pb-2 pl-3 text-right font-bold">
                    <button
                      type="button"
                      onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
                      className="text-text-muted hover:text-text inline-flex flex-row-reverse cursor-pointer items-center gap-1 transition-colors"
                    >
                      <Icon
                        name={sortDir === "asc" ? "arrowUp" : "arrowDown"}
                        className="size-3.5 shrink-0"
                      />
                      <span>Desbloqueados</span>
                    </button>
                  </th>
                  <th className="pb-2 pl-3 text-right font-bold">%</th>
                </tr>
              </thead>
              <tbody>
                {sorted.slice(0, 6).map((a) => {
                  const percent =
                    eligibleUsers > 0 ? Math.min(100, (a.count / eligibleUsers) * 100) : 0;
                  return (
                    <tr key={a.name} className="border-fill border-t">
                      <td className="py-2.5 font-extrabold">{a.name}</td>
                      <td className="py-2.5 pl-3 text-right font-bold">
                        {NUMBER.format(a.count)}
                      </td>
                      <td
                        className={cn(
                          "py-2.5 pl-3 text-right",
                          percent < 5
                            ? "text-danger font-extrabold"
                            : percent > 80
                              ? "text-shop-amber-dark font-extrabold"
                              : "font-bold",
                        )}
                      >
                        {pct1(percent)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {allAchievements.length > 6 ? (
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="text-primary hover:text-primary-dark cursor-pointer self-start pt-1 text-[13px] font-extrabold"
            >
              Ver todos los logros ({NUMBER.format(allAchievements.length)}) →
            </button>
          ) : null}
        </>
      )}
      {modalOpen ? (
        <AchievementsModal
          achievements={allAchievements}
          eligibleUsers={eligibleUsers}
          onClose={() => setModalOpen(false)}
        />
      ) : null}
    </Card>
  );
}

/**
 * Aprendizaje — "¿La gente aprende LSA?". A course selector, the accuracy KPI with
 * period-over-period delta, the sign-analysis table (precision + pending reports, sortable) beside
 * accuracy by exercise type, and the achievements analytics table.
 */
export function LearningTab({ range, live }: { range: DateTimeRange; live: boolean }) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  // courseKey format is "courseId:version"; queries only need the courseId part
  const courseIds = selectedKey ? [selectedKey.split(":")[0]!] : [];
  const learning = useLearningQuery(range, live, courseIds);
  const business = useBusinessQuery(range, live, courseIds);

  if (learning.isPending) return <LoadingState>Cargando métricas de aprendizaje…</LoadingState>;
  if (!learning.data)
    return <ErrorState>No pudimos cargar las métricas de aprendizaje.</ErrorState>;

  const l = learning.data;
  const b = business.data;
  const prevSuccess = rateOrNull(l.exercises.previousCorrect, l.exercises.previousAttempted);
  const reportsBySign = new Map(
    (l.reports.mostReportedPending ?? []).map((r) => [r.meaning, r.count]),
  );

  return (
    <div className="flex flex-col gap-5">
      <CoursePicker courses={l.courses} value={selectedKey} onChange={setSelectedKey} />

      {/* Row 1: accuracy KPI beside precision-by-type bars. */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <KpiCard
          metric="exercise_success_rate"
          label="Tasa de precisión"
          className="justify-center"
          value={l.exercises.attempted ? pct1(l.exercises.successPercent) : "—"}
          toneValue={l.exercises.attempted ? l.exercises.successPercent : null}
          delta={
            l.exercises.attempted
              ? { current: l.exercises.successPercent, previous: prevSuccess, mode: "pp" }
              : undefined
          }
        />
        <Card className="flex min-w-0 flex-col gap-3">
          <div className="flex items-center gap-1.5">
            <CardTitle>Precisión por tipo de ejercicio</CardTitle>
            <InfoPopover metric="accuracy_by_type" className="ml-auto" />
          </div>
          {!b ? (
            <LoadingState />
          ) : b.accuracy.byBlockType.length === 0 ? (
            <p className="text-text-muted text-sm">Sin ejercicios evaluados.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {/* Every evaluated type, camera ones included: they are part of "Tasa de precisión",
                  and hiding them left that average below every bar shown. Non-evaluable blocks
                  (INTRODUCE_SIGN, INVISIBLE_SIGNS) never reach this list. */}
              {[...b.accuracy.byBlockType]
                .filter((bt) =>
                  ["CONTEXT_RESPONSE", "SELECT_SIGN", "SELECT_MEANING", "MATCH"].includes(bt.type),
                )
                .sort((x, y) => x.accuracyPercent - y.accuracyPercent)
                .map((bt) => (
                  <li key={bt.type} className="flex flex-col gap-1.5">
                    <div className="flex justify-between gap-2 text-[13px] font-extrabold">
                      <span className="truncate">{BLOCK_TYPE_LABEL[bt.type] ?? bt.type}</span>
                      <span>{pct0(bt.accuracyPercent)}</span>
                    </div>
                    <ProgressBar
                      percent={bt.accuracyPercent}
                      tone={bt.accuracyPercent >= 80 ? "success" : "primary"}
                      label={`Precisión de ${BLOCK_TYPE_LABEL[bt.type] ?? bt.type}`}
                    />
                  </li>
                ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Row 2: sign analysis and achievements analytics side by side, 6 rows each. */}
      <div className="grid gap-4 lg:grid-cols-2">
        <SignAnalysis signs={l.hardestSigns ?? []} reportsBySign={reportsBySign} />
        <AchievementsTable range={range} live={live} />
      </div>
    </div>
  );
}
