import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { adminApi, type AdminSignDetail, type AdminSignUsage } from "@/lib/api/admin";
import { SignEditor } from "@/features/admin/signs/sign-editor";

vi.mock("@/features/admin/signs/sign-animation-panel", () => ({
  SignAnimationPanel: () => null,
}));

const usage: AdminSignUsage = {
  courseId: "course-1",
  courseName: "Curso Básico",
  courseVersionId: "version-1",
  version: "0.2.0",
  versionStatus: "PUBLISHED",
  topicTitle: "Unidad 2",
  lessonId: "lesson-1",
  lessonName: "La familia",
  blockTypes: ["INTRODUCE_SIGN"],
};

function sign(overrides: Partial<AdminSignDetail> = {}): AdminSignDetail {
  return {
    id: "sign-1",
    meaning: "abuelo",
    handedness: "RIGHT",
    signLanguageCode: "lsa",
    animationUrl: null,
    hasAnimation: false,
    animationFormat: null,
    mediaUrl: null,
    mediaAvailable: null,
    lateralAnimationUrl: null,
    lateralMediaUrl: null,
    animationUpdatedAt: null,
    youtubeUrl: null,
    openReports: 0,
    usages: [],
    ...overrides,
  } as AdminSignDetail;
}

function renderEditor(detail: AdminSignDetail) {
  vi.spyOn(adminApi, "sign").mockResolvedValue(detail);
  render(
    <QueryClientProvider client={new QueryClient()}>
      <SignEditor id={detail.id} onBack={() => {}} onToast={() => {}} />
    </QueryClientProvider>,
  );
}

describe("SignEditor delete button", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("explains in a tooltip, not in a permanent text, why a sign used in lessons cannot be deleted", async () => {
    renderEditor(sign({ usages: [usage] }));

    const button = await screen.findByRole("button", { name: "Eliminar" });
    const tooltip = screen.getByRole("tooltip", { hidden: true });

    expect((button as HTMLButtonElement).disabled).toBe(true);
    expect(tooltip.textContent).toBe("No se puede eliminar debido a que se usa en 1 lección.");
    expect(button.getAttribute("aria-describedby")).toBe(tooltip.id);
    expect(tooltip.className).toContain("invisible");
  });

  it("counts every lesson in the reason", async () => {
    renderEditor(sign({ usages: [usage, { ...usage, lessonId: "lesson-2" }] }));

    await screen.findByRole("button", { name: "Eliminar" });
    expect(screen.getByRole("tooltip", { hidden: true }).textContent).toBe(
      "No se puede eliminar debido a que se usa en 2 lecciones.",
    );
  });

  it("has no tooltip when the sign can be deleted", async () => {
    renderEditor(sign());

    const button = await screen.findByRole("button", { name: "Eliminar" });
    expect((button as HTMLButtonElement).disabled).toBe(false);
    expect(screen.queryByRole("tooltip", { hidden: true })).toBeNull();
    expect(button.getAttribute("aria-describedby")).toBeNull();
  });
});
