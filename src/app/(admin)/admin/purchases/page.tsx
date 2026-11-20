"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Fragment, useState } from "react";
import {
  adminApi,
  type AdminPurchaseListItem,
  type AdminRefundRequest,
  type PurchaseType,
  type RefundRequestStatus,
  type UnifiedPurchaseStatus,
} from "@/lib/api/admin";

// ── Constants ────────────────────────────────────────────────────────────────

const TYPE_META: Record<PurchaseType, { label: string; bg: string; fg: string }> = {
  SEATS: { label: "Cupos", bg: "var(--color-primary-light)", fg: "var(--color-primary-dark)" },
  GEMS: { label: "Gemas", bg: "var(--color-avatar-blue-light)", fg: "var(--color-gems-blue-dark)" },
  COURSE: {
    label: "Curso",
    bg: "var(--color-course-teal-light)",
    fg: "var(--color-avatar-teal-dark)",
  },
};

const STATUS_META: Record<UnifiedPurchaseStatus, { label: string; bg: string; fg: string }> = {
  PENDING_PAYMENT: {
    label: "Pendiente de pago",
    bg: "var(--color-shop-amber-light)",
    fg: "var(--color-shop-amber-dark)",
  },
  PAID: { label: "Pagada", bg: "var(--color-success-light)", fg: "var(--color-success-dark)" },
  CANCELLED: { label: "Cancelada", bg: "var(--color-fill)", fg: "var(--color-text-muted)" },
  REFUNDED: { label: "Reembolsada", bg: "var(--color-danger-light)", fg: "var(--color-danger)" },
};

const REFUND_STATUS_META: Record<RefundRequestStatus, { label: string; bg: string; fg: string }> = {
  PENDING: {
    label: "Pendiente",
    bg: "color-mix(in srgb, var(--color-warning) 12%, transparent)",
    fg: "var(--color-warning-dark)",
  },
  RESOLVED: {
    label: "Resuelto",
    bg: "color-mix(in srgb, var(--color-success) 12%, transparent)",
    fg: "var(--color-success-dark)",
  },
};

const REFUND_REASON_LABEL: Record<string, string> = {
  NOT_RECEIVED: "No recibí lo que compré",
  MISTAKE: "Compré por error",
  DUPLICATE: "Me cobraron dos veces",
  TECHNICAL: "Problema técnico",
  NOT_AS_EXPECTED: "No era lo que esperaba",
  OTHER: "Otro",
  PURCHASE_CANCELLED: "Pago de una compra cancelada",
  ALREADY_PAID: "Pago duplicado",
  AMOUNT_MISMATCH: "Monto distinto al de la compra",
  BUYER_REQUESTED: "Arrepentimiento de la organización",
  EXTERNAL_REFUND: "Reembolsado desde Mercado Pago",
  CHARGEBACK: "Contracargo",
};

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  MERCADO_PAGO: "Mercado Pago",
};

const STATUS_OPTIONS: { v: UnifiedPurchaseStatus | "ALL"; l: string }[] = [
  { v: "ALL", l: "Todos" },
  { v: "PENDING_PAYMENT", l: "Pendiente de pago" },
  { v: "PAID", l: "Pagada" },
  { v: "CANCELLED", l: "Cancelada" },
  { v: "REFUNDED", l: "Reembolsada" },
];

const PERIOD_OPTIONS = [
  { v: "all", l: "Cualquiera" },
  { v: "today", l: "Hoy" },
  { v: "7", l: "Últimos 7 días" },
  { v: "30", l: "Últimos 30 días" },
  { v: "custom", l: "Personalizado" },
];

const SORT_OPTIONS = [
  { v: "date_desc", l: "Más recientes" },
  { v: "date_asc", l: "Más antiguas" },
  { v: "amount_desc", l: "Mayor importe" },
  { v: "amount_asc", l: "Menor importe" },
];

const RSORT_OPTIONS = [
  { v: "date_asc", l: "Más antiguos" },
  { v: "date_desc", l: "Más recientes" },
  { v: "amount_desc", l: "Mayor importe" },
];

const TYPE_OPTIONS: { v: PurchaseType | "ALL"; l: string }[] = [
  { v: "ALL", l: "Todos" },
  { v: "SEATS", l: "Cupos" },
  { v: "GEMS", l: "Gemas" },
  { v: "COURSE", l: "Cursos" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const fdate = (iso: string | null | undefined) => {
  if (!iso) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
};

const money = (n: number, currency = "ARS") =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(n);

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

const today = new Date().toISOString().slice(0, 10);

const shiftDate = (iso: string, days: number) => {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
};

const inRange = (dateStr: string | null | undefined, from: string, to: string) => {
  if (!dateStr) return true;
  const d = dateStr.slice(0, 10);
  return (!from || d >= from) && (!to || d <= to);
};

const labelOf = (opts: { v: string; l: string }[], v: string) =>
  (opts.find((o) => o.v === v) ?? opts[0]!).l;

const rangeOf = (period: string, from: string, to: string): [string, string] => {
  if (period === "today") return [today, today];
  if (period === "7") return [shiftDate(today, 7), today];
  if (period === "30") return [shiftDate(today, 30), today];
  if (period === "custom") return [from, to];
  return ["", ""];
};

const daysBetween = (a: string, b: string) =>
  Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);

// ── Pill select ────────────────────────────────────────────────────────────────

function PillSelect({
  label,
  value,
  options,
  active,
  onChange,
  ariaLabel,
}: {
  label: string;
  value: string;
  options: { v: string; l: string }[];
  active: boolean;
  onChange: (v: string) => void;
  ariaLabel: string;
}) {
  return (
    <label
      className="relative inline-flex h-[38px] cursor-pointer items-center gap-1.5 rounded-full border px-3 pl-3.5 text-[13px] font-semibold whitespace-nowrap"
      style={{
        borderColor: active ? "var(--color-primary-medallion)" : "var(--color-border)",
        background: active ? "var(--color-primary-light)" : "var(--color-surface)",
        color: active ? "var(--color-primary-dark)" : "var(--color-text)",
      }}
    >
      <span
        style={{
          color: active ? "var(--color-primary)" : "var(--color-text-muted)",
          fontWeight: 500,
        }}
      >
        {label}
      </span>
      <span>{value}</span>
      <svg
        width="14"
        height="14"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 9l7 7 7-7" />
      </svg>
      <select
        value={options.find((o) => o.l === value)?.v ?? ""}
        onChange={(e) => onChange(e.target.value)}
        aria-label={ariaLabel}
        className="absolute inset-0 cursor-pointer opacity-0"
        style={{ fontSize: 14 }}
      >
        {options.map((o) => (
          <option key={o.v} value={o.v}>
            {o.l}
          </option>
        ))}
      </select>
    </label>
  );
}

// ── Badge ──────────────────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: PurchaseType }) {
  const m = TYPE_META[type] ?? {
    label: type,
    bg: "var(--color-fill)",
    fg: "var(--color-text-muted)",
  };
  return (
    <span
      className="inline-block rounded-full px-2.5 py-0.5 text-[11px] font-extrabold whitespace-nowrap"
      style={{ background: m.bg, color: m.fg }}
    >
      {m.label}
    </span>
  );
}

