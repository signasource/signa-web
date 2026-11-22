import { describe, expect, it } from "vitest";
import { nextSort, sortRows } from "@/lib/table-sort";

describe("sortRows", () => {
  const rows = [
    { name: "Ñandú", n: 3, d: "2026-11-02" },
    { name: "ana", n: 10, d: null },
    { name: "Álvaro", n: 2, d: "2026-11-05" },
    { name: "bruno", n: null, d: "2026-10-01" },
  ];

  it("sorts text A→Z ignoring case and accents, and back", () => {
    expect(sortRows(rows, (r) => r.name, "asc").map((r) => r.name)).toEqual([
      "Álvaro",
      "ana",
      "bruno",
      "Ñandú",
    ]);
    expect(sortRows(rows, (r) => r.name, "desc").map((r) => r.name)[0]).toBe("Ñandú");
  });

  it("sorts numbers as numbers, with missing values last both ways", () => {
    expect(sortRows(rows, (r) => r.n, "asc").map((r) => r.n)).toEqual([2, 3, 10, null]);
    expect(sortRows(rows, (r) => r.n, "desc").map((r) => r.n)).toEqual([10, 3, 2, null]);
  });

  it("sorts ISO dates, missing last, and keeps ties in their order", () => {
    expect(sortRows(rows, (r) => r.d, "desc").map((r) => r.d)).toEqual([
      "2026-11-05",
      "2026-11-02",
      "2026-10-01",
      null,
    ]);
    const tied = [
      { id: 1, k: "x" },
      { id: 2, k: "x" },
    ];
    expect(sortRows(tied, (r) => r.k, "desc").map((r) => r.id)).toEqual([1, 2]);
  });

  it("does not touch the list it gets", () => {
    const copy = [...rows];
    sortRows(rows, (r) => r.name, "asc");
    expect(rows).toEqual(copy);
  });
});

describe("nextSort", () => {
  it("flips the same column and starts a new one in its natural direction", () => {
    expect(nextSort({ by: "name", dir: "asc" }, "name", "asc")).toEqual({
      by: "name",
      dir: "desc",
    });
    expect(nextSort({ by: "name", dir: "asc" }, "date", "desc")).toEqual({
      by: "date",
      dir: "desc",
    });
  });
});
