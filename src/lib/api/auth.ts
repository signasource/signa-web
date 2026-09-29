import { api } from "@/lib/api/client";
import type { AuthResponse } from "@/lib/api/types";

export const authApi = {
  login: (identifier: string, password: string) =>
    api<AuthResponse>("/auth/login", {
      method: "POST",
      body: { identifier, password },
      anonymous: true,
    }),

  forgotPassword: (email: string) =>
    api("/auth/forgot-password", { method: "POST", body: { email }, anonymous: true }),

  resetPassword: (token: string, newPassword: string) =>
    api("/auth/reset-password", {
      method: "POST",
      query: { token },
      body: { newPassword },
      anonymous: true,
    }),
};
