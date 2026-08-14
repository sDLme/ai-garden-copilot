import {
  Plant,
  PlantPhotoAnalysis,
  PlantPhotoAnalysisRequest,
  RecommendationConfidence,
  SafetyCheck
} from "../../shared/src";
import { PlantCareCopilotEnvironment } from "./plant-care-copilot.service";

const maxImageBytes = 2_500_000;

interface VisionAiBinding {
  toMarkdown?: (files: Array<{ name: string; blob: Blob }>) => Promise<Array<{ data?: string; text?: string } | string>>;
}

export class PhotoAnalysisService {
  constructor(private readonly environment: PlantCareCopilotEnvironment = {}) {}

  async analyze(plant: Plant, input: PlantPhotoAnalysisRequest): Promise<PlantPhotoAnalysis> {
    const image = parseImageDataUrl(input.imageDataUrl);
    const fileName = input.fileName?.trim() || "plant-photo.jpg";

    if (!image) {
      return this.createFallback(plant, fileName, "The uploaded file could not be read as an image data URL.");
    }

    if (image.bytes.byteLength > maxImageBytes) {
      return this.createFallback(plant, fileName, "The uploaded image is too large for the portfolio demo.");
    }

    const visionAi = this.environment.AI as VisionAiBinding | undefined;

    if (!visionAi?.toMarkdown) {
      return this.createFallback(plant, fileName, "Workers AI vision is not available in this runtime.");
    }

    try {
      const result = await visionAi.toMarkdown([
        {
          name: fileName,
          blob: new Blob([image.bytes], { type: image.mimeType })
        }
      ]);
      const markdown = extractMarkdown(result);

      if (!markdown) {
        return this.createFallback(plant, fileName, "Workers AI vision returned no image description.");
      }

      return {
        plantId: plant.id,
        fileName,
        summary: `Photo analysis for ${plant.nickname}: ${createSnippet(markdown, 240)}`,
        visualSignals: extractSignals(markdown),
        suggestedObservation: {
          type: "health-check",
          summary: `Photo check: ${createSnippet(markdown, 90)}`,
          details: [
            `AI vision notes from ${fileName}: ${markdown}`,
            input.note ? `User note: ${input.note}` : undefined
          ]
            .filter((item): item is string => Boolean(item))
            .join("\n")
        },
        confidence: "medium",
        generatedBy: "workers-ai-vision",
        safetyChecks: createVisionSafetyChecks()
      };
    } catch (error) {
      return this.createFallback(
        plant,
        fileName,
        error instanceof Error ? error.message : "Workers AI vision failed unexpectedly."
      );
    }
  }

  private createFallback(plant: Plant, fileName: string, reason: string): PlantPhotoAnalysis {
    const visualSignals = [
      "Photo received by the app",
      "Human review is required before diagnosing pests, disease, watering stress, or nutrient issues"
    ];

    return {
      plantId: plant.id,
      fileName,
      summary: `Photo workflow is ready for ${plant.nickname}, but live vision analysis is unavailable right now.`,
      visualSignals,
      suggestedObservation: {
        type: "health-check",
        summary: `Photo added for ${plant.nickname}`,
        details: `Vision fallback reason: ${trimTrailingPunctuation(reason)}. Review the photo manually and add visible leaf, bud, pest, soil, and moisture details.`
      },
      confidence: "low",
      generatedBy: "local-fallback",
      safetyChecks: createVisionSafetyChecks()
    };
  }
}

function trimTrailingPunctuation(text: string): string {
  return text.trim().replace(/[.!?]+$/g, "");
}

function parseImageDataUrl(dataUrl: string): { mimeType: string; bytes: Uint8Array } | undefined {
  const match = dataUrl.match(/^data:(image\/(?:png|jpeg|jpg|webp));base64,([A-Za-z0-9+/=]+)$/);

  if (!match) {
    return undefined;
  }

  const mimeType = match[1] === "image/jpg" ? "image/jpeg" : match[1];
  const binary = atob(match[2]);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return { mimeType, bytes };
}

function extractMarkdown(result: Array<{ data?: string; text?: string } | string>): string {
  return result
    .map((item) => {
      if (typeof item === "string") {
        return item;
      }

      return item.data ?? item.text ?? "";
    })
    .join("\n")
    .trim();
}

function extractSignals(markdown: string): string[] {
  const sentences = markdown
    .replace(/[#*_`>-]/g, " ")
    .split(/[.\n]/)
    .map((item) => item.trim())
    .filter((item) => item.length > 12)
    .slice(0, 4);

  return sentences.length ? sentences : ["Image description returned, but no specific visual signals were extracted."];
}

function createSnippet(text: string, maxLength: number): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength - 3)}...` : normalized;
}

function createVisionSafetyChecks(): SafetyCheck[] {
  return [
    {
      id: "vision-not-diagnosis",
      severity: "warning",
      message: "Photo analysis is observational support, not a confirmed plant disease or pest diagnosis."
    },
    {
      id: "human-review-before-save",
      severity: "info",
      message: "Review the suggested observation before saving it to plant history."
    }
  ];
}
