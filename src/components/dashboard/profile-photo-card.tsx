"use client";

import { useState } from "react";
import { AvatarPicker } from "@/components/admin/avatar-picker";
import { Card, CardTitle, headerButton } from "@/components/dashboard/ui";
import type { UserProfile } from "@/lib/api/types";
import { avatarSrc } from "@/lib/avatar-url";

type Props = {
  profile: Pick<UserProfile, "name" | "lastName" | "avatarUrl">;
  saving: boolean;
  error: string | null;
  /** A data URL replaces the photo, null removes it. */
  onSave: (avatar: string | null) => void;
};

/** Pick, change or remove the signed-in person's photo; nothing is sent until they save. */
export function ProfilePhotoCard({ profile, saving, error, onSave }: Props) {
  // undefined = untouched, string = new photo (data URL), null = remove.
  const [draft, setDraft] = useState<string | null | undefined>(undefined);
  const current = avatarSrc(profile.avatarUrl);
  const shown = draft === undefined ? current : draft;
  const changed = draft !== undefined && draft !== current;

  return (
    <Card className="flex flex-col gap-4">
      <CardTitle>Foto de perfil</CardTitle>
      <p className="text-text-muted text-sm">
        Se muestra en tu panel y a quienes comparten una organización con vos. Se achica en tu
        navegador antes de subirla.
      </p>
      <AvatarPicker
        name={profile.name}
        lastName={profile.lastName ?? ""}
        value={shown}
        onChange={setDraft}
      />
      {error ? <p className="text-danger text-sm">{error}</p> : null}
      <div>
        <button
          type="button"
          disabled={!changed || saving}
          onClick={() => {
            if (draft !== undefined) onSave(draft);
          }}
          className={`${headerButton} disabled:cursor-not-allowed disabled:opacity-50`}
        >
          {saving ? "Guardando…" : "Guardar foto"}
        </button>
      </div>
    </Card>
  );
}
