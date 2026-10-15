"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { sessionApi } from "@/lib/api/session";
import { tokenStore } from "@/lib/api/token-store";
import { adminApi, type AdminMe } from "@/lib/api/admin";

type AdminAuthStatus = "loading" | "authenticated" | "unauthenticated";

type AdminAuthContextValue = {
  status: AdminAuthStatus;
  admin: AdminMe | null;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => void;
};

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AdminAuthStatus>("loading");
  const [admin, setAdmin] = useState<AdminMe | null>(null);

  const signOut = useCallback(() => {
    sessionApi.logout();
    setAdmin(null);
    setStatus("unauthenticated");
  }, []);

  const signIn = useCallback((me: AdminMe) => {
    setAdmin(me);
    setStatus("authenticated");
  }, []);

  useEffect(() => {
    const restore = tokenStore.hasSession()
      ? adminApi.me().then(signIn)
      : Promise.reject(new Error("no session"));
    restore.catch(() => {
      tokenStore.clear();
      signOut();
    });
  }, [signIn, signOut]);

  const login = useCallback(
    async (identifier: string, password: string) => {
      await sessionApi.login(identifier, password);
      try {
        signIn(await adminApi.me());
      } catch {
        signOut();
        throw new Error("Esta cuenta no tiene permisos de administrador.");
      }
    },
    [signIn, signOut],
  );

  const value = useMemo(
    () => ({ status, admin, login, logout: signOut }),
    [status, admin, login, signOut],
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth(): AdminAuthContextValue {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used inside <AdminAuthProvider>");
  return ctx;
}
