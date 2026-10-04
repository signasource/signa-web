const SESSION_HINT = "signa.session";
const LEGACY_REFRESH_KEY = "signa.refreshToken";

let accessToken: string | null = null;

function storage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export const tokenStore = {
  getAccess: () => accessToken,
  hasSession(): boolean {
    const s = storage();
    s?.removeItem(LEGACY_REFRESH_KEY);
    return s?.getItem(SESSION_HINT) === "1";
  },
  set(token: string) {
    accessToken = token;
    const s = storage();
    s?.setItem(SESSION_HINT, "1");
    s?.removeItem(LEGACY_REFRESH_KEY);
  },
  clear() {
    accessToken = null;
    const s = storage();
    s?.removeItem(SESSION_HINT);
    s?.removeItem(LEGACY_REFRESH_KEY);
  },
};
