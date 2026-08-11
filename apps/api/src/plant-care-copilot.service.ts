import { Plant, PlantCareRecommendation } from "../../shared/src";
import { buildPlantCareInput, plantCareSystemInstructions } from "./plant-context.prompt";
import { plantCareRecommendationSchema } from "./plant-care-recommendation.schema";

const openAiResponsesUrl = "https://api.openai.com/v1/responses";
const fallbackModel = "gpt-5-mini";
const fallbackWorkersAiModel = "@cf/meta/llama-3.1-8b-instruct-fast";

interface WorkersAiBinding {
  run(model: string, input: WorkersAiTextGenerationInput): Promise<WorkersAiTextGenerationResponse>;
}

export interface PlantCareCopilotEnvironment {
  AI?: WorkersAiBinding;
  CLOUDFLARE_AI_MODEL?: string;
  OPENAI_API_KEY?: string;
  OPENAI_MODEL?: string;
}

export class PlantCareCopilotService {
  constructor(private readonly environment: PlantCareCopilotEnvironment = process.env) {}

  async recommend(plant: Plant, question: string): Promise<PlantCareRecommendation> {
    const normalizedQuestion = question.trim();
    const workersAi = this.environment.AI;
    const apiKey = this.environment.OPENAI_API_KEY;

    if (workersAi) {
      try {
        return await this.recommendWithWorkersAi(workersAi, plant, normalizedQuestion);
      } catch (error) {
        console.warn("Workers AI recommendation failed", error);
        return this.createLocalFallback(plant, normalizedQuestion, "Workers AI is unavailable or the free daily quota was reached.");
      }
    }

    if (!apiKey) {
      return this.createLocalFallback(plant, normalizedQuestion, "No live AI provider is configured.");
    }

    const response = await fetch(openAiResponsesUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: this.environment.OPENAI_MODEL ?? fallbackModel,
        input: [
          {
            role: "system",
            content: plantCareSystemInstructions
          },
          {
            role: "user",
            content: buildPlantCareInput(plant, normalizedQuestion)
          }
        ],
        text: {
          format: {
            type: "json_schema",
            name: "plant_care_recommendation",
            strict: true,
            schema: plantCareRecommendationSchema
          }
        }
      })
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(`OpenAI request failed: ${response.status} ${message}`);
    }

    const payload = (await response.json()) as OpenAiResponsePayload;
    const outputText = extractOutputText(payload);

    if (!outputText) {
      throw new Error("OpenAI response did not include structured output text");
    }

    return {
      ...parseRecommendation(outputText),
      generatedBy: "openai"
    };
  }

  private async recommendWithWorkersAi(
    workersAi: WorkersAiBinding,
    plant: Plant,
    question: string
  ): Promise<PlantCareRecommendation> {
    const response = await workersAi.run(this.environment.CLOUDFLARE_AI_MODEL ?? fallbackWorkersAiModel, {
      messages: [
        {
          role: "system",
          content: [
            plantCareSystemInstructions,
            "Return only valid JSON. Do not wrap the response in markdown.",
            "Use string confidence values only: low, medium, or high.",
            "Every recommended action must include label, rationale, timing, and requiresApproval."
          ].join(" ")
        },
        {
          role: "user",
          content: buildPlantCareInput(plant, question)
        }
      ],
      max_tokens: 700,
      temperature: 0.2,
      response_format: {
        type: "json_schema",
        json_schema: plantCareRecommendationSchema
      }
    });

    const outputText = extractWorkersAiText(response);

    if (!outputText) {
      throw new Error("Workers AI response did not include text output");
    }

    return {
      ...parseWorkersAiRecommendation(outputText, plant, question),
      generatedBy: "workers-ai"
    };
  }

  private createLocalFallback(plant: Plant, question: string, reason: string): PlantCareRecommendation {
    const latestObservation = plant.observations[0];

    return {
      plantId: plant.id,
      question,
      summary: `I can prepare a structured recommendation for ${plant.nickname}, but live AI is not available right now.`,
      urgency: "medium",
      confidence: "low",
      recommendedActions: [
        {
          label: "Review the latest observation before taking action",
          rationale: latestObservation
            ? `The most recent note says: ${latestObservation.summary}`
            : "There are no observations yet, so the first step is to inspect the plant.",
          timing: "Today",
          requiresApproval: false
        },
        {
          label: "Add any missing symptoms or soil moisture details",
          rationale: "Phase 2 recommendations work best when the selected plant context is specific.",
          timing: "Before relying on care advice",
          requiresApproval: false
        }
      ],
      missingInformation: [reason, "Current soil moisture", "Current leaf and bud condition"],
      careNotes: [
        "This is a local fallback response, not a model-generated recommendation.",
        "The deployed app can use Cloudflare Workers AI when the free daily allocation is available."
      ],
      contextUsed: {
        observationsReviewed: plant.observations.length,
        latestObservationDate: latestObservation?.observedAt ?? ""
      },
      generatedBy: "local-fallback"
    };
  }
}

