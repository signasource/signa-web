"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ErrorState, LoadingState, PageHeading } from "@/components/dashboard/ui";
import { ProfilePhotoCard } from "@/components/dashboard/profile-photo-card";
import { ApiError } from "@/lib/api/client";
import { usersApi } from "@/lib/api/users";

export default function ProfilePage() {
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const {
    data,
    isPending,
    error: loadError,
  } = useQuery({
    queryKey: ["user", "me"],
    queryFn: usersApi.me,
  });

  const save = useMutation({
    mutationFn: (avatar: string | null) =>
      avatar === null ? usersApi.removeAvatar() : usersApi.setAvatar(avatar),
    onMutate: () => setError(null),
    onSuccess: (profile) => qc.setQueryData(["user", "me"], profile),
    onError: (err) =>
      setError(
        err instanceof ApiError && err.status === 400
          ? "La foto no es válida. Probá con otra imagen."
          : "No pudimos guardar la foto. Intentá de nuevo.",
      ),
  });

  return (
    <section className="flex flex-col gap-4">
      <PageHeading title="Mi perfil" subtitle="Tu cuenta en el panel de tu organización." />
      {loadError ? (
        <ErrorState>No pudimos cargar tu perfil.</ErrorState>
      ) : isPending ? (
        <LoadingState />
      ) : (
        <>
          <div className="text-text-muted text-sm">
            <p className="text-text text-base font-bold">
              {data.name} {data.lastName}
            </p>
            <p>@{data.username}</p>
          </div>
          <ProfilePhotoCard
            key={data.avatarUrl ?? "none"}
            profile={data}
            saving={save.isPending}
            error={error}
            onSave={(avatar) => save.mutate(avatar)}
          />
        </>
      )}
    </section>
  );
}
