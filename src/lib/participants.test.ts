import { describe, expect, it } from "vitest";
import { activityLegend } from "@/lib/participants";

describe("activityLegend", () => {
  it("explains active and inactive for the selected course", () => {
    expect(activityLegend("LSA Salud")).toEqual({
      active: "Activo: entró a LSA Salud en los últimos 7 días.",
      inactive: "Inactivo: no entró a LSA Salud en los últimos 7 días.",
    });
  });

  it("says one course is enough to be active when every course is shown", () => {
    expect(activityLegend(null)).toEqual({
      active: "Activo: entró a al menos uno de los cursos en los últimos 7 días.",
      inactive: "Inactivo: no entró a ninguno de los cursos en los últimos 7 días.",
    });
  });
});
