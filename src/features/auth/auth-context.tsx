"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { setOnSessionExpired } from "@/lib/api/client";
import { organizationsApi } from "@/lib/api/organizations";
import { sessionApi } from "@/lib/api/session";
import { tokenStore } from "@/lib/api/token-store";
import type { MyOrganization } from "@/lib/api/types";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type AuthContextValue = {
  status: AuthStatus;
  organization: MyOrganization | null;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchAdminOrganization(): Promise<MyOrganization> {
  const org = await organizationsApi.me();
  if (org.role !== "ADMIN") throw new Error("This account is not an organization admin.");
  return org;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
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
    setOnSessionExpired(signOut);
    const restore = tokenStore.hasSession()
      ? fetchAdminOrganization().then(signIn)
      : Promise.reject(new Error("no session"));
    restore.catch(signOut);
    return () => setOnSessionExpired(null);
  }, [signIn, signOut]);

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

  const value = useMemo(
    () => ({ status, organization, login, logout: signOut }),
    [status, organization, login, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
