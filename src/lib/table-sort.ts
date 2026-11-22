/** Sorting for the panel's tables: one rule for every column header. */

export type SortDir = "asc" | "desc";

/** A sort key: text compares A→Z ignoring case and accents; null always goes last. */
export type SortValue = string | number | null | undefined;

const collator = new Intl.Collator("es", { sensitivity: "base", numeric: true });

function compareValues(a: SortValue, b: SortValue): number {
  const aMissing = a === null || a === undefined || a === "";
  const bMissing = b === null || b === undefined || b === "";
  if (aMissing || bMissing) return aMissing === bMissing ? 0 : aMissing ? 1 : -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return collator.compare(String(a), String(b));
}

/**
 * Rows sorted by `key` (a column's accessor), `dir` asc or desc; missing values last either way,
 * ties keep their order. Does not touch the list it gets.
 */
export function sortRows<T>(rows: readonly T[], key: (row: T) => SortValue, dir: SortDir): T[] {
  const sign = dir === "asc" ? 1 : -1;
  return rows
    .map((row, i) => ({ row, i, k: key(row) }))
    .sort((x, y) => {
      const missing =
        (x.k === null || x.k === undefined || x.k === "") !==
        (y.k === null || y.k === undefined || y.k === "");
      const c = compareValues(x.k, y.k);
      return (missing ? c : sign * c) || x.i - y.i;
    })
    .map((x) => x.row);
}

/** Clicking a header: the same column flips; a new one starts in its natural direction. */
export function nextSort<F extends string>(
  current: { by: F; dir: SortDir },
  field: F,
  firstDir: SortDir,
): { by: F; dir: SortDir } {
  return current.by === field
    ? { by: field, dir: current.dir === "asc" ? "desc" : "asc" }
    : { by: field, dir: firstDir };
}
