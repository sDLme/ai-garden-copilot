import { Plant, PlantCareRecommendation } from "../../shared/src";
import { buildPlantCareInput, plantCareSystemInstructions } from "./plant-context.prompt";
import { plantCareRecommendationSchema } from "./plant-care-recommendation.schema";

const openAiResponsesUrl = "https://api.openai.com/v1/responses";
const fallbackModel = "gpt-5-mini";

export interface PlantCareCopilotEnvironment {
  OPENAI_API_KEY?: string;
  OPENAI_MODEL?: string;
}

export class PlantCareCopilotService {
  constructor(private readonly environment: PlantCareCopilotEnvironment = process.env) {}

  async recommend(plant: Plant, question: string): Promise<PlantCareRecommendation> {
    const normalizedQuestion = question.trim();
    const apiKey = this.environment.OPENAI_API_KEY;

    if (!apiKey) {
      return this.createLocalFallback(plant, normalizedQuestion);
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

  private createLocalFallback(plant: Plant, question: string): PlantCareRecommendation {
    const latestObservation = plant.observations[0];

    return {
      plantId: plant.id,
      question,
      summary: `I can prepare a structured recommendation for ${plant.nickname}, but live AI is not enabled because OPENAI_API_KEY is not set.`,
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
      missingInformation: ["Live OpenAI API key", "Current soil moisture", "Current leaf and bud condition"],
      careNotes: [
        "This is a local fallback response, not a model-generated recommendation.",
        "Set OPENAI_API_KEY on the backend to enable the real structured LLM workflow."
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
