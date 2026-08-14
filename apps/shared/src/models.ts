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
  conversationId?: string;
}

export interface RecommendedAction {
  label: string;
  rationale: string;
  timing: string;
  requiresApproval: boolean;
}

export type KnowledgeSourceType = "project-note" | "care-principle" | "safety-guideline";

export interface KnowledgeSource {
  id: string;
  title: string;
  sourceType: KnowledgeSourceType;
  url?: string;
}

export interface KnowledgeContext {
  sourceId: string;
  title: string;
  excerpt: string;
  relevanceScore: number;
}

export interface WeatherContext {
  location: string;
  observedAt: string;
  temperatureC: number | null;
  relativeHumidity: number | null;
  precipitationMm: number | null;
  windGustKmh: number | null;
  precipitationProbabilityMax: number | null;
  source: "open-meteo" | "local-fallback";
  summary: string;
}

export type SafetySeverity = "info" | "warning" | "blocked";

export interface SafetyCheck {
  id: string;
  severity: SafetySeverity;
  message: string;
}

export interface RecommendationContextUsed {
  observationsReviewed: number;
  latestObservationDate: string;
  knowledgeSourcesReviewed: number;
  sources: KnowledgeContext[];
  weather?: WeatherContext;
  safetyChecks: SafetyCheck[];
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

export type GardenToolName =
  | "listPlants"
  | "getPlant"
  | "retrieveKnowledge"
  | "getWeather"
  | "runSafetyCheck"
  | "saveObservation";

export interface GardenToolCall {
  id: string;
  name: GardenToolName;
  status: "running" | "completed" | "failed";
  input: Record<string, unknown>;
}

export interface GardenToolResult {
  toolCallId: string;
  summary: string;
}

export interface ApprovalRequest {
  id: string;
  plantId: string;
  action: "saveObservation";
  label: string;
  description: string;
  input: CreateObservationInput;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

export interface ApprovalDecisionResponse {
  approval: ApprovalRequest;
  observation?: Observation;
}

export type CopilotStreamEvent =
  | {
      type: "conversation-started";
      conversationId: string;
    }
  | {
      type: "tool-call";
      toolCall: GardenToolCall;
    }
  | {
      type: "tool-result";
      result: GardenToolResult;
    }
  | {
      type: "recommendation";
      recommendation: PlantCareRecommendation;
    }
  | {
      type: "approval-request";
      approval: ApprovalRequest;
    }
  | {
      type: "done";
      conversationId: string;
    }
  | {
      type: "error";
      message: string;
    };