function StatusBadge({ status }: { status: UnifiedPurchaseStatus }) {
  const m = STATUS_META[status] ?? {
    label: status,
    bg: "var(--color-fill)",
    fg: "var(--color-text-muted)",
  };
  return (
    <span
      className="inline-block rounded-full px-2.5 py-1 text-xs font-extrabold whitespace-nowrap"
      style={{ background: m.bg, color: m.fg }}
    >
      {m.label}
    </span>
  );
}

function RefundStatusBadge({ status }: { status: RefundRequestStatus }) {
  const m = REFUND_STATUS_META[status];
  return (
    <span
      className="inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={{ background: m.bg, color: m.fg }}
    >
      {m.label}
    </span>
  );
}

// ── Segmented control ─────────────────────────────────────────────────────────

function Segment({
  segments,
  value,
  onChange,
}: {
  segments: { key: string; label: string; count: number }[];
  value: string;
  onChange: (k: string) => void;
}) {
  return (
    <div className="flex gap-0.5 rounded-full p-0.5" style={{ background: "var(--color-fill)" }}>
      {segments.map((s) => {
        const active = value === s.key;
        return (
          <button
            key={s.key}
            onClick={() => onChange(s.key)}
            className="flex h-8 items-center gap-1.5 rounded-full border-none px-3.5 text-[13px] font-bold transition-all"
            style={{
              background: active ? "var(--color-surface)" : "transparent",
              color: active ? "var(--color-text)" : "var(--color-text-muted)",
              boxShadow: active
                ? "0 1px 2px rgba(36,26,22,0.08), 0 1px 1px rgba(36,26,22,0.04)"
                : "none",
            }}
          >
            {s.label}
            <span
              className="text-[11px] font-bold tabular-nums"
              style={{ color: "var(--color-text-muted)" }}
            >
              {s.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ── Chip filters ──────────────────────────────────────────────────────────────

function ActiveChips({
  chips,
  onClearAll,
}: {
  chips: { label: string; onRemove: () => void }[];
  onClearAll: () => void;
}) {
  if (chips.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {chips.map((c, i) => (
        <button
          key={i}
          onClick={c.onRemove}
          className="inline-flex h-7 items-center gap-1.5 rounded-full border-none px-3 pl-3 text-xs font-bold"
          style={{ background: "var(--color-primary-light)", color: "var(--color-primary-dark)" }}
        >
          {c.label}
          <span className="flex size-4 items-center justify-center rounded-full text-[11px]">
            ✕
          </span>
        </button>
      ))}
      <button
        onClick={onClearAll}
        className="h-7 border-none bg-transparent px-2 text-xs font-semibold"
        style={{ color: "var(--color-text-muted)" }}
      >
        Limpiar todo
      </button>
    </div>
  );
}

// ── Purchase list view ────────────────────────────────────────────────────────

function PurchaseList({
  purchases,
  onSelect,
}: {
  purchases: AdminPurchaseListItem[];
  onSelect: (id: string, type: PurchaseType) => void;
}) {
  const [q, setQ] = useState("");
  const [type, setType] = useState<PurchaseType | "ALL">("ALL");
  const [status, setStatus] = useState<UnifiedPurchaseStatus | "ALL">("ALL");
  const [period, setPeriod] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sort, setSort] = useState("date_desc");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 10;

  const [from_, to_] = rangeOf(period, from, to);

  const matchesSearch = (p: AdminPurchaseListItem) => {
    if (!q) return true;
    const hay = norm(
      [p.buyerName, p.buyerSub, p.buyerEmail, p.productName, p.mpOrderId ?? "", p.id].join(" "),
    );
    return hay.includes(norm(q));
  };

  const filteredBeforeType = purchases.filter(
    (p) =>
      (status === "ALL" || p.status === status) &&
      matchesSearch(p) &&
      inRange(p.createdAt, from_, to_),
  );

  let filtered = filteredBeforeType.filter((p) => type === "ALL" || p.type === type);

  const [sk, sd] = sort.split("_") as [string, string];
  filtered = [...filtered].sort((a, b) => {
    const va = sk === "date" ? a.createdAt : a.amount;
    const vb = sk === "date" ? b.createdAt : b.amount;
    const c = va < vb ? -1 : va > vb ? 1 : 0;
    return sd === "asc" ? c : -c;
  });

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pg = Math.min(page, pages - 1);
  const slice = filtered.slice(pg * PAGE_SIZE, pg * PAGE_SIZE + PAGE_SIZE);

  const typeSeg = (["ALL", "SEATS", "GEMS", "COURSE"] as const).map((k) => ({
    key: k,
    label: k === "ALL" ? "Todas" : TYPE_META[k].label,
    count:
      k === "ALL"
        ? filteredBeforeType.length
        : filteredBeforeType.filter((p) => p.type === k).length,
  }));

  const chips: { label: string; onRemove: () => void }[] = [];
  if (q)
    chips.push({
      label: `"${q}"`,
      onRemove: () => {
        setQ("");
        setPage(0);
      },
    });
  if (status !== "ALL")
    chips.push({
      label: `Estado: ${STATUS_META[status].label}`,
      onRemove: () => {
        setStatus("ALL");
        setPage(0);
      },
    });
  if (period !== "all")
    chips.push({
      label:
        period === "custom"
          ? `Fecha: ${from ? fdate(from) : "…"} – ${to ? fdate(to) : "…"}`
          : `Fecha: ${labelOf(PERIOD_OPTIONS, period)}`,
      onRemove: () => {
        setPeriod("all");
        setFrom("");
        setTo("");
        setPage(0);
      },
    });

  const arrow = (key: string) => (sk === key ? (sd === "asc" ? " ↑" : " ↓") : "");

  const statusActive = status !== "ALL";
  const periodActive = period !== "all";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative max-w-[400px] min-w-[260px] flex-1">
          <svg
            width="16"
            height="16"
            fill="none"
            viewBox="0 0 24 24"
            stroke="var(--color-text-muted)"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2"
          >
            <circle cx="11" cy="11" r="6.5" />
            <path d="M16 16l4.5 4.5" />
          </svg>
          <input
            type="search"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(0);
            }}
            placeholder="Buscar comprador, email o referencia"
            className="h-[38px] w-full rounded-full border py-0 pr-3.5 pl-10 text-sm transition-shadow outline-none"
            style={{
              borderColor: "var(--color-border)",
              background: "var(--color-surface)",
              color: "var(--color-text)",
            }}
          />
        </div>
        <Segment
          segments={typeSeg}
          value={type}
          onChange={(k) => {
            setType(k as PurchaseType | "ALL");
            setPage(0);
          }}
        />
        <div className="ml-auto flex flex-wrap gap-2">
          <PillSelect
            label="Estado"
            value={labelOf(STATUS_OPTIONS, status)}
            options={STATUS_OPTIONS}
            active={statusActive}
            onChange={(v) => {
              setStatus(v as UnifiedPurchaseStatus | "ALL");
              setPage(0);
            }}
            ariaLabel="Estado"
          />
          <PillSelect
            label="Fecha"
            value={labelOf(PERIOD_OPTIONS, period)}
            options={PERIOD_OPTIONS}
            active={periodActive}
            onChange={(v) => {
              setPeriod(v);
              setPage(0);
            }}
            ariaLabel="Fecha"
          />
          <PillSelect
            label="Orden"
            value={labelOf(SORT_OPTIONS, sort)}
            options={SORT_OPTIONS}
            active={false}
            onChange={setSort}
            ariaLabel="Orden"
          />
        </div>
      </div>

      {period === "custom" && (
        <div
          className="flex flex-wrap items-center gap-2 text-[13px]"
          style={{ color: "var(--color-text-muted)" }}
        >
          <span className="font-semibold">Entre</span>
          <input
            type="date"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              setPage(0);
            }}
            className="h-[34px] rounded-full border px-3 text-[13px] outline-none"
            style={{
              borderColor: "var(--color-border)",
              background: "var(--color-surface)",
              color: "var(--color-text)",
            }}
          />
          <span>y</span>
          <input
            type="date"
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              setPage(0);
            }}
            className="h-[34px] rounded-full border px-3 text-[13px] outline-none"
            style={{
              borderColor: "var(--color-border)",
              background: "var(--color-surface)",
              color: "var(--color-text)",
            }}
          />
        </div>
      )}

      <ActiveChips
        chips={chips}
        onClearAll={() => {
          setQ("");
          setStatus("ALL");
          setPeriod("all");
          setFrom("");
          setTo("");
          setPage(0);
        }}
      />

      <div
        className="overflow-x-auto rounded-2xl border"
        style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
      >
        <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr
              style={{
                borderBottom: "1px solid var(--color-border)",
                background: "var(--color-fill)",
                color: "var(--color-text-muted)",
              }}
            >
              <th
                onClick={() => setSort(sort === "date_desc" ? "date_asc" : "date_desc")}
                className="cursor-pointer px-5 py-3 text-left text-sm font-semibold whitespace-nowrap"
              >
                Fecha{arrow("date")}
              </th>
              <th className="px-5 py-3 text-left font-semibold">Producto</th>
              <th className="px-5 py-3 text-left font-semibold">Comprador</th>
              <th
                onClick={() => setSort(sort === "amount_desc" ? "amount_asc" : "amount_desc")}
                className="cursor-pointer px-5 py-3 text-left font-semibold whitespace-nowrap"
              >
                Total{arrow("amount")}
              </th>
              <th className="px-5 py-3 text-left font-semibold">Estado</th>
              <th className="w-10 px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {slice.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-10 text-center text-sm"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  No hay compras con estos filtros.
                </td>
              </tr>
            )}
            {slice.map((p, i) => (
              <tr
                key={p.id ?? i}
                onClick={() => onSelect(p.id, p.type)}
                className="hover:bg-background cursor-pointer transition-colors"
                style={{ borderBottom: "1px solid var(--color-border)" }}
              >
                <td
                  className="px-5 py-4 text-sm whitespace-nowrap"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {fdate(p.createdAt)}
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2.5">
                    <TypeBadge type={p.type} />
                    <div className="min-w-0">
                      <p className="m-0 font-semibold" style={{ color: "var(--color-text)" }}>
                        {p.productName}
                      </p>
                      <p
                        className="m-0 mt-0.5 text-xs"
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        {p.productDetail}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <p className="m-0 font-semibold" style={{ color: "var(--color-text)" }}>
                    {p.buyerName}
                  </p>
                  <p className="m-0 mt-0.5 text-xs" style={{ color: "var(--color-text-muted)" }}>
                    {p.buyerSub}
                  </p>
                </td>
                <td
                  className="px-5 py-4 font-semibold whitespace-nowrap"
                  style={{ color: "var(--color-text)" }}
                >
                  {money(p.amount, p.currency)}
                </td>
                <td className="px-5 py-4">
                  <div className="flex flex-col items-start gap-1">
                    <StatusBadge status={p.status} />
                    {p.pendingRefundRequest && (
                      <span
                        className="text-[11px] font-bold"
                        style={{ color: "var(--color-shop-amber-dark)" }}
                      >
                        Pedido de reembolso
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-5 py-4" style={{ color: "var(--color-text-muted)" }}>
                  <svg
                    width="16"
                    height="16"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 5l7 7-7 7" />
                  </svg>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length > PAGE_SIZE && (
        <div
          className="flex items-center justify-between gap-3 text-[13px]"
          style={{ color: "var(--color-text-muted)" }}
        >
          <span>
            {filtered.length > 0
              ? `Mostrando ${pg * PAGE_SIZE + 1}–${pg * PAGE_SIZE + slice.length} de ${filtered.length}`
              : ""}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(Math.max(0, pg - 1))}
              disabled={pg === 0}
              className="rounded-xl border px-3 py-1.5 text-[13px] font-semibold disabled:opacity-40"
              style={{
                borderColor: "var(--color-border)",
                background: "var(--color-surface)",
                color: "var(--color-text)",
              }}
            >
              Anterior
            </button>
            <button
              onClick={() => setPage(Math.min(pages - 1, pg + 1))}
              disabled={pg >= pages - 1}
              className="rounded-xl border px-3 py-1.5 text-[13px] font-semibold disabled:opacity-40"
              style={{
                borderColor: "var(--color-border)",
                background: "var(--color-surface)",
                color: "var(--color-text)",
              }}
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Refund request list view ──────────────────────────────────────────────────

function RefundList({
  refunds,
  onSelect,
}: {
  refunds: AdminRefundRequest[];
  onSelect: (refund: AdminRefundRequest) => void;
}) {
  const [q, setQ] = useState("");
  const [rStatus, setRStatus] = useState<RefundRequestStatus | "ALL">("PENDING");
  const [rType, setRType] = useState<PurchaseType | "ALL">("ALL");
  const [rPeriod, setRPeriod] = useState("all");
  const [rFrom, setRFrom] = useState("");
  const [rTo, setRTo] = useState("");
  const [rSort, setRSort] = useState("date_asc");

  const [from_, to_] = rangeOf(rPeriod, rFrom, rTo);

  const matchesSearch = (r: AdminRefundRequest) => {
    if (!q) return true;
    const hay = norm(
      [r.requesterName, r.requesterUsername, r.requesterEmail, r.productName, r.message].join(" "),
    );
    return hay.includes(norm(q));
  };

  let filtered = refunds.filter(
    (r) =>
      (rStatus === "ALL" || r.status === rStatus) &&
      (rType === "ALL" || r.purchaseType === rType) &&
      matchesSearch(r) &&
      inRange(r.createdAt, from_, to_),
  );

  filtered = [...filtered].sort((a, b) => {
    if (rSort === "amount_desc") return b.amount - a.amount;
    const c = a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0;
    return rSort === "date_asc" ? c : -c;
  });

  const statusSeg = (["PENDING", "RESOLVED", "ALL"] as const).map((k) => ({
    key: k,
    label: k === "PENDING" ? "Pendientes" : k === "RESOLVED" ? "Resueltos" : "Todos",
    count: k === "ALL" ? refunds.length : refunds.filter((r) => r.status === k).length,
  }));

  const chips: { label: string; onRemove: () => void }[] = [];
  if (q) chips.push({ label: `"${q}"`, onRemove: () => setQ("") });
  if (rType !== "ALL")
    chips.push({
      label: `Tipo: ${labelOf(TYPE_OPTIONS, rType)}`,
      onRemove: () => setRType("ALL"),
    });
  if (rPeriod !== "all")
    chips.push({
      label:
        rPeriod === "custom"
          ? `Fecha: ${rFrom ? fdate(rFrom) : "…"} – ${rTo ? fdate(rTo) : "…"}`
          : `Fecha: ${labelOf(PERIOD_OPTIONS, rPeriod)}`,
      onRemove: () => {
        setRPeriod("all");
        setRFrom("");
        setRTo("");
      },
    });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative max-w-[400px] min-w-[260px] flex-1">
          <svg
            width="16"
            height="16"
            fill="none"
            viewBox="0 0 24 24"
            stroke="var(--color-text-muted)"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2"
          >
            <circle cx="11" cy="11" r="6.5" />
            <path d="M16 16l4.5 4.5" />
          </svg>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar quién lo pidió o qué compró"
            className="h-[38px] w-full rounded-full border py-0 pr-3.5 pl-10 text-sm outline-none"
            style={{
              borderColor: "var(--color-border)",
              background: "var(--color-surface)",
              color: "var(--color-text)",
            }}
          />
        </div>
        <Segment
          segments={statusSeg}
          value={rStatus}
          onChange={(k) => setRStatus(k as RefundRequestStatus | "ALL")}
        />
        <div className="ml-auto flex flex-wrap gap-2">
          <PillSelect
            label="Tipo"
            value={labelOf(TYPE_OPTIONS, rType)}
            options={TYPE_OPTIONS}
            active={rType !== "ALL"}
            onChange={(v) => setRType(v as PurchaseType | "ALL")}
            ariaLabel="Tipo"
          />
          <PillSelect
            label="Fecha"
            value={labelOf(PERIOD_OPTIONS, rPeriod)}
            options={PERIOD_OPTIONS}
            active={rPeriod !== "all"}
            onChange={setRPeriod}
            ariaLabel="Fecha"
          />
          <PillSelect
            label="Orden"
            value={labelOf(RSORT_OPTIONS, rSort)}
            options={RSORT_OPTIONS}
            active={false}
            onChange={setRSort}
            ariaLabel="Orden"
          />
        </div>
      </div>

      {rPeriod === "custom" && (
        <div
          className="flex flex-wrap items-center gap-2 text-[13px]"
          style={{ color: "var(--color-text-muted)" }}
        >
          <span className="font-semibold">Entre</span>
          <input
            type="date"
            value={rFrom}
            onChange={(e) => setRFrom(e.target.value)}
            className="h-[34px] rounded-full border px-3 text-[13px] outline-none"
            style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
          />
          <span>y</span>
          <input
            type="date"
            value={rTo}
            onChange={(e) => setRTo(e.target.value)}
            className="h-[34px] rounded-full border px-3 text-[13px] outline-none"
            style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
          />
        </div>
      )}

      <ActiveChips
        chips={chips}
        onClearAll={() => {
          setQ("");
          setRType("ALL");
          setRPeriod("all");
          setRFrom("");
          setRTo("");
        }}
      />

      <div className="flex flex-col gap-2">
        {filtered.length === 0 && (
          <p
            className="rounded-2xl border p-10 text-center text-sm"
            style={{
              borderColor: "var(--color-border)",
              background: "var(--color-surface)",
              color: "var(--color-text-muted)",
            }}
          >
            No hay pedidos de reembolso con estos filtros.
          </p>
        )}
        {filtered.map((r) => {
          const age = daysBetween(r.createdAt, today);
          const ageLabel =
            r.status === "PENDING"
              ? age === 0
                ? "Hoy"
                : age === 1
                  ? "Hace 1 día"
                  : `Hace ${age} días`
              : r.resolvedAt
                ? `Resuelto el ${fdate(r.resolvedAt)}`
                : "Resuelto";
          return (
            <div
              key={r.id}
              onClick={() => onSelect(r)}
              className="flex cursor-pointer items-start justify-between gap-4 rounded-2xl border p-5 transition-shadow hover:shadow-sm"
              style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold" style={{ color: "var(--color-text)" }}>
                    {r.requesterName}
                  </span>
                  <TypeBadge type={r.purchaseType} />
                  <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                    {r.productName} · {money(r.amount, r.currency)}
                  </span>
                </div>
                <p className="m-0 mt-0.5 text-xs" style={{ color: "var(--color-text-muted)" }}>
                  {REFUND_REASON_LABEL[r.reason] ?? r.reason} · {r.requesterUsername} ·{" "}
                  {fdate(r.createdAt)}
                </p>
                {r.message && (
                  <p
                    className="m-0 mt-1 overflow-hidden text-xs text-ellipsis whitespace-nowrap italic"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    &ldquo;{r.message}&rdquo;
                  </p>
                )}
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <RefundStatusBadge status={r.status} />
                <span className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>
                  {ageLabel}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Purchase detail view ──────────────────────────────────────────────────────

function PurchaseDetailView({
  purchaseId,
  purchaseType,
  onBack,
  onOpenRefund,
}: {
  purchaseId: string;
  purchaseType: PurchaseType;
  onBack: () => void;
  onOpenRefund: (id: string) => void;
}) {
  const qc = useQueryClient();
  const {
    data: p,
    isPending,
    error,
  } = useQuery({
    queryKey: ["admin", "purchases", purchaseId],
    queryFn: () => adminApi.purchaseDetail(purchaseId, purchaseType),
  });

  const confirmMut = useMutation({
    mutationFn: () => adminApi.confirmPurchase(purchaseId, purchaseType),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "purchases"] });
    },
  });

  if (isPending)
    return (
      <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
        Cargando…
      </p>
    );
  if (error || !p)
    return (
      <p className="text-sm" style={{ color: "var(--color-danger)" }}>
        No pudimos cargar los datos.
      </p>
    );

  const pendingRefund = p.refundRequests?.find((r) => r.status === "PENDING");
  const resolvedRefund = !pendingRefund && p.refundRequests?.find((r) => r.status === "RESOLVED");

  const refundBanner = pendingRefund ?? resolvedRefund;
  const bannerBg = pendingRefund ? "var(--color-shop-amber-light)" : "var(--color-fill)";
  const bannerFg = pendingRefund ? "var(--color-shop-amber-dark)" : "var(--color-text-muted)";

  const facts: { k: string; v: string }[] = [
    { k: "Tipo", v: TYPE_META[p.type].label },
    { k: "Producto", v: p.productName },
    {
      k: p.type === "SEATS" ? "Cupos" : p.type === "GEMS" ? "Gemas" : "Acceso",
      v: p.productDetail,
    },
    {
      k: p.type === "SEATS" ? "Organización" : "Usuario",
      v: `${p.buyerName} · ${p.buyerSub}`,
    },
    { k: "Email", v: p.buyerEmail },
    { k: "Creada", v: fdate(p.createdAt) },
    { k: "Pagada", v: p.paidAt ? fdate(p.paidAt) : "Pendiente" },
  ];
  if (p.refundedAt) facts.push({ k: "Reembolsada", v: fdate(p.refundedAt) });
  facts.push({ k: "Referencia externa", v: p.externalRef });
  facts.push({ k: "Medio de pago", v: p.paymentMethod ?? "Sin pagar" });
  if (p.mpOrderId) {
    facts.push({ k: "Orden de Mercado Pago", v: p.mpOrderId });
  }

  return (
    <section className="flex flex-col gap-5">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1 self-start border-none bg-transparent p-0 text-sm font-bold"
        style={{ color: "var(--color-text-muted)" }}
      >
        <svg
          width="16"
          height="16"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M15 5l-7 7 7 7" />
        </svg>
        Compras
      </button>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-1.5 flex items-center gap-2.5">
            <TypeBadge type={p.type} />
          </div>
          <h1 className="font-display m-0 text-3xl font-bold" style={{ lineHeight: "36px" }}>
            {p.productName}
          </h1>
          <p
            className="m-0 mt-1 max-w-2xl text-[15px]"
            style={{ color: "var(--color-text-muted)" }}
          >
            Compra del {fdate(p.createdAt)} · {p.productDetail}
          </p>
        </div>
        <StatusBadge status={p.status} />
      </div>

      {p.status === "PENDING_PAYMENT" && (
        <div
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl px-5 py-4"
          style={{
            background: "var(--color-shop-amber-light)",
            color: "var(--color-shop-amber-dark)",
          }}
        >
          <span className="text-sm font-semibold">
            Esta compra está pendiente de pago. Podés marcarla como pagada manualmente, como si se
            hubiese procesado por Mercado Pago.
          </span>
          <button
            onClick={() => confirmMut.mutate()}
            disabled={confirmMut.isPending}
            className="rounded-full border-none px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
            style={{ background: "var(--color-success)" }}
          >
            {confirmMut.isPending ? "Procesando…" : "Confirmar pago"}
          </button>
        </div>
      )}

      {refundBanner && (
        <div
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl px-5 py-4 text-sm font-semibold"
          style={{ background: bannerBg, color: bannerFg }}
        >
          <span className="min-w-0 flex-1">
            {pendingRefund
              ? `Hay un pedido de reembolso pendiente desde el ${fdate(pendingRefund.createdAt)}: "${REFUND_REASON_LABEL[pendingRefund.reason]!}".`
              : resolvedRefund
                ? `Tuvo un pedido de reembolso, resuelto${resolvedRefund.resolvedAt ? ` el ${fdate(resolvedRefund.resolvedAt)}` : ""}.`
                : ""}
          </span>
          <button
            onClick={() => onOpenRefund(refundBanner.id)}
            className="rounded-full border-none px-4 py-2 text-sm font-bold"
            style={{ background: "var(--color-surface)", color: "var(--color-text)" }}
          >
            Ver pedido
          </button>
        </div>
      )}

      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))" }}
      >
        <div
          className="rounded-2xl border p-[18px]"
          style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
        >
          <p className="m-0 text-[13px] font-bold" style={{ color: "var(--color-text-muted)" }}>
            Total
          </p>
          <p
            className="font-display m-0 mt-1.5 text-4xl font-extrabold"
            style={{ letterSpacing: "-0.025em" }}
          >
            {money(p.amount, p.currency)}
          </p>
          <p className="m-0 mt-1.5 text-[13px]" style={{ color: "var(--color-text-muted)" }}>
            {p.type === "SEATS" && p.seats
              ? `${money(Math.round(p.amount / p.seats), p.currency)} por cupo`
              : "Pago único"}
          </p>
        </div>
        <div
          className="rounded-2xl border p-[18px]"
          style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
        >
          <p className="m-0 text-[13px] font-bold" style={{ color: "var(--color-text-muted)" }}>
            {p.type === "SEATS" ? "Organización" : "Usuario"}
          </p>
          <p
            className="font-display m-0 mt-1.5 text-2xl font-extrabold"
            style={{ letterSpacing: "-0.025em" }}
          >
            {p.buyerName}
          </p>
          <p className="m-0 mt-1.5 text-[13px]" style={{ color: "var(--color-text-muted)" }}>
            {p.buyerSub}
          </p>
        </div>
        <div
          className="rounded-2xl border p-[18px]"
          style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
        >
          <p className="m-0 text-[13px] font-bold" style={{ color: "var(--color-text-muted)" }}>
            Pago
          </p>
          <p
            className="font-display m-0 mt-1.5 text-2xl font-extrabold"
            style={{ letterSpacing: "-0.025em" }}
          >
            {p.paidAt ? fdate(p.paidAt) : "Pendiente"}
          </p>
          <p className="m-0 mt-1.5 text-[13px]" style={{ color: "var(--color-text-muted)" }}>
            {p.paymentMethod ? PAYMENT_METHOD_LABEL[p.paymentMethod] : "Sin pagar"}
          </p>
        </div>
      </div>

      <div
        className="rounded-2xl border p-5"
        style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
      >
        <h2
          className="font-display m-0 mb-3 text-lg font-bold"
          style={{ letterSpacing: "-0.015em" }}
        >
          Datos de la compra
        </h2>
        <dl
          className="m-0"
          style={{ display: "grid", gridTemplateColumns: "minmax(0,220px) minmax(0,1fr)" }}
        >
          {facts.map((kv, i) => (
            <Fragment key={i}>
              <dt
                className="border-t py-3 text-sm"
                style={{ borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}
              >
                {kv.k}
              </dt>
              <dd
                className="border-t py-3 text-sm font-semibold"
                style={{
                  borderColor: "var(--color-border)",
                  color: "var(--color-text)",
                  margin: 0,
                  wordBreak: "break-all",
                }}
              >
                {kv.v}
              </dd>
            </Fragment>
          ))}
        </dl>
      </div>
    </section>
  );
}

// ── Refund request detail view ────────────────────────────────────────────────

function RefundDetailView({
  refundId,
  onBack,
  onOpenPurchase,
}: {
  refundId: string;
  onBack: () => void;
  onOpenPurchase: (id: string, type: PurchaseType) => void;
}) {
  const qc = useQueryClient();
  const {
    data: rf,
    isPending,
    error,
  } = useQuery({
    queryKey: ["admin", "refund-requests", refundId],
    queryFn: () => adminApi.refundRequest(refundId),
  });

  const [note, setNote] = useState<string | null>(null);
  const noteValue = note ?? rf?.note ?? "";

  const update = useMutation({
    mutationFn: (data: { action?: "RESOLVE" | "REOPEN"; note?: string }) =>
      adminApi.updateRefundRequest(refundId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "refund-requests"] });
      qc.invalidateQueries({ queryKey: ["admin", "refund-requests", refundId] });
      qc.invalidateQueries({ queryKey: ["admin", "purchases"] });
    },
  });

  if (isPending)
    return (
      <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
        Cargando…
      </p>
    );
  if (error || !rf)
    return (
      <p className="text-sm" style={{ color: "var(--color-danger)" }}>
        No pudimos cargar los datos.
      </p>
    );

  const resolved = rf.status === "RESOLVED";

  return (
    <section className="flex flex-col gap-5">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1 self-start border-none bg-transparent p-0 text-sm font-bold"
        style={{ color: "var(--color-text-muted)" }}
      >
        <svg
          width="16"
          height="16"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M15 5l-7 7 7 7" />
        </svg>
        Reembolsos
      </button>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display m-0 text-3xl font-bold" style={{ lineHeight: "36px" }}>
            Pedido de reembolso
          </h1>
          <p
            className="m-0 mt-1 max-w-2xl text-[15px]"
            style={{ color: "var(--color-text-muted)" }}
          >
            Enviado por {rf.requesterName} el {fdate(rf.createdAt)} desde {rf.channel}
          </p>
        </div>
        <RefundStatusBadge status={rf.status} />
      </div>

      <div
        className="grid items-start gap-5"
        style={{ gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))" }}
      >
        {/* Left column */}
        <div className="flex flex-col gap-5">
          {/* Reason + message */}
          <div
            className="rounded-2xl border p-5"
            style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
          >
            <h2
              className="font-display m-0 text-lg font-bold"
              style={{ letterSpacing: "-0.015em" }}
            >
              {REFUND_REASON_LABEL[rf.reason] ?? rf.reason}
            </h2>
            <p className="m-0 mt-0.5 text-xs" style={{ color: "var(--color-text-muted)" }}>
              Motivo elegido por quien lo pidió
            </p>
            <p
              className="m-0 mt-4 text-[15px] text-pretty"
              style={{ color: "var(--color-text)", lineHeight: 1.55 }}
            >
              &ldquo;{rf.message}&rdquo;
            </p>
            <div
              className="mt-4 flex items-center gap-2.5 border-t pt-4"
              style={{ borderColor: "var(--color-border)" }}
            >
              <div
                className="flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold uppercase"
                style={{ background: "var(--color-fill)", color: "var(--color-text-muted)" }}
              >
                {rf.requesterName.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="m-0 text-[13px] font-semibold" style={{ color: "var(--color-text)" }}>
                  {rf.requesterName}
                </p>
                <p className="m-0 text-xs" style={{ color: "var(--color-text-muted)" }}>
                  {rf.requesterUsername} · {rf.requesterEmail}
                </p>
              </div>
            </div>
          </div>

          {/* Linked purchase */}
          <div
            onClick={() => onOpenPurchase(rf.purchaseId, rf.purchaseType)}
            className="cursor-pointer rounded-2xl border p-5 transition-shadow hover:shadow-sm"
            style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2
                className="font-display m-0 text-lg font-bold"
                style={{ letterSpacing: "-0.015em" }}
              >
                Compra
              </h2>
              <span
                className="inline-flex items-center gap-0.5 text-[13px] font-bold"
                style={{ color: "var(--color-primary-dark)" }}
              >
                Ver compra
                <svg
                  width="14"
                  height="14"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <TypeBadge type={rf.purchaseType} />
              <span className="text-[15px] font-semibold" style={{ color: "var(--color-text)" }}>
                {rf.productName}
              </span>
              <span
                className="ml-auto inline-block rounded-full px-2.5 py-1 text-xs font-extrabold"
                style={{
                  background: STATUS_META[rf.purchaseStatus].bg,
                  color: STATUS_META[rf.purchaseStatus].fg,
                }}
              >
                {STATUS_META[rf.purchaseStatus].label}
              </span>
            </div>
            <p className="m-0 mt-2 text-[13px]" style={{ color: "var(--color-text-muted)" }}>
              {rf.productDetail} · {money(rf.amount, rf.currency)} ·{" "}
              {rf.purchasePaidAt ? `pagada el ${fdate(rf.purchasePaidAt)}` : "sin pagar"}
            </p>
          </div>
        </div>

        {/* Right column: Resolution panel */}
        <div
          className="overflow-hidden rounded-2xl border"
          style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
        >
          <div className="flex flex-col gap-3 p-5">
            <h2
              className="font-display m-0 text-lg font-bold"
              style={{ letterSpacing: "-0.015em" }}
            >
              Resolución
            </h2>
            {resolved && (
              <p className="m-0 text-[13px]" style={{ color: "var(--color-text-muted)" }}>
                Resuelto por{" "}
                <span className="font-semibold" style={{ color: "var(--color-text)" }}>
                  {rf.resolvedByName}
                </span>{" "}
                · {rf.resolvedAt ? fdate(rf.resolvedAt) : ""}
              </p>
            )}
            {!resolved && (
              <p
                className="m-0 text-[13px]"
                style={{ color: "var(--color-text-muted)", lineHeight: 1.5 }}
              >
                Marcarlo como resuelto no devuelve el dinero. Si corresponde, hacé el reembolso
                desde Mercado Pago y dejá registrado acá qué se decidió.
              </p>
            )}
            <label
              className="flex flex-col gap-1.5 text-xs font-semibold"
              style={{ color: "var(--color-text)" }}
            >
              Nota interna
              <textarea
                value={noteValue}
                onChange={(e) => setNote(e.target.value)}
                rows={4}
                placeholder="Qué se revisó y qué se decidió (solo lo ve el equipo)."
                className="resize-none rounded-xl border p-2 text-sm font-normal outline-none"
                style={{
                  borderColor: "var(--color-border)",
                  background: "var(--color-fill)",
                  color: "var(--color-text)",
                }}
              />
            </label>
          </div>
          <div className="flex gap-2 border-t p-4" style={{ borderColor: "var(--color-border)" }}>
            {!resolved && (
              <button
                onClick={() => update.mutate({ action: "RESOLVE", note: noteValue })}
                disabled={update.isPending}
                className="flex-1 rounded-xl border-none py-2.5 text-[13px] font-semibold text-white disabled:opacity-50"
                style={{ background: "var(--color-success)" }}
              >
                {update.isPending ? "Guardando…" : "Marcar como resuelto"}
              </button>
            )}
            {resolved && (
              <>
                <button
                  onClick={() => update.mutate({ note: noteValue })}
                  disabled={update.isPending}
                  className="flex-1 rounded-xl border-none py-2.5 text-[13px] font-semibold text-white disabled:opacity-50"
                  style={{ background: "var(--color-primary)" }}
                >
                  {update.isPending ? "Guardando…" : "Guardar nota"}
                </button>
                <button
                  onClick={() => update.mutate({ action: "REOPEN" })}
                  disabled={update.isPending}
                  className="rounded-xl border px-3 py-2.5 text-[13px] font-semibold disabled:opacity-50"
                  style={{
                    borderColor: "var(--color-border)",
                    background: "var(--color-surface)",
                    color: "var(--color-text-muted)",
                  }}
                >
                  Reabrir
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Root page ──────────────────────────────────────────────────────────────────

type View =
  | { kind: "list" }
  | { kind: "purchase"; id: string; type: PurchaseType }
  | { kind: "refund"; id: string };

export default function AdminPurchasesPage() {
  const [view, setView] = useState<View>({ kind: "list" });
  const [tab, setTab] = useState<"compras" | "reembolsos">("compras");

  const purchasesQ = useQuery({
    queryKey: ["admin", "purchases"],
    queryFn: adminApi.allPurchases,
  });

  const refundsQ = useQuery({
    queryKey: ["admin", "refund-requests"],
    queryFn: adminApi.refundRequests,
  });

  const pendingRefunds = (refundsQ.data ?? []).filter((r) => r.status === "PENDING").length;

  const resolvedRefundPurchaseIds = new Set(
    (refundsQ.data ?? []).filter((r) => r.status === "RESOLVED").map((r) => r.purchaseId),
  );
  const purchasesForList = (purchasesQ.data ?? []).filter(
    (p) => p.status === "REFUNDED" || !resolvedRefundPurchaseIds.has(p.id),
  );

  if (view.kind === "purchase") {
    return (
      <PurchaseDetailView
        purchaseId={view.id}
        purchaseType={view.type}
        onBack={() => setView({ kind: "list" })}
        onOpenRefund={(id) => setView({ kind: "refund", id })}
      />
    );
  }

  if (view.kind === "refund") {
    return (
      <RefundDetailView
        refundId={view.id}
        onBack={() => setView({ kind: "list" })}
        onOpenPurchase={(id, type) => setView({ kind: "purchase", id, type })}
      />
    );
  }

  // List view
  return (
    <div className="min-w-0">
      <div className="mb-6">
        <h1 className="font-display m-0 text-2xl font-bold">Compras</h1>
        <p className="m-0 mt-0.5 text-sm" style={{ color: "var(--color-text-muted)" }}>
          Cupos, gemas y cursos comprados con dinero real, y los pedidos de reembolso que envían
          usuarios y organizaciones.
        </p>
      </div>

      {/* Tabs */}
      <div
        className="mb-4 flex items-center justify-between gap-3 border-b"
        style={{ borderColor: "var(--color-border)" }}
      >
        <div className="flex gap-1">
          {(["compras", "reembolsos"] as const).map((t) => {
            const active = tab === t;
            const badge = t === "reembolsos" ? pendingRefunds : 0;
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="mb-[-1px] flex items-center gap-2 border-b-2 bg-transparent px-4 py-2 text-sm font-semibold capitalize"
                style={{
                  borderBottomColor: active ? "var(--color-primary)" : "transparent",
                  color: active ? "var(--color-primary)" : "var(--color-text-muted)",
                }}
              >
                {t === "compras" ? "Compras" : "Reembolsos"}
                {badge > 0 && (
                  <span
                    className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
                    style={{ background: "var(--color-danger)" }}
                  >
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
          {tab === "compras"
            ? purchasesQ.data
              ? `${purchasesForList.length} ${purchasesForList.length === 1 ? "compra" : "compras"}`
              : ""
            : refundsQ.data
              ? `${refundsQ.data.length} ${refundsQ.data.length === 1 ? "pedido" : "pedidos"}`
              : ""}
        </span>
      </div>

      {tab === "compras" && (
        <>
          {purchasesQ.isPending ? (
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              Cargando…
            </p>
          ) : purchasesQ.error ? (
            <p className="text-sm" style={{ color: "var(--color-danger)" }}>
              No pudimos cargar los datos.
            </p>
          ) : (
            <PurchaseList
              purchases={purchasesForList}
              onSelect={(id, type) => {
                setView({ kind: "purchase", id, type });
                window.scrollTo(0, 0);
              }}
            />
          )}
        </>
      )}

      {tab === "reembolsos" && (
        <>
          {refundsQ.isPending ? (
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              Cargando…
            </p>
          ) : refundsQ.error ? (
            <p className="text-sm" style={{ color: "var(--color-danger)" }}>
              No pudimos cargar los datos.
            </p>
          ) : (
            <RefundList
              refunds={refundsQ.data}
              onSelect={(r) => {
                setView(
                  r.informational
                    ? { kind: "purchase", id: r.purchaseId, type: r.purchaseType }
                    : { kind: "refund", id: r.id },
                );
                window.scrollTo(0, 0);
              }}
            />
          )}
        </>
      )}
    </div>
  );
}