interface OpenAiResponsePayload {
  output?: Array<{
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
}

interface WorkersAiTextGenerationInput {
  messages: Array<{
    role: "system" | "user";
    content: string;
  }>;
  max_tokens: number;
  temperature: number;
  response_format: {
    type: "json_schema";
    json_schema: typeof plantCareRecommendationSchema;
  };
}

interface WorkersAiTextGenerationResponse {
  response?: unknown;
  result?: {
    response?: unknown;
  };
}

function extractOutputText(payload: OpenAiResponsePayload): string | undefined {
  for (const item of payload.output ?? []) {
    for (const content of item.content ?? []) {
      if (content.type === "output_text" && content.text) {
        return content.text;
      }
    }
  }

  return undefined;
}

function parseRecommendation(outputText: string): Omit<PlantCareRecommendation, "generatedBy"> {
  return JSON.parse(outputText) as Omit<PlantCareRecommendation, "generatedBy">;
}

function parseWorkersAiRecommendation(outputText: string, plant: Plant, question: string): Omit<PlantCareRecommendation, "generatedBy"> {
  try {
    return parseRecommendation(stripJsonFence(outputText));
  } catch {
    const jsonCandidate = extractFirstJsonObject(outputText);

    if (jsonCandidate) {
      try {
        return normalizeWorkersAiRecommendation(JSON.parse(jsonCandidate), plant, question);
      } catch {
        return createStructuredRecommendationFromWorkersAiText(outputText, plant, question);
      }
    }

    return createStructuredRecommendationFromWorkersAiText(outputText, plant, question);
  }
}

function extractWorkersAiText(payload: WorkersAiTextGenerationResponse): string | undefined {
  return normalizeWorkersAiText(payload.response) ?? normalizeWorkersAiText(payload.result?.response);
}

function stripJsonFence(outputText: string): string {
  return outputText
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "");
}

function normalizeWorkersAiText(value: unknown): string | undefined {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    const text = value
      .map((item) => normalizeWorkersAiText(item))
      .filter((item): item is string => Boolean(item))
      .join("");

    return text || undefined;
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return (
      normalizeWorkersAiText(record["text"]) ??
      normalizeWorkersAiText(record["content"]) ??
      normalizeWorkersAiText(record["response"])
    );
  }

  return undefined;
}

function createStructuredRecommendationFromWorkersAiText(
  outputText: string,
  plant: Plant,
  question: string
): Omit<PlantCareRecommendation, "generatedBy"> {
  const latestObservation = plant.observations[0];

  return {
    plantId: plant.id,
    question,
    summary: outputText.trim(),
    urgency: "medium",
    confidence: "medium",
    recommendedActions: [
      {
        label: "Use the Workers AI recommendation as guidance",
        rationale: outputText.trim(),
        timing: "Today",
        requiresApproval: false
      },
      {
        label: "Add a fresh observation before acting",
        rationale: "The free model response is wrapped into a structured format, so current soil moisture and leaf condition should still be checked by the user.",
        timing: "Before watering, feeding, or pruning",
        requiresApproval: false
      }
    ],
    missingInformation: ["Current soil moisture", "Current leaf and bud condition"],
    careNotes: [
      "Workers AI returned natural language, so the backend normalized it into the app's structured recommendation format.",
      "A stricter schema-backed provider can be added later for higher reliability."
    ],
    contextUsed: {
      observationsReviewed: plant.observations.length,
      latestObservationDate: latestObservation?.observedAt ?? ""
    }
  };
}

