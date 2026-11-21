/**
 * Participant states in the organization panel. In the list a person is only active or inactive:
 * whether they entered the selected course in the last 7 days — with every course selected,
 * entering any of them is enough, and inactive means none.
 */

/** What "Activo" / "Inactivo" mean, for the selected course or for every course. */
export function activityLegend(courseName: string | null): { active: string; inactive: string } {
  if (courseName) {
    return {
      active: `Activo: entró a ${courseName} en los últimos 7 días.`,
      inactive: `Inactivo: no entró a ${courseName} en los últimos 7 días.`,
    };
  }
  return {
    active: "Activo: entró a al menos uno de los cursos en los últimos 7 días.",
    inactive: "Inactivo: no entró a ninguno de los cursos en los últimos 7 días.",
  };
}
