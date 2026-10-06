"use client";

import { useRef, useState } from "react";
import { MIN_FILL_MS, subscribeToWaitlist } from "@/lib/waitlist";

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  const [trap, setTrap] = useState("");
  const shownAt = useRef(0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    if (trap || (shownAt.current && Date.now() - shownAt.current < MIN_FILL_MS)) {
      setStatus("done");
      return;
    }
    setStatus("loading");
    setError(null);
    const result = await subscribeToWaitlist(email);
    if (result.ok) setStatus("done");
    else {
      setError(result.message);
      setStatus("idle");
    }
  }

  if (status === "done") {
    return (
      <div className="bg-success-light text-success-dark flex items-center gap-3 rounded-2xl px-5 py-4 text-base font-bold">
        <svg
          aria-hidden="true"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
        ¡Listo! Te avisamos cuando esté disponible.
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      onFocus={() => (shownAt.current ||= Date.now())}
      className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start"
    >
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        value={trap}
        onChange={(e) => setTrap(e.target.value)}
        className="absolute h-px w-px opacity-0"
        style={{ left: "-9999px" }}
      />
      <label className="flex-1">
        <span className="sr-only">Tu email</span>
        <input
          type="email"
          required
          placeholder="tu@email.com"
          value={email}
          maxLength={254}
          onChange={(e) => {
            setEmail(e.target.value);
            setError(null);
          }}
          disabled={status === "loading"}
          className="border-border bg-fill focus:ring-primary h-14 w-full rounded-2xl border px-4 text-base focus:ring-2 focus:outline-none disabled:opacity-60"
        />
      </label>
      <button
        type="submit"
        disabled={status === "loading"}
        className="landing-btn bg-text text-on-dark flex h-14 shrink-0 cursor-pointer items-center gap-2 rounded-2xl px-7 text-base font-extrabold disabled:opacity-60"
      >
        {status === "loading" ? "Enviando…" : "Avisame"}
      </button>
      {error && (
        <p role="alert" className="text-danger basis-full text-sm font-bold">
          {error}
        </p>
      )}
    </form>
  );
}
