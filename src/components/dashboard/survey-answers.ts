import type { SurveyBar } from "@/components/dashboard/survey-bar-chart";
import type { SurveyAnswer } from "@/lib/api/metrics";

/** Labels of the onboarding-survey options, as the app shows them (`signa-mobile` onboarding). */
const LABELS: Record<string, string> = {
  UNDER_18: "Menos de 18",
  FROM_18_TO_24: "18 a 24",
  FROM_25_TO_34: "25 a 34",
  FROM_35_TO_44: "35 a 44",
  FROM_45_TO_54: "45 a 54",
  FROM_55: "55 o más",
  NOVICE: "Nunca lo vi",
  SOME: "Algo sé",
  FLUENT: "Ya lo uso",
  FAMILY: "Familia y amigos",
  WORK: "Trabajo o estudio",
  CURIOSITY: "Solo quiero aprender",
  INCLUSION: "Inclusión y empatía",
  NO_ANSWER: "Sin respuesta",
};

/** Short axis labels for the age columns, so seven of them fit a phone. */
const TICKS: Record<string, string> = {
  UNDER_18: "< 18",
  FROM_18_TO_24: "18–24",
  FROM_25_TO_34: "25–34",
  FROM_35_TO_44: "35–44",
  FROM_45_TO_54: "45–54",
  FROM_55: "55+",
  NO_ANSWER: "Sin resp.",
};

/**
 * The API's answers as chart bars, in the API's order (the options' natural order, then "Sin
 * respuesta", greyed out). An unknown option keeps its key as the label.
 */
export function surveyBars(answers: SurveyAnswer[]): SurveyBar[] {
  return answers.map((a) => ({
    label: LABELS[a.key] ?? a.key,
    tick: TICKS[a.key] ?? LABELS[a.key] ?? a.key,
    value: a.count,
    muted: a.key === "NO_ANSWER",
  }));
}