function extractFirstJsonObject(outputText: string): string | undefined {
  const fencedJson = outputText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/i);

  if (fencedJson?.[1]) {
    return fencedJson[1];
  }

  const firstBrace = outputText.indexOf("{");
  const lastBrace = outputText.lastIndexOf("}");

  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return outputText.slice(firstBrace, lastBrace + 1);
  }

  return undefined;
}

function normalizeWorkersAiRecommendation(
  value: unknown,
  plant: Plant,
  question: string
): Omit<PlantCareRecommendation, "generatedBy"> {
  const record = isRecord(value) ? value : {};
  const latestObservation = plant.observations[0];

  const actions = normalizeActions(record["recommendedActions"]);
  const missingInformation = normalizeStringList(record["missingInformation"]);
  const careNotes = normalizeStringList(record["careNotes"]);

  return {
    plantId: getString(record["plantId"], plant.id),
    question: getString(record["question"], question),
    summary: getString(record["summary"], `Workers AI prepared a recommendation for ${plant.nickname}.`),
    urgency: normalizeUrgency(record["urgency"]),
    confidence: normalizeConfidence(record["confidence"]),
    recommendedActions: actions.length ? actions : createDefaultActions(plant),
    missingInformation: missingInformation.length
      ? missingInformation
      : ["Current soil moisture", "Current leaf and bud condition"],
    careNotes: careNotes.length
      ? careNotes
      : ["Workers AI response was normalized into the app's structured recommendation format."],
    contextUsed: {
      observationsReviewed: plant.observations.length,
      latestObservationDate: latestObservation?.observedAt ?? ""
    }
  };
}

function createDefaultActions(plant: Plant): PlantCareRecommendation["recommendedActions"] {
  const latestObservation = plant.observations[0];

  return [
    {
      label: "Check the soil before watering",
      rationale: latestObservation
        ? `The latest observation says: ${latestObservation.summary}`
        : "There is no recent observation, so soil moisture should be checked first.",
      timing: "Today",
      requiresApproval: false
    },
    {
      label: "Add a fresh observation",
      rationale: "Current context makes future recommendations more reliable.",
      timing: "After inspection",
      requiresApproval: false
    }
  ];
}

function normalizeActions(value: unknown): PlantCareRecommendation["recommendedActions"] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item, index) => {
    if (isRecord(item)) {
      return {
        label: getString(item["label"], `Action ${index + 1}`),
        rationale: getString(item["rationale"], "Suggested by Workers AI based on the selected plant context."),
        timing: getString(item["timing"], "Today"),
        requiresApproval: item["requiresApproval"] === true
      };
    }

    return {
      label: getString(item, `Action ${index + 1}`),
      rationale: "Suggested by Workers AI based on the selected plant context.",
      timing: "Today",
      requiresApproval: false
    };
  });
}

function normalizeStringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => getString(item, "")).filter(Boolean);
  }

  const item = getString(value, "");
  return item ? [item] : [];
}

function normalizeUrgency(value: unknown): PlantCareRecommendation["urgency"] {
  return value === "low" || value === "medium" || value === "high" || value === "critical" ? value : "medium";
}

function normalizeConfidence(value: unknown): PlantCareRecommendation["confidence"] {
  if (value === "low" || value === "medium" || value === "high") {
    return value;
  }

  if (typeof value === "number") {
    if (value >= 0.75) {
      return "high";
    }

    if (value >= 0.4) {
      return "medium";
    }
  }

  return "low";
}

function getString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
