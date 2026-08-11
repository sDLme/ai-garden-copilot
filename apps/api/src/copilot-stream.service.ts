import { ApprovalRequest, CopilotStreamEvent, Plant, PlantCareRecommendation } from "../../shared/src";
import { GardenRepository } from "./garden.repository";
import { GardenToolsService } from "./garden-tools.service";
import { GardenKnowledgeService } from "./garden-knowledge.service";
import { PlantCareCopilotService, PlantCareCopilotEnvironment } from "./plant-care-copilot.service";

export class CopilotStreamService {
  constructor(
    private readonly repository: GardenRepository,
    private readonly gardenTools: GardenToolsService,
    private readonly environment: PlantCareCopilotEnvironment
  ) {}

  streamPlantRecommendation(plantId: string, question: string, conversationId?: string): Response {
    const stream = new ReadableStream<Uint8Array>({
      start: async (controller) => {
        const writer = new SseWriter(controller);
        const activeConversationId = conversationId?.trim() || `conversation-${crypto.randomUUID()}`;

        try {
          await writer.send({ type: "conversation-started", conversationId: activeConversationId });

          const listPlantsCall = this.gardenTools.createToolCall("listPlants", {});
          await writer.send({ type: "tool-call", toolCall: listPlantsCall });
          const plants = this.gardenTools.listPlants();
          await writer.send({
            type: "tool-result",
            result: {
              toolCallId: listPlantsCall.id,
              summary: `Found ${plants.length} tracked plants.`
            }
          });

          const getPlantCall = this.gardenTools.createToolCall("getPlant", { plantId });
          await writer.send({ type: "tool-call", toolCall: getPlantCall });
          const plant = this.gardenTools.getPlant(plantId);

          if (!plant) {
            await writer.send({ type: "error", message: "Plant not found" });
            return;
          }

          await writer.send({
            type: "tool-result",
            result: {
              toolCallId: getPlantCall.id,
              summary: `Loaded ${plant.nickname} with ${plant.observations.length} observations.`
            }
          });

          const retrieveKnowledgeCall = this.gardenTools.createToolCall("retrieveKnowledge", {
            plantId,
            question
          });
          await writer.send({ type: "tool-call", toolCall: retrieveKnowledgeCall });
          const knowledgeContext = await new GardenKnowledgeService(this.environment).retrieve(question, plant);
          await writer.send({
            type: "tool-result",
            result: {
              toolCallId: retrieveKnowledgeCall.id,
              summary: `Retrieved ${knowledgeContext.length} trusted garden knowledge sources.`
            }
          });

          const recommendation = await new PlantCareCopilotService(this.environment).recommend(plant, question, knowledgeContext);
          await writer.send({ type: "recommendation", recommendation });

          const approval = this.maybeCreateApprovalRequest(plant, question, recommendation);

          if (approval) {
            await writer.send({ type: "approval-request", approval });
          }

          await writer.send({ type: "done", conversationId: activeConversationId });
        } catch (error) {
          await writer.send({
            type: "error",
            message: error instanceof Error ? error.message : "Unexpected streaming error"
          });
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive"
      }
    });
  }

  private maybeCreateApprovalRequest(
    plant: Plant,
    question: string,
    recommendation: PlantCareRecommendation
  ): ApprovalRequest | undefined {
    const questionLower = question.toLowerCase();
    const shouldOfferObservation =
      questionLower.includes("water") ||
      recommendation.missingInformation.some((item) => item.toLowerCase().includes("soil moisture"));

    if (!shouldOfferObservation) {
      return undefined;
    }

    return this.gardenTools.createObservationApproval(
      plant.id,
      {
        type: "health-check",
        summary: `Checked ${plant.nickname} after Copilot watering question`,
        details: `Human-approved follow-up from conversation about: ${question}`
      },
      "Save follow-up observation",
      `Copilot can save a health-check note for ${plant.nickname}, but only after approval.`
    );
  }
}

class SseWriter {
  private readonly encoder = new TextEncoder();

  constructor(private readonly controller: ReadableStreamDefaultController<Uint8Array>) {}

  async send(event: CopilotStreamEvent): Promise<void> {
    this.controller.enqueue(this.encoder.encode(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`));
    await new Promise((resolve) => setTimeout(resolve, 120));
  }
}
