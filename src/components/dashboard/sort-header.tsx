import { Icon } from "@/components/dashboard/icons";
import type { SortDir } from "@/lib/table-sort";
import { cn } from "@/lib/utils";

/**
 * A sortable column header for the panel's grid lists (the same look as Participantes): a button
 * showing ↑/↓ on the active column and a neutral icon on the rest.
 */
export function SortHeader<F extends string>({
  label,
  field,
  sort,
  onSort,
  align = "left",
}: {
  label: string;
  field: F;
  sort: { by: F; dir: SortDir };
  onSort: (field: F) => void;
  align?: "left" | "right";
}) {
  const active = sort.by === field;
  return (
    <span
      role="columnheader"
      aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}
      className={align === "right" ? "text-right" : undefined}
    >
      <button
        type="button"
        title={`Ordenar por ${label.toLowerCase()}`}
        onClick={() => onSort(field)}
        className={cn(
          "hover:text-text inline-flex cursor-pointer items-center gap-1 tracking-wider transition-colors",
          active && "text-text",
          align === "right" && "flex-row-reverse",
        )}
      >
        {label}
        <Icon
          name={active ? (sort.dir === "asc" ? "arrowUp" : "arrowDown") : "sortable"}
          className={cn("size-3.5", !active && "opacity-50")}
        />
      </button>
    </span>
  );
}
