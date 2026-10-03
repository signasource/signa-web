"use client";

import { useState } from "react";
import { subscribeToWaitlist } from "@/app/(marketing)/proximamente/actions";

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    await subscribeToWaitlist(email);
    setStatus("done");
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-start">
      <label className="flex-1">
        <span className="sr-only">Tu email</span>
        <input
          type="email"
          required
          placeholder="tu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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
    </form>
  );
}
