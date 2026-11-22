import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { organizationsApi } from "@/lib/api/organizations";
import type { ParticipantTraining } from "@/lib/api/types";
import MemberDetailPage from "./page";

vi.mock("next/navigation", () => ({
  useParams: () => ({ userId: "u1" }),
  useRouter: () => ({ replace: vi.fn() }),
}));
vi.mock("@/features/auth/auth-context", () => ({
  useAuth: () => ({ organization: { id: "org1", name: "Hospital" } }),
}));
vi.mock("@/features/dashboard/use-course-filter", () => ({
  useWithFilters: () => (href: string) => href,
}));
vi.mock("@/lib/api/organizations", () => ({
  organizationsApi: { participantTraining: vi.fn(), removeMember: vi.fn() },
}));

const TRAINING: ParticipantTraining = {
  userId: "u1",
  name: "Ana",
  lastName: "Pérez",
  email: "ana@hospital.com",
  avatarUrl: null,
  status: "ACTIVE",
  joinedAt: "2026-10-01T12:00:00Z",
  courses: [
    {
      courseId: "c1",
      courseName: "LSA Salud",
      status: "ACTIVE",
      progressPercentage: 40,
      lastActivityAt: "2026-11-20T12:00:00Z",
      startedAt: "2026-10-01T12:00:00Z",
      expiresAt: "2026-12-01T12:00:00Z",
    },
    {
      courseId: "c2",
      courseName: "Educación",
      status: "INVITATION_PENDING",
      progressPercentage: 0,
      lastActivityAt: null,
      startedAt: null,
      expiresAt: null,
    },
  ],
  total: {
    courseId: null,
    courseName: null,
    status: "ACTIVE",
    progressPercentage: 40,
    lastActivityAt: "2026-11-20T12:00:00Z",
    startedAt: "2026-10-01T12:00:00Z",
    expiresAt: "2026-12-01T12:00:00Z",
  },
};

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemberDetailPage />
    </QueryClientProvider>,
  );
}

describe("MemberDetailPage", () => {
  afterEach(cleanup);

  it("shows who it is and one row per course plus the total, nothing else", async () => {
    vi.mocked(organizationsApi.participantTraining).mockResolvedValue(TRAINING);
    renderPage();

    expect(await screen.findByText("Ana Pérez")).toBeInTheDocument();
    expect(screen.getByText(/ana@hospital\.com/)).toBeInTheDocument();
    const rows = screen.getAllByRole("row");
    // header, Educación (pending), LSA Salud, total
    expect(rows).toHaveLength(4);
    expect(rows[1]).toHaveTextContent("Educación");
    expect(rows[1]).toHaveTextContent("Invitación pendiente");
    expect(rows[2]).toHaveTextContent("LSA Salud");
    expect(rows[2]).toHaveTextContent("40%");
    expect(rows[3]).toHaveTextContent("Todos los cursos");
    for (const gone of [
      "Tiempo de aprendizaje",
      "Señas aprendidas",
      "Racha actual",
      "Módulo actual",
    ]) {
      expect(screen.queryByText(gone)).not.toBeInTheDocument();
    }
  });

  it("filters and sorts the course rows; the total follows what is shown", async () => {
    vi.mocked(organizationsApi.participantTraining).mockResolvedValue(TRAINING);
    renderPage();
    await screen.findByText("Ana Pérez");

    fireEvent.change(screen.getByLabelText("Filtrar por estado"), { target: { value: "ACTIVE" } });
    let rows = screen.getAllByRole("row");
    expect(rows).toHaveLength(3);
    expect(rows[1]).toHaveTextContent("LSA Salud");
    expect(rows[2]).toHaveTextContent("Cursos mostrados");
    expect(rows[2]).toHaveTextContent("40%");

    // Only the pending invitation: the total is that, not the API's total for every course.
    fireEvent.change(screen.getByLabelText("Filtrar por estado"), {
      target: { value: "INVITATION_PENDING" },
    });
    rows = screen.getAllByRole("row");
    expect(rows[2]).toHaveTextContent("Cursos mostrados");
    expect(rows[2]).toHaveTextContent("Invitación pendiente");
    expect(rows[2]).not.toHaveTextContent("40%");

    fireEvent.change(screen.getByLabelText("Filtrar por estado"), { target: { value: "ALL" } });
    expect(screen.getByText("Todos los cursos")).toBeInTheDocument();

    // The course filter is a list of their courses, nothing to type.
    const course = screen.getByLabelText("Filtrar por curso");
    expect(
      within(course)
        .getAllByRole("option")
        .map((o) => o.textContent),
    ).toEqual(["Todos", "LSA Salud", "Educación"]);
    fireEvent.change(course, { target: { value: "c1" } });
    rows = screen.getAllByRole("row");
    expect(rows).toHaveLength(3);
    expect(rows[1]).toHaveTextContent("LSA Salud");
    expect(rows[2]).toHaveTextContent("Cursos mostrados");

    // A course and a state that do not match: no rows, no total.
    fireEvent.change(screen.getByLabelText("Filtrar por estado"), {
      target: { value: "INVITATION_PENDING" },
    });
    expect(screen.getByText("Ningún curso coincide con los filtros.")).toBeInTheDocument();
    expect(screen.queryByText("Todos los cursos")).not.toBeInTheDocument();
    expect(screen.queryByText("Cursos mostrados")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Filtrar por estado"), { target: { value: "ALL" } });
    fireEvent.change(course, { target: { value: "ALL" } });
    fireEvent.click(screen.getByRole("button", { name: /PROGRESO/ }));
    rows = screen.getAllByRole("row");
    expect(within(rows[1]!).getByText("LSA Salud")).toBeInTheDocument();
  });
});
