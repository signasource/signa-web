import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProfilePhotoCard } from "@/components/dashboard/profile-photo-card";

const profile = { name: "Ana", lastName: "Pérez", avatarUrl: "/users/ana/avatar?v=1" };

describe("ProfilePhotoCard", () => {
  afterEach(cleanup);

  it("keeps save disabled until the photo changes", () => {
    render(<ProfilePhotoCard profile={profile} saving={false} error={null} onSave={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Guardar foto" })).toBeDisabled();
  });

  it("saves null after the photo is removed", () => {
    const onSave = vi.fn();
    render(<ProfilePhotoCard profile={profile} saving={false} error={null} onSave={onSave} />);
    fireEvent.click(screen.getByRole("button", { name: "Quitar foto" }));
    fireEvent.click(screen.getByRole("button", { name: "Guardar foto" }));
    expect(onSave).toHaveBeenCalledWith(null);
  });

  it("offers to upload when there is no photo and nothing to save", () => {
    render(
      <ProfilePhotoCard
        profile={{ ...profile, avatarUrl: null }}
        saving={false}
        error={null}
        onSave={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: "Subir foto" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Guardar foto" })).toBeDisabled();
  });

  it("shows the error and disables saving while it is in flight", () => {
    render(<ProfilePhotoCard profile={profile} saving error="Falló" onSave={vi.fn()} />);
    expect(screen.getByText("Falló")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Guardando…" })).toBeDisabled();
  });
});
