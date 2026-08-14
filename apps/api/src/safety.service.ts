import { Plant, PlantCareRecommendation, SafetyCheck, WeatherContext } from "../../shared/src";

const riskyTreatmentTerms = ["pesticide", "fungicide", "insecticide", "chemical", "spray", "poison"];

export class SafetyService {
  assessQuestion(question: string, plant: Plant, weather: WeatherContext): SafetyCheck[] {
    const normalizedQuestion = question.toLowerCase();
    const checks: SafetyCheck[] = [
      {
        id: "human-approval-for-writes",
        severity: "info",
        message: "Copilot can suggest actions, but garden history writes still require explicit human approval."
      }
    ];

    if (riskyTreatmentTerms.some((term) => normalizedQuestion.includes(term))) {
      checks.push({
        id: "avoid-unsafe-chemical-first-step",
        severity: "warning",
        message: "Chemical treatment should not be recommended as a first step without clear pest or disease evidence."
      });
    }

    if (weather.source === "local-fallback") {
      checks.push({
        id: "weather-unavailable",
        severity: "warning",
        message: "Weather could not be verified live, so recommendations should ask the user to inspect soil moisture."
      });
    }

    if (plant.observations.length === 0) {
      checks.push({
        id: "no-observation-history",
        severity: "warning",
        message: "The plant has no observation history, so the answer should stay cautious and ask for a fresh observation."
      });
    }

    return checks;
  }

  validateRecommendation(recommendation: PlantCareRecommendation): SafetyCheck[] {
    const combinedAdvice = [
      recommendation.summary,
      ...recommendation.careNotes,
      ...recommendation.recommendedActions.flatMap((action) => [action.label, action.rationale])
    ]
      .join(" ")
      .toLowerCase();

    if (!riskyTreatmentTerms.some((term) => combinedAdvice.includes(term))) {
      return [];
    }

    return [
      {
        id: "recommendation-mentions-chemical-treatment",
        severity: "warning",
        message: "Review treatment advice before acting; chemical interventions need clear diagnosis and product-specific instructions."
      }
    ];
  }
}
