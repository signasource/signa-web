import type { CatalogCourse } from "@/lib/api/types";

/** The signs a purchasable course teaches, by module, so the admin can check they fit. */
export function CourseSigns({ course }: { course: CatalogCourse }) {
  if (course.modules.length === 0) {
    return (
      <p className="text-text-muted text-sm">Este curso todavía no tiene señas para mostrar.</p>
    );
  }
  return (
    <div className="flex max-h-96 flex-col gap-4 overflow-y-auto pr-1">
      {course.modules.map((module, index) => (
        <section key={`${index}-${module.title}`} aria-label={module.title}>
          <h3 className="mb-2 flex items-baseline justify-between gap-2 text-sm font-bold">
            <span>{module.title}</span>
            <span className="text-text-muted text-xs font-semibold">
              {module.signs.length} {module.signs.length === 1 ? "seña" : "señas"}
            </span>
          </h3>
          <ul className="flex flex-wrap gap-1.5">
            {module.signs.map((sign) => (
              <li
                key={sign}
                className="bg-fill text-text rounded-full px-2.5 py-1 text-[13px] font-semibold"
              >
                {sign}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
