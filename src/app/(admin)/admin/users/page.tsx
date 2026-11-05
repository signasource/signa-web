"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  relativeDate,
  ROLE_COLORS,
  ROLE_LABELS,
  UserDetailModal,
} from "@/features/admin/user-detail-modal";
import { adminApi, type AdminUser, type AdminWaitlistEntry, type UserRole } from "@/lib/api/admin";
import { cn } from "@/lib/utils";

function UsersTab() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "">("");
  const [page, setPage] = useState(0);
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

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "users", debouncedQuery, roleFilter, page],
    queryFn: () =>
      adminApi.users({
        query: debouncedQuery || undefined,
        role: roleFilter || undefined,
        page,
        size: 20,
      }),
  });

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={query}
          onChange={handleSearch}
          placeholder="Nombre, @usuario o email"
          className="border-border bg-surface focus:border-primary min-w-60 flex-1 rounded-xl border px-4 py-2.5 text-sm outline-none"
        />
        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value as UserRole | "");
            setPage(0);
          }}
          className="border-border bg-surface text-text rounded-xl border px-3 py-2.5 text-sm outline-none"
        >
          <option value="">Todos los roles</option>
          <option value="USER">Usuario</option>
          <option value="ORG_ADMIN">Admin de org.</option>
          <option value="ADMIN">Admin Signa</option>
        </select>
      </div>

      {data && (
        <p className="text-text-muted mb-3 text-xs">
          {data.totalElements.toLocaleString("es-AR")} cuentas
          {data.content.filter((u) => !u.verified).length > 0 &&
            ` · ${data.content.filter((u) => !u.verified).length} sin verificar en esta página`}
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
          <div className="border-border bg-surface overflow-hidden rounded-2xl border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-border bg-fill text-text-muted border-b">
                  <th className="px-5 py-3 text-left font-semibold">Usuario</th>
                  <th className="px-5 py-3 text-left font-semibold">Rol</th>
                  <th className="px-5 py-3 text-left font-semibold">Organización</th>
                  <th className="px-5 py-3 text-left font-semibold">Acceso</th>
                  <th className="px-5 py-3 text-left font-semibold">Racha</th>
                  <th className="px-5 py-3 text-left font-semibold">Última actividad</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {data?.content.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-text-muted px-5 py-8 text-center">
                      No se encontraron usuarios.
                    </td>
                  </tr>
                )}
                {data?.content.map((user) => (
                  <tr
                    key={user.id}
                    className="border-border hover:bg-fill/50 cursor-pointer border-b last:border-0"
                    onClick={() => setSelected(user)}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="bg-fill text-text-muted flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold uppercase">
                          {user.name[0]}
                          {user.lastName[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="text-text truncate font-semibold">
                            {user.name} {user.lastName}
                            {!user.enabled && (
                              <span className="bg-danger/10 text-danger ml-2 rounded-full px-2 py-0.5 text-xs font-semibold">
                                Deshabilitada
                              </span>
                            )}
                          </p>
                          <p className="text-text-muted truncate text-xs">
                            @{user.username} · {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                          ROLE_COLORS[user.role],
                        )}
                      >
                        {ROLE_LABELS[user.role]}
                      </span>
                    </td>
                    <td className="text-text-muted px-5 py-3.5 text-sm">
                      {user.organizationName ?? "—"}
                    </td>
                    <td className="px-5 py-3.5 text-xs">
                      <span className="text-text font-medium">
                        {user.authProvider === "GOOGLE" ? "Google" : "Email"}
                      </span>
                      <span
                        className={cn("ml-1", user.verified ? "text-success-dark" : "text-warning")}
                      >
                        · {user.verified ? "verificada" : "sin verificar"}
                      </span>
                    </td>
                    <td className="text-text px-5 py-3.5 text-sm font-medium">
                      {user.currentStreak > 0 ? `${user.currentStreak} días` : "—"}
                    </td>
                    <td className="text-text-muted px-5 py-3.5 text-xs">
                      {relativeDate(user.lastStreakDate)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className="text-primary text-xs font-semibold">Ver</span>
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

function WaitlistTab() {
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "waitlist", page],
    queryFn: () => adminApi.waitlist({ page, size: 50 }),
  });

  return (
    <div>
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-fill h-12 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          {data && (
            <p className="text-text-muted mb-3 text-xs">
              {data.totalElements.toLocaleString("es-AR")} emails registrados
            </p>
          )}
          <div className="border-border bg-surface overflow-hidden rounded-2xl border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-border bg-fill text-text-muted border-b">
                  <th className="px-5 py-3 text-left font-semibold">Email</th>
                  <th className="px-5 py-3 text-left font-semibold">Fecha de registro</th>
                </tr>
              </thead>
              <tbody>
                {data?.content.map((entry: AdminWaitlistEntry) => (
                  <tr key={entry.id} className="border-border border-b last:border-0">
                    <td className="text-text px-5 py-3">{entry.email}</td>
                    <td className="text-text-muted px-5 py-3 text-xs">
                      {new Date(entry.createdAt).toLocaleDateString("es-AR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
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
    </div>
  );
}

export default function UsersPage() {
  const [tab, setTab] = useState<"users" | "waitlist">("users");

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
          onClick={() => setTab("waitlist")}
          className={cn(
            "px-4 py-2 text-sm font-semibold transition-colors",
            tab === "waitlist"
              ? "border-primary text-primary border-b-2"
              : "text-text-muted hover:text-text",
          )}
        >
          Lista de espera
        </button>
      </div>

      {tab === "users" ? <UsersTab /> : <WaitlistTab />}
    </div>
  );
}
