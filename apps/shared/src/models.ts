export type SunExposure = "full-sun" | "part-sun" | "part-shade" | "shade";

export type ObservationType =
  | "watering"
  | "feeding"
  | "pruning"
  | "health-check"
  | "repotting"
  | "note";

export interface Garden {
  id: string;
  name: string;
  location: string;
  climateNotes: string;
  plants: Plant[];
}

export interface Plant {
  id: string;
  nickname: string;
  species: string;
  cultivar?: string;
  location: string;
  potSize: string;
  sunExposure: SunExposure;
  notes: string;
  observations: Observation[];
}

export interface Observation {
  id: string;
  plantId: string;
  observedAt: string;
  type: ObservationType;
  summary: string;
  details?: string;
}

export interface CreateObservationInput {
  type: ObservationType;
  summary: string;
  details?: string;
}

export type RecommendationUrgency = "low" | "medium" | "high" | "critical";

export type RecommendationConfidence = "low" | "medium" | "high";

export interface PlantQuestionRequest {
  question: string;
}

export interface RecommendedAction {
  label: string;
  rationale: string;
  timing: string;
  requiresApproval: boolean;
}

export interface RecommendationContextUsed {
  observationsReviewed: number;
  latestObservationDate: string;
}

export interface PlantCareRecommendation {
  plantId: string;
  question: string;
  summary: string;
  urgency: RecommendationUrgency;
  confidence: RecommendationConfidence;
  recommendedActions: RecommendedAction[];
  missingInformation: string[];
  careNotes: string[];
  contextUsed: RecommendationContextUsed;
  generatedBy: "workers-ai" | "openai" | "local-fallback";
}
