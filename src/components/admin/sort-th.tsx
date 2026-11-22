import { Icon } from "@/components/dashboard/icons";
import type { SortDir } from "@/lib/table-sort";
import { cn } from "@/lib/utils";

/**
 * A sortable column header for the back-office tables: a real button (keyboard and screen reader
 * friendly, with `aria-sort` on the cell) showing ↑/↓ on the active column and a neutral icon on
 * the rest.
 */
export function SortTh<F extends string>({
  label,
  field,
  sort,
  onSort,
  align = "left",
  className,
}: {
  label: string;
  field: F;
  sort: { by: F; dir: SortDir };
  onSort: (field: F) => void;
  align?: "left" | "right";
  className?: string;
}) {
  const active = sort.by === field;
  return (
    <th
      aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}
      className={cn(
        "px-5 py-3 font-semibold whitespace-nowrap",
        align === "right" ? "text-right" : "text-left",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => onSort(field)}
        title={`Ordenar por ${label.toLowerCase()}`}
        className={cn(
          "hover:text-text inline-flex cursor-pointer items-center gap-1 transition-colors",
          active ? "text-text" : "text-text-muted",
          align === "right" && "flex-row-reverse",
        )}
      >
        <span>{label}</span>
        <Icon
          name={active ? (sort.dir === "asc" ? "arrowUp" : "arrowDown") : "sortable"}
          className={cn("size-3.5 shrink-0", !active && "opacity-50")}
        />
      </button>
    </th>
  );
}
