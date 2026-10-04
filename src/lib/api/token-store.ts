const REFRESH_KEY = "signa.refreshToken";

let accessToken: string | null = null;

export const tokenStore = {
  getAccess: () => accessToken,
  getRefresh(): string | null {
    try {
      return window.localStorage.getItem(REFRESH_KEY);
    } catch {
      return null;
    }
  },
  set(tokens: { accessToken: string; refreshToken: string }) {
    accessToken = tokens.accessToken;
    try {
      window.localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
    } catch {}
  },
  clear() {
    accessToken = null;
    try {
      window.localStorage.removeItem(REFRESH_KEY);
    } catch {}
  },
};
