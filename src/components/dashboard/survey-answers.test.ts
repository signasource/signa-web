import { describe, expect, it } from "vitest";
import { surveyBars } from "@/components/dashboard/survey-answers";

describe("surveyBars", () => {
  it("labels every option like the app does and greys out the missing answers", () => {
    expect(
      surveyBars([
        { key: "FROM_18_TO_24", count: 3 },
        { key: "NOVICE", count: 2 },
        { key: "INCLUSION", count: 1 },
        { key: "NO_ANSWER", count: 4 },
      ]),
    ).toEqual([
      { label: "18 a 24", tick: "18–24", value: 3, muted: false },
      { label: "Nunca lo vi", tick: "Nunca lo vi", value: 2, muted: false },
      { label: "Inclusión y empatía", tick: "Inclusión y empatía", value: 1, muted: false },
      { label: "Sin respuesta", tick: "Sin resp.", value: 4, muted: true },
    ]);
  });

  it("keeps an unknown option visible under its key", () => {
    expect(surveyBars([{ key: "NEW_OPTION", count: 1 }])).toEqual([
      { label: "NEW_OPTION", tick: "NEW_OPTION", value: 1, muted: false },
    ]);
  });
});
