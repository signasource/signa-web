"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { setOnSessionExpired } from "@/lib/api/client";
import { sessionApi } from "@/lib/api/session";
import { tokenStore } from "@/lib/api/token-store";
import { adminApi, type AdminMe } from "@/lib/api/admin";

type AdminAuthStatus = "loading" | "authenticated" | "unauthenticated";

type AdminAuthContextValue = {
  status: AdminAuthStatus;
  admin: AdminMe | null;
  /** True when the session was dropped because the refresh was rejected (not a manual logout). */
  sessionExpired: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => void;
  /** Re-reads the signed-in admin (after editing their own profile). */
  refresh: () => Promise<void>;
};

const KEEP_ALIVE_MS = 10 * 60 * 1000;

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AdminAuthStatus>("loading");
  const [admin, setAdmin] = useState<AdminMe | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);

  const signOut = useCallback(() => {
    sessionApi.logout();
    setAdmin(null);
    setStatus("unauthenticated");
  }, []);

  const signIn = useCallback((me: AdminMe) => {
    setSessionExpired(false);
    setAdmin(me);
    setStatus("authenticated");
  }, []);

  // Keep the session alive while the panel is open: the access token is short-lived, so refresh
  // it (rotating the 7-day refresh cookie) on a timer and when the tab becomes visible again.
  // If the refresh is really rejected, `adminApi.me()` routes through `onSessionExpired`.
  useEffect(() => {
    if (status !== "authenticated") return;
    const keepAlive = () => {
      void sessionApi.refresh().then((ok) => {
        if (!ok) void adminApi.me().catch(() => {});
      });
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") keepAlive();
    };
    const timer = window.setInterval(keepAlive, KEEP_ALIVE_MS);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [status]);

  useEffect(() => {
    setOnSessionExpired(() => {
      setSessionExpired(true);
      signOut();
    });
    const restore = tokenStore.hasSession()
      ? adminApi.me().then(signIn)
      : Promise.reject(new Error("no session"));
    restore.catch(() => {
      tokenStore.clear();
      signOut();
    });
    return () => setOnSessionExpired(null);
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

  const refresh = useCallback(async () => {
    setAdmin(await adminApi.me());
  }, []);

  const value = useMemo(
    () => ({ status, admin, sessionExpired, login, logout: signOut, refresh }),
    [status, admin, sessionExpired, login, signOut, refresh],
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth(): AdminAuthContextValue {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used inside <AdminAuthProvider>");
  return ctx;
}
