"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useEffect, useId, useRef, useState } from "react";
import { AdminAvatar } from "@/components/admin/admin-avatar";
import { AdminsPanel } from "@/components/admin/admins-panel";
import { Icon } from "@/components/dashboard/icons";
import { headerChip } from "@/components/dashboard/ui";
import {
  relativeDate,
  ROLE_COLORS,
  ROLE_LABELS,
  UserDetailModal,
} from "@/features/admin/user-detail-modal";
import { adminApi, type AdminUser, type UserRole } from "@/lib/api/admin";
import { cn } from "@/lib/utils";

// ── RolePicker ────────────────────────────────────────────────────────────────

const ROLE_OPTIONS: { value: UserRole | ""; label: string }[] = [
  { value: "", label: "Todos los roles" },
  { value: "USER", label: "Usuario" },
  { value: "ORG_ADMIN", label: "Admin de org." },
  { value: "ADMIN", label: "Admin Signa" },
];

function RolePicker({
  value,
  onChange,
}: {
  value: UserRole | "";
  onChange: (v: UserRole | "") => void;
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

  const current = ROLE_OPTIONS.find((o) => o.value === value);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          headerChip,
          "cursor-pointer border transition-shadow hover:shadow-sm",
          value
            ? "bg-primary-light text-primary-dark"
            : "border-border bg-surface text-text border",
        )}
      >
        <Icon name="people" className="size-4" />
        <span>{current?.label ?? "Todos los roles"}</span>
        <Icon
          name="chevronDown"
          className={cn("size-3.5 transition-transform", open && "rotate-180")}
        />
      </button>

      {open ? (
        <ul
          id={menuId}
          role="listbox"
          aria-label="Rol"
          className="border-border bg-surface dash-card-enter absolute left-0 z-30 mt-2 flex w-52 flex-col gap-0.5 rounded-2xl border p-1.5 shadow-lg"
        >
          {ROLE_OPTIONS.map((opt) => {
            const selected = value === opt.value;
            return (
              <li key={opt.value} role="option" aria-selected={selected}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-bold transition-colors",
                    selected ? "bg-primary-light text-primary-dark" : "hover:bg-fill text-text",
                  )}
                >
                  <span className="truncate">{opt.label}</span>
                  {selected ? <Icon name="check" className="size-4" /> : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

// ── DateRangePicker ───────────────────────────────────────────────────────────

const DATE_FMT = new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short" });

function formatDate(iso: string): string {
  const d = new Date(iso + "T12:00:00");
  return DATE_FMT.format(d);
}

function dateRangeLabel(from: string, to: string): string {
  if (!from && !to) return "Todo";
  if (from && to) return `${formatDate(from)} – ${formatDate(to)}`;
  if (from) return `Desde ${formatDate(from)}`;
  return `Hasta ${formatDate(to)}`;
}

const dateInput =
  "border-border bg-surface text-text focus:border-primary w-full rounded-xl border px-3 py-2 text-sm font-bold outline-none";

function DateRangePicker({
  label,
  from,
  to,
  onFromChange,
  onToChange,
}: {
  label: string;
  from: string;
  to: string;
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const active = !!(from || to);

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

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          headerChip,
          "cursor-pointer border transition-shadow hover:shadow-sm",
          active ? "bg-primary-light text-primary-dark" : "border-border bg-surface text-text",
        )}
      >
        <Icon name="calendar" className="size-4" />
        <span>
          {label}: {dateRangeLabel(from, to)}
        </span>
        <Icon
          name="chevronDown"
          className={cn("size-3.5 transition-transform", open && "rotate-180")}
        />
      </button>

      {open ? (
        <div
          id={panelId}
          role="dialog"
          aria-label={`Rango de fecha: ${label}`}
          className="border-border bg-surface dash-card-enter absolute left-0 z-30 mt-2 w-64 rounded-2xl border p-3 shadow-lg"
        >
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-text-muted text-xs font-bold">Desde</label>
              <input
                type="date"
                value={from}
                max={to || undefined}
                onChange={(e) => onFromChange(e.target.value)}
                className={dateInput}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-text-muted text-xs font-bold">Hasta</label>
              <input
                type="date"
                value={to}
                min={from || undefined}
                onChange={(e) => onToChange(e.target.value)}
                className={dateInput}
              />
            </div>
            {active ? (
              <button
                type="button"
                onClick={() => {
                  onFromChange("");
                  onToChange("");
                }}
                className="text-text-muted hover:text-text cursor-pointer self-start text-[13px] font-bold"
              >
                Limpiar
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ── Sortable column header ────────────────────────────────────────────────────

type SortDir = "asc" | "desc";
type SortField =
  "name" | "role" | "organization" | "access" | "createdAt" | "lastActivity" | "streak";

/** First click on a column: text A→Z, numbers and dates highest/most recent first. */
const FIRST_DIR: Record<SortField, SortDir> = {
  name: "asc",
  role: "asc",
  organization: "asc",
  access: "asc",
  createdAt: "desc",
  lastActivity: "desc",
  streak: "desc",
};

function SortTh({
  label,
  field,
  sortBy,
  sortDir,
  onSort,
  align = "left",
}: {
  label: string;
  field: SortField;
  sortBy: SortField | null;
  sortDir: SortDir;
  onSort: (f: SortField) => void;
  align?: "left" | "right";
}) {
  const active = sortBy === field;
  return (
    <th
      aria-sort={active ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
      className={cn(
        "px-3 py-3 font-bold whitespace-nowrap select-none",
        align === "right" ? "text-right" : "text-left",
      )}
    >
      <button
        type="button"
        onClick={() => onSort(field)}
        title={`Ordenar por ${label.toLowerCase()}`}
        className={cn(
          "hover:text-text inline-flex cursor-pointer items-center gap-1 transition-colors",
          active ? "text-text" : "text-text-muted",
          align === "right" && "flex-row-reverse",
        )}
      >
        <span>{label}</span>
        <Icon
          name={active ? (sortDir === "asc" ? "arrowUp" : "arrowDown") : "sortable"}
          className="size-3.5 shrink-0"
        />
      </button>
    </th>
  );
}

// ── UsersTab ──────────────────────────────────────────────────────────────────

function UsersTab() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "">("");
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");
  const [lastActiveFrom, setLastActiveFrom] = useState("");
  const [lastActiveTo, setLastActiveTo] = useState("");
  const [page, setPage] = useState(0);
  // Sorted by the API over every matching account (not just this page); newest first by default.
  const [sortBy, setSortBy] = useState<SortField>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selected, setSelected] = useState<AdminUser | null>(null);

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value);
    clearTimeout(
      (window as Window & { _userSearchTimeout?: ReturnType<typeof setTimeout> })
        ._userSearchTimeout,
    );
    (
      window as Window & {
        _userSearchTimeout?: ReturnType<typeof setTimeout>;
      }
    )._userSearchTimeout = setTimeout(() => {
      setDebouncedQuery(e.target.value);
      setPage(0);
    }, 300);
  }

  function handleSort(field: SortField) {
    if (sortBy === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortDir(FIRST_DIR[field]);
    }
    setPage(0);
  }

  function handleFilterChange<T>(setter: (v: T) => void, value: T) {
    setter(value);
    setPage(0);
  }

  const { data, isLoading, isPlaceholderData } = useQuery({
    queryKey: [
      "admin",
      "users",
      debouncedQuery,
      roleFilter,
      page,
      createdFrom,
      createdTo,
      lastActiveFrom,
      lastActiveTo,
      sortBy,
      sortDir,
    ],
    queryFn: () =>
      adminApi.users({
        query: debouncedQuery || undefined,
        role: roleFilter || undefined,
        page,
        size: 20,
        createdFrom: createdFrom || undefined,
        createdTo: createdTo || undefined,
        lastActiveFrom: lastActiveFrom || undefined,
        lastActiveTo: lastActiveTo || undefined,
        sortBy,
        sortDir,
      }),
    // Re-sorting or paging keeps the current rows on screen (dimmed) until the new ones arrive,
    // instead of swapping the table for the loading skeleton.
    placeholderData: keepPreviousData,
  });

  const sorted = data?.content ?? [];

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={query}
          onChange={handleSearch}
          placeholder="Nombre, @usuario o email"
          className="border-border bg-surface focus:border-primary min-w-52 flex-1 rounded-full border px-4 py-2 text-[13px] font-bold outline-none"
        />
        <RolePicker value={roleFilter} onChange={(v) => handleFilterChange(setRoleFilter, v)} />
        <DateRangePicker
          label="Incorporación"
          from={createdFrom}
          to={createdTo}
          onFromChange={(v) => handleFilterChange(setCreatedFrom, v)}
          onToChange={(v) => handleFilterChange(setCreatedTo, v)}
        />
        <DateRangePicker
          label="Últ. actividad"
          from={lastActiveFrom}
          to={lastActiveTo}
          onFromChange={(v) => handleFilterChange(setLastActiveFrom, v)}
          onToChange={(v) => handleFilterChange(setLastActiveTo, v)}
        />
      </div>

      {data && (
        <p className="text-text-muted mb-3 text-xs">
          {data.totalElements.toLocaleString("es-AR")} cuentas
        </p>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-fill h-14 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : (
        <>
          <div
            className={cn(
              "border-border bg-surface overflow-x-auto rounded-2xl border transition-opacity",
              isPlaceholderData && "opacity-60",
            )}
          >
            <table className="w-full min-w-[960px] text-sm">
              <thead>
                <tr className="border-border bg-fill text-text-muted border-b text-xs">
                  <SortTh
                    label="Usuario"
                    field="name"
                    sortBy={sortBy}
                    sortDir={sortDir}
                    onSort={handleSort}
                  />
                  <SortTh
                    label="Rol"
                    field="role"
                    sortBy={sortBy}
                    sortDir={sortDir}
                    onSort={handleSort}
                  />
                  <SortTh
                    label="Organización"
                    field="organization"
                    sortBy={sortBy}
                    sortDir={sortDir}
                    onSort={handleSort}
                  />
                  <SortTh
                    label="Acceso"
                    field="access"
                    sortBy={sortBy}
                    sortDir={sortDir}
                    onSort={handleSort}
                  />
                  <SortTh
                    label="Incorporación"
                    field="createdAt"
                    sortBy={sortBy}
                    sortDir={sortDir}
                    onSort={handleSort}
                  />
                  <SortTh
                    label="Racha"
                    field="streak"
                    sortBy={sortBy}
                    sortDir={sortDir}
                    onSort={handleSort}
                  />
                  <SortTh
                    label="Última actividad"
                    field="lastActivity"
                    sortBy={sortBy}
                    sortDir={sortDir}
                    onSort={handleSort}
                  />
                  <th className="px-3 py-3">
                    <span className="sr-only">Detalle</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sorted.length === 0 && !isLoading && (
                  <tr>
                    <td colSpan={8} className="text-text-muted px-5 py-8 text-center">
                      No se encontraron usuarios.
                    </td>
                  </tr>
                )}
                {sorted.map((user) => (
                  <tr
                    key={user.id}
                    className="border-border hover:bg-fill/50 cursor-pointer border-b last:border-0"
                    onClick={() => setSelected(user)}
                  >
                    <td className="px-3 py-3.5">
                      <div className="flex items-center gap-3">
                        <AdminAvatar
                          name={user.name}
                          lastName={user.lastName}
                          avatar={user.avatar}
                        />
                        <div className="max-w-[190px] min-w-0">
                          <p className="text-text truncate font-semibold">
                            {user.name} {user.lastName}
                            {!user.enabled && (
                              <span className="bg-danger/10 text-danger ml-2 rounded-full px-2 py-0.5 text-xs font-semibold">
                                Deshabilitada
                              </span>
                            )}
                          </p>
                          <p
                            className="text-text-muted truncate text-xs"
                            title={`@${user.username} · ${user.email}`}
                          >
                            @{user.username} · {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3.5">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
                          ROLE_COLORS[user.role],
                        )}
                      >
                        {ROLE_LABELS[user.role]}
                      </span>
                    </td>
                    <td className="text-text-muted px-3 py-3.5 text-sm">
                      {user.organizationName ?? "—"}
                    </td>
                    <td className="px-3 py-3.5 text-xs whitespace-nowrap">
                      <span className="text-text font-medium">
                        {user.authProvider === "GOOGLE" ? "Google" : "Email"}
                      </span>
                      <span
                        className={cn("ml-1", user.verified ? "text-success-dark" : "text-warning")}
                      >
                        · {user.verified ? "verificada" : "sin verificar"}
                      </span>
                    </td>
                    <td className="text-text-muted px-3 py-3.5 text-xs">
                      {relativeDate(user.createdAt ?? null)}
                    </td>
                    <td className="text-text px-3 py-3.5 text-sm font-medium">
                      {user.currentStreak > 0 ? `${user.currentStreak} días` : "—"}
                    </td>
                    <td className="text-text-muted px-3 py-3.5 text-xs">
                      {relativeDate(user.lastSeenDate ?? user.lastStreakDate)}
                    </td>
                    <td className="py-3.5 pr-4 pl-2 text-right">
                      <span className="bg-primary-light text-primary-dark inline-flex rounded-full px-3 py-1 text-xs font-bold whitespace-nowrap">
                        Ver
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data && data.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <button
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
                className="border-border text-text-muted hover:bg-fill rounded-xl border px-4 py-2 text-sm font-medium disabled:opacity-40"
              >
                Anterior
              </button>
              <span className="text-text-muted text-sm">
                Página {page + 1} de {data.totalPages}
              </span>
              <button
                disabled={page >= data.totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
                className="border-border text-text-muted hover:bg-fill rounded-xl border px-4 py-2 text-sm font-medium disabled:opacity-40"
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}

      {selected && <UserDetailModal user={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

export default function UsersPage() {
  const [tab, setTab] = useState<"users" | "admins">("users");

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-text text-2xl font-bold">Usuarios</h1>
        <p className="text-text-muted mt-0.5 text-sm">
          Buscá cuentas, revisá su actividad y gestioná roles.
        </p>
      </div>

      <div className="border-border mb-6 flex gap-1 border-b">
        <button
          onClick={() => setTab("users")}
          className={cn(
            "px-4 py-2 text-sm font-semibold transition-colors",
            tab === "users"
              ? "border-primary text-primary border-b-2"
              : "text-text-muted hover:text-text",
          )}
        >
          Usuarios
        </button>
        <button
          onClick={() => setTab("admins")}
          className={cn(
            "px-4 py-2 text-sm font-semibold transition-colors",
            tab === "admins"
              ? "border-primary text-primary border-b-2"
              : "text-text-muted hover:text-text",
          )}
        >
          Administradores
        </button>
      </div>

      {tab === "users" ? <UsersTab /> : <AdminsPanel />}
    </div>
  );
}
