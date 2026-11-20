"use client";

import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { setOnSessionExpired } from "@/lib/api/client";
import { organizationsApi } from "@/lib/api/organizations";
import { isTransientError, restoreWithRetry } from "@/lib/api/restore";
import { sessionApi } from "@/lib/api/session";
import { tokenStore } from "@/lib/api/token-store";
import type { MyOrganization } from "@/lib/api/types";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type AuthContextValue = {
  status: AuthStatus;
  organization: MyOrganization | null;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => void;
  refreshOrganization: () => Promise<void>;
};

const KEEP_ALIVE_MS = 10 * 60 * 1000;

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchAdminOrganization(): Promise<MyOrganization> {
  const org = await organizationsApi.me();
  if (org.role !== "ADMIN") throw new Error("This account is not an organization admin.");
  return org;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const inBackOffice = usePathname()?.startsWith("/admin") ?? false;
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [organization, setOrganization] = useState<MyOrganization | null>(null);

  const signOut = useCallback(() => {
    sessionApi.logout();
    setOrganization(null);
    setStatus("unauthenticated");
  }, []);

  const signIn = useCallback((org: MyOrganization) => {
    setOrganization(org);
    setStatus("authenticated");
  }, []);

  useEffect(() => {
    if (inBackOffice) return;
    setOnSessionExpired(signOut);
    let cancelled = false;
    const restore = tokenStore.hasSession()
      ? restoreWithRetry(fetchAdminOrganization).then((org) => {
          if (!cancelled) signIn(org);
        })
      : Promise.reject(new Error("no session"));
    restore.catch((err) => {
      if (cancelled) return;
      // Still unreachable after retrying: show the login but keep the cookie for the next load.
      if (isTransientError(err)) setStatus("unauthenticated");
      else signOut();
    });
    return () => {
      cancelled = true;
      setOnSessionExpired(null);
    };
  }, [inBackOffice, signIn, signOut]);

  // Keep the session alive while the panel is open (same as the back-office): refresh on a timer
  // and when the tab becomes visible again, so a regularly used panel never lapses.
  useEffect(() => {
    if (status !== "authenticated" || inBackOffice) return;
    const keepAlive = () => {
      void sessionApi.refresh().then((outcome) => {
        if (outcome === "expired") signOut();
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
  }, [status, inBackOffice, signOut]);

  const login = useCallback(
    async (identifier: string, password: string) => {
      await sessionApi.login(identifier, password);
      try {
        signIn(await fetchAdminOrganization());
      } catch (err) {
        signOut();
        throw err;
      }
    },
    [signIn, signOut],
  );

  const refreshOrganization = useCallback(async () => {
    setOrganization(await fetchAdminOrganization());
  }, []);

  const value = useMemo(
    () => ({ status, organization, login, logout: signOut, refreshOrganization }),
    [status, organization, login, signOut, refreshOrganization],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
