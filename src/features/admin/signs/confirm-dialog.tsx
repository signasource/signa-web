"use client";

import type { ReactNode } from "react";

export type ConfirmRequest = {
  title: string;
  body: ReactNode;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
};

export function ConfirmDialog({
  request,
  onClose,
}: {
  request: ConfirmRequest | null;
  onClose: () => void;
}) {
  if (!request) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      className="bg-ink-900/50 fixed inset-0 z-60 flex items-center justify-center p-6"
    >
      <div className="flex w-[440px] max-w-full flex-col gap-4 rounded-xl bg-white p-6 shadow-[0_24px_60px_rgba(30,23,20,.25)]">
        <h3 id="confirm-title" className="font-display text-text text-xl font-bold">
          {request.title}
        </h3>
        <div className="text-text-muted text-sm leading-relaxed">{request.body}</div>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="border-border text-text hover:bg-fill rounded-xl border bg-white px-4 py-2.5 text-sm font-semibold"
          >
            Cancelar
          </button>
          <button
            autoFocus
            onClick={() => {
              request.onConfirm();
              onClose();
            }}
            className={
              request.danger
                ? "bg-danger rounded-xl px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
                : "bg-text text-on-dark hover:bg-ink-700 rounded-xl px-5 py-2.5 text-sm font-semibold"
            }
          >
            {request.confirmLabel ?? "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}
