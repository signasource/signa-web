"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { adminApi, type AdminUser, type AdminWaitlistEntry } from "@/lib/api/admin";
import { cn } from "@/lib/utils";

const ROLE_LABELS: Record<string, string> = {
  USER: "Usuario",
  ADMIN: "Admin Signa",
  ORG_ADMIN: "Admin de org",
};

const ROLE_COLORS: Record<string, string> = {
  USER: "bg-fill text-text-muted",
  ADMIN: "bg-primary/10 text-primary",
  ORG_ADMIN: "bg-accent-teal/10 text-accent-teal",
};

function UserDetailModal({ user, onClose }: { user: AdminUser; onClose: () => void }) {
  const qc = useQueryClient();
  const [confirm, setConfirm] = useState<"disable" | "enable" | null>(null);

  const mutate = useMutation({
    mutationFn: (enabled: boolean) => adminApi.updateUser(user.id, { enabled }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-surface w-full max-w-md rounded-2xl p-6 shadow-2xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="font-display text-text text-xl font-bold">
              {user.name} {user.lastName}
            </h2>
            <p className="text-text-muted text-sm">{user.email}</p>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text p-1">
            ✕
          </button>
        </div>

        <dl className="mb-6 grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-text-muted">Usuario</dt>
            <dd className="font-medium">@{user.username}</dd>
          </div>
          <div>
            <dt className="text-text-muted">Rol</dt>
            <dd>
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                  ROLE_COLORS[user.role],
                )}
              >
                {ROLE_LABELS[user.role] ?? user.role}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-text-muted">Verificado</dt>
            <dd className="font-medium">{user.verified ? "Sí" : "No"}</dd>
          </div>
          <div>
            <dt className="text-text-muted">Estado</dt>
            <dd className="font-medium">{user.enabled ? "Activo" : "Deshabilitado"}</dd>
          </div>
          {user.organizationName && (
            <div className="col-span-2">
              <dt className="text-text-muted">Organización</dt>
              <dd className="font-medium">{user.organizationName}</dd>
            </div>
          )}
        </dl>

        {mutate.error && (
          <p className="text-danger mb-4 text-sm">
            {mutate.error instanceof Error ? mutate.error.message : "Error al actualizar."}
          </p>
        )}

        {!confirm ? (
          <div className="flex gap-2">
            {user.enabled ? (
              <button
                onClick={() => setConfirm("disable")}
                className="border-danger text-danger hover:bg-danger/5 rounded-xl border px-4 py-2 text-sm font-semibold"
              >
                Deshabilitar cuenta
              </button>
            ) : (
              <button
                onClick={() => setConfirm("enable")}
                className="bg-success rounded-xl px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
              >
                Rehabilitar cuenta
              </button>
            )}
          </div>
        ) : (
          <div className="bg-fill rounded-xl p-4">
            <p className="text-text mb-3 text-sm font-medium">
              {confirm === "disable"
                ? "¿Deshabilitar esta cuenta? El usuario no podrá iniciar sesión."
                : "¿Rehabilitar esta cuenta?"}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => mutate.mutate(confirm === "enable")}
                disabled={mutate.isPending}
                className={cn(
                  "rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-50",
                  confirm === "disable" ? "bg-danger" : "bg-success",
                )}
              >
                Confirmar
              </button>
              <button
                onClick={() => setConfirm(null)}
                className="border-border text-text-muted rounded-xl border px-4 py-2 text-sm font-medium"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function UsersTab() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<AdminUser | null>(null);

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value);
    clearTimeout(
      (window as Window & { _userSearchTimeout?: ReturnType<typeof setTimeout> })
        ._userSearchTimeout,
    );
    (window as Window & { _userSearchTimeout?: ReturnType<typeof setTimeout> })._userSearchTimeout =
      setTimeout(() => {
        setDebouncedQuery(e.target.value);
        setPage(0);
      }, 300);
  }

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "users", debouncedQuery, page],
    queryFn: () => adminApi.users({ query: debouncedQuery || undefined, page, size: 20 }),
  });

  return (
    <div>
      <div className="mb-4">
        <input
          type="search"
          value={query}
          onChange={handleSearch}
          placeholder="Buscar por nombre, email o usuario…"
          className="border-border bg-surface focus:border-primary w-full max-w-sm rounded-xl border px-4 py-2.5 text-sm outline-none"
        />
      </div>

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
                  <th className="px-5 py-3 text-left font-semibold">Estado</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {data?.content.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-text-muted px-5 py-8 text-center">
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
                    <td className="px-5 py-4">
                      <p className="text-text font-semibold">
                        {user.name} {user.lastName}
                      </p>
                      <p className="text-text-muted text-xs">{user.email}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                          ROLE_COLORS[user.role],
                        )}
                      >
                        {ROLE_LABELS[user.role] ?? user.role}
                      </span>
                    </td>
                    <td className="text-text-muted px-5 py-4 text-sm">
                      {user.organizationName ?? "—"}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                          user.enabled
                            ? "bg-success/10 text-success-dark"
                            : "bg-fill text-text-muted",
                        )}
                      >
                        {user.enabled ? "Activo" : "Deshabilitado"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
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
          <div className="mb-3 flex items-center gap-2">
            <span className="font-display text-text text-lg font-bold">
              {data?.totalElements.toLocaleString("es-AR")}
            </span>
            <span className="text-text-muted text-sm">emails en la lista</span>
          </div>
          <div className="border-border bg-surface overflow-hidden rounded-2xl border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-border bg-fill text-text-muted border-b">
                  <th className="px-5 py-3 text-left font-semibold">Email</th>
                  <th className="px-5 py-3 text-left font-semibold">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {data?.content.map((entry: AdminWaitlistEntry) => (
                  <tr key={entry.id} className="border-border border-b last:border-0">
                    <td className="text-text px-5 py-3">{entry.email}</td>
                    <td className="text-text-muted px-5 py-3 text-xs">
                      {new Date(entry.createdAt).toLocaleDateString("es-AR")}
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
      <h1 className="font-display text-text mb-2 text-2xl font-bold">Usuarios</h1>
      <p className="text-text-muted mb-6 text-sm">Gestioná los usuarios y la lista de espera.</p>

      <div className="bg-fill mb-6 flex w-fit gap-1 rounded-xl p-1">
        <button
          onClick={() => setTab("users")}
          className={cn(
            "rounded-lg px-5 py-2 text-sm font-semibold transition-colors",
            tab === "users" ? "bg-surface text-text shadow-sm" : "text-text-muted hover:text-text",
          )}
        >
          Usuarios
        </button>
        <button
          onClick={() => setTab("waitlist")}
          className={cn(
            "rounded-lg px-5 py-2 text-sm font-semibold transition-colors",
            tab === "waitlist"
              ? "bg-surface text-text shadow-sm"
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
