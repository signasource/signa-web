"use client";

import { useRef, useState } from "react";
import { AdminAvatar } from "@/components/admin/admin-avatar";
import { imageFileToAvatarDataUrl } from "@/lib/image-resize";

type Props = {
  name: string;
  lastName: string;
  /** Current photo as a data URL, or null for none. */
  value: string | null;
  onChange: (avatar: string | null) => void;
};

/** Upload, change or remove a profile photo. The image is resized in the browser. */
export function AvatarPicker({ name, lastName, value, onChange }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    try {
      onChange(await imageFileToAvatarDataUrl(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos usar esa imagen.");
    }
  }

  return (
    <div>
      <div className="flex items-center gap-4">
        <AdminAvatar name={name} lastName={lastName} avatar={value} className="size-16 text-lg" />
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={onPickFile}
            className="hidden"
            aria-label="Elegir foto"
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="border-border text-text hover:bg-fill rounded-xl border px-3 py-1.5 text-sm font-semibold"
          >
            {value ? "Cambiar foto" : "Subir foto"}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="text-danger rounded-xl px-3 py-1.5 text-sm font-semibold hover:underline"
            >
              Quitar foto
            </button>
          )}
        </div>
      </div>
      {error && <p className="text-danger mt-2 text-sm">{error}</p>}
    </div>
  );
}
