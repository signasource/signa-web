"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { pillButton } from "@/components/dashboard/ui";
import type { Seat } from "@/lib/api/types";
import { seatEmailSchema } from "@/lib/purchases";

/** Inline form to correct the email a seat was invited with. */
export function SeatEmailEditor({
  seat,
  onSave,
  onCancel,
  saving,
  error,
}: {
  seat: Seat;
  onSave: (email: string) => void;
  onCancel: () => void;
  saving: boolean;
  error: string | null;
}) {
  const form = useForm<{ email: string }>({
    resolver: zodResolver(seatEmailSchema),
    defaultValues: { email: seat.email },
  });
  return (
    <form
      noValidate
      onSubmit={form.handleSubmit((values) => onSave(values.email.trim()))}
      className="flex flex-col gap-1.5"
    >
      <div className="flex flex-wrap gap-2">
        <input
          type="email"
          autoFocus
          aria-label="Nuevo email"
          className="border-border bg-surface min-w-0 flex-1 rounded-lg border px-3 py-1.5 text-sm"
          {...form.register("email")}
        />
        <button type="submit" disabled={saving} className={pillButton}>
          {saving ? "Guardando…" : "Guardar"}
        </button>
        <button type="button" disabled={saving} onClick={onCancel} className={pillButton}>
          Cancelar
        </button>
      </div>
      {form.formState.errors.email ? (
        <span className="text-danger text-xs">{form.formState.errors.email.message}</span>
      ) : null}
      {error ? <span className="text-danger text-xs">{error}</span> : null}
      {seat.status === "INVITED" ? (
        <span className="text-text-muted text-xs">
          El link anterior deja de funcionar y mandamos uno nuevo. El plazo no se reinicia.
        </span>
      ) : null}
    </form>
  );
}
