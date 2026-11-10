import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AvatarPicker } from "@/components/admin/avatar-picker";

describe("AvatarPicker", () => {
  afterEach(cleanup);

  it("offers to upload when there is no photo and hides the remove button", () => {
    render(<AvatarPicker name="Ana" lastName="Pérez" value={null} onChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Subir foto" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Quitar foto" })).toBeNull();
  });

  it("offers to change or remove the current photo", () => {
    const onChange = vi.fn();
    render(
      <AvatarPicker
        name="Ana"
        lastName="Pérez"
        value="data:image/jpeg;base64,AAAA"
        onChange={onChange}
      />,
    );
    expect(screen.getByRole("button", { name: "Cambiar foto" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Quitar foto" }));
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it("rejects a file that is not an image without changing the value", async () => {
    const onChange = vi.fn();
    render(<AvatarPicker name="Ana" lastName="Pérez" value={null} onChange={onChange} />);
    const input = screen.getByLabelText("Elegir foto");
    fireEvent.change(input, {
      target: { files: [new File(["x"], "nota.txt", { type: "text/plain" })] },
    });
    expect(await screen.findByText("Elegí un archivo de imagen.")).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });
});
