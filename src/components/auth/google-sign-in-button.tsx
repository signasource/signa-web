"use client";

import { useEffect, useRef, useState } from "react";
import { env } from "@/lib/env";

type GoogleId = {
  initialize: (config: {
    client_id: string;
    callback: (response: { credential?: string }) => void;
  }) => void;
  renderButton: (parent: HTMLElement, options: Record<string, string | number>) => void;
};

declare global {
  interface Window {
    google?: { accounts: { id: GoogleId } };
  }
}

const SCRIPT_SRC = "https://accounts.google.com/gsi/client";

function loadScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve();
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
    const script = existing ?? document.createElement("script");
    script.addEventListener("load", () => resolve());
    script.addEventListener("error", () => reject(new Error("gsi")));
    if (!existing) {
      script.src = SCRIPT_SRC;
      script.async = true;
      document.head.appendChild(script);
    }
  });
}

/** Renders Google's official button; calls `onCredential` with the Google ID token. */
export function GoogleSignInButton({ onCredential }: { onCredential: (idToken: string) => void }) {
  const container = useRef<HTMLDivElement>(null);
  const callback = useRef(onCredential);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    callback.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    if (!env.googleClientId) return;
    let cancelled = false;
    loadScript()
      .then(() => {
        const id = window.google?.accounts.id;
        if (cancelled || !id || !container.current) return;
        id.initialize({
          client_id: env.googleClientId,
          callback: (response) => {
            if (response.credential) callback.current(response.credential);
          },
        });
        id.renderButton(container.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "pill",
          locale: "es",
          width: 320,
        });
      })
      .catch(() => setFailed(true));
    return () => {
      cancelled = true;
    };
  }, []);

  if (!env.googleClientId) return null;
  if (failed) {
    return <p className="text-text-muted text-[12px]">No pudimos cargar el acceso con Google.</p>;
  }
  return <div ref={container} className="flex min-h-10 justify-center" />;
}
