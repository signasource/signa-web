import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { AdminAvatar } from "@/components/admin/admin-avatar";

describe("AdminAvatar", () => {
  afterEach(cleanup);

  it("shows the photo when there is one", () => {
    render(<AdminAvatar name="Ana" lastName="Pérez" avatar="data:image/jpeg;base64,AAAA" />);
    expect(screen.getByRole("img", { name: "Foto de Ana Pérez" })).toHaveAttribute(
      "src",
      "data:image/jpeg;base64,AAAA",
    );
  });

  it("falls back to the initials without a photo", () => {
    render(<AdminAvatar name="Ana" lastName="Pérez" avatar={null} />);
    expect(screen.queryByRole("img")).toBeNull();
    expect(screen.getByText("AP")).toBeInTheDocument();
  });
});
