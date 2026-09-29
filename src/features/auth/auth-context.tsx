"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { authApi } from "@/lib/api/auth";
import { setOnSessionExpired } from "@/lib/api/client";
import { organizationsApi } from "@/lib/api/organizations";
import { tokenStore } from "@/lib/api/token-store";
import type { MyOrganization } from "@/lib/api/types";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type AuthContextValue = {
  status: AuthStatus;
  /** The organization the signed-in admin manages; null while loading or signed out. */
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
    tokenStore.clear();
    setOrganization(null);
    setStatus("unauthenticated");
  }, []);

  const signIn = useCallback((org: MyOrganization) => {
    setOrganization(org);
    setStatus("authenticated");
  }, []);

  useEffect(() => {
    setOnSessionExpired(signOut);
    // No access token after a reload: the first call 401s and the client refreshes transparently.
    const restore = tokenStore.getRefresh()
      ? fetchAdminOrganization().then(signIn)
      : Promise.reject(new Error("no session"));
    restore.catch(signOut);
    return () => setOnSessionExpired(null);
  }, [signIn, signOut]);

  const login = useCallback(
    async (identifier: string, password: string) => {
      tokenStore.set(await authApi.login(identifier, password));
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
