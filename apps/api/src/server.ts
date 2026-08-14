import { createServer, IncomingMessage, ServerResponse } from "node:http";
import { GardenRepository } from "./garden.repository";
import { CreateObservationInput, ObservationType, PlantPhotoAnalysisRequest, PlantQuestionRequest } from "../../shared/src";
import { PlantCareCopilotService } from "./plant-care-copilot.service";
import { GardenToolsService } from "./garden-tools.service";
import { CopilotStreamService } from "./copilot-stream.service";
import { GardenMcpService, getMcpMetadata } from "./mcp.service";
import { GardenKnowledgeService } from "./garden-knowledge.service";
import { SafetyService } from "./safety.service";
import { WeatherService } from "./weather.service";
import { PhotoAnalysisService } from "./photo-analysis.service";

const port = Number(process.env["PORT"] ?? 3333);
const repository = new GardenRepository();
const gardenTools = new GardenToolsService(repository);
const copilotService = new PlantCareCopilotService();

const observationTypes = new Set<ObservationType>([
  "watering",
  "feeding",
  "pruning",
  "health-check",
  "repotting",
  "note"
]);

const server = createServer(async (request, response) => {
  setCorsHeaders(response);

  if (request.method === "OPTIONS") {
    response.writeHead(204);
    response.end();
    return;
  }

  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);

  try {
    if (request.method === "GET" && url.pathname === "/api/garden") {
      sendJson(response, 200, repository.getGarden());
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/plants") {
      sendJson(response, 200, repository.listPlants());
      return;
    }

    if (request.method === "GET" && url.pathname === "/mcp") {
      sendJson(response, 200, getMcpMetadata());
      return;
    }

    if (request.method === "POST" && url.pathname === "/mcp") {
      const body = await readJson<Parameters<GardenMcpService["handle"]>[0]>(request);
      const result = await new GardenMcpService(repository, process.env).handle(body);
      sendJson(response, 200, result);
      return;
    }

    const plantMatch = url.pathname.match(/^\/api\/plants\/([^/]+)$/);
    if (request.method === "GET" && plantMatch) {
      const plant = repository.getPlant(decodeURIComponent(plantMatch[1]));

      if (!plant) {
        sendJson(response, 404, { message: "Plant not found" });
        return;
      }

      sendJson(response, 200, plant);
      return;
    }

    const observationMatch = url.pathname.match(/^\/api\/plants\/([^/]+)\/observations$/);
    if (request.method === "POST" && observationMatch) {
      const body = await readJson<CreateObservationInput>(request);

      if (!body.summary?.trim() || !observationTypes.has(body.type)) {
        sendJson(response, 400, { message: "Observation type and summary are required" });
        return;
      }

      const observation = repository.addObservation(decodeURIComponent(observationMatch[1]), body);

      if (!observation) {
        sendJson(response, 404, { message: "Plant not found" });
        return;
      }

      sendJson(response, 201, observation);
      return;
    }

    const photoAnalysisMatch = url.pathname.match(/^\/api\/plants\/([^/]+)\/photo-analysis$/);
    if (request.method === "POST" && photoAnalysisMatch) {
      const plant = repository.getPlant(decodeURIComponent(photoAnalysisMatch[1]));

      if (!plant) {
        sendJson(response, 404, { message: "Plant not found" });
        return;
      }

      const body = await readJson<PlantPhotoAnalysisRequest>(request);

      if (!body.imageDataUrl?.trim()) {
        sendJson(response, 400, { message: "Image data URL is required" });
        return;
      }

      const analysis = await new PhotoAnalysisService(process.env).analyze(plant, body);
      sendJson(response, 200, analysis);
      return;
    }

    const recommendationMatch = url.pathname.match(/^\/api\/plants\/([^/]+)\/recommendations$/);
    if (request.method === "POST" && recommendationMatch) {
      const plantId = decodeURIComponent(recommendationMatch[1]);
      const plant = repository.getPlant(plantId);

      if (!plant) {
        sendJson(response, 404, { message: "Plant not found" });
        return;
      }

      const body = await readJson<PlantQuestionRequest>(request);

      if (!body.question?.trim()) {
        sendJson(response, 400, { message: "Question is required" });
        return;
      }

      const knowledgeContext = await new GardenKnowledgeService(process.env).retrieve(body.question, plant);
      const weatherContext = await new WeatherService().getGardenWeather(repository.getGarden());
      const safetyService = new SafetyService();
      const safetyChecks = safetyService.assessQuestion(body.question, plant, weatherContext);
      const recommendation = await copilotService.recommend(plant, body.question, knowledgeContext, weatherContext, safetyChecks);
      const postRecommendationSafetyChecks = safetyService.validateRecommendation(recommendation);

      if (postRecommendationSafetyChecks.length) {
        recommendation.contextUsed.safetyChecks = [
          ...recommendation.contextUsed.safetyChecks,
          ...postRecommendationSafetyChecks
        ];
      }

      sendJson(response, 200, recommendation);
      return;
    }

    const recommendationStreamMatch = url.pathname.match(/^\/api\/plants\/([^/]+)\/recommendations\/stream$/);
    if (request.method === "POST" && recommendationStreamMatch) {
      const body = await readJson<PlantQuestionRequest>(request);

      if (!body.question?.trim()) {
        sendJson(response, 400, { message: "Question is required" });
        return;
      }

      const streamResponse = new CopilotStreamService(repository, gardenTools, process.env).streamPlantRecommendation(
        decodeURIComponent(recommendationStreamMatch[1]),
        body.question,
        body.conversationId
      );

      await sendWebResponse(response, streamResponse);
      return;
    }

    const approveMatch = url.pathname.match(/^\/api\/approvals\/([^/]+)\/approve$/);
    if (request.method === "POST" && approveMatch) {
      const result = gardenTools.approve(decodeURIComponent(approveMatch[1]));

      if (!result) {
        sendJson(response, 404, { message: "Approval not found or no longer pending" });
        return;
      }

      sendJson(response, 200, result);
      return;
    }

    const rejectMatch = url.pathname.match(/^\/api\/approvals\/([^/]+)\/reject$/);
    if (request.method === "POST" && rejectMatch) {
      const result = gardenTools.reject(decodeURIComponent(rejectMatch[1]));

      if (!result) {
        sendJson(response, 404, { message: "Approval not found or no longer pending" });
        return;
      }

      sendJson(response, 200, result);
      return;
    }

    sendJson(response, 404, { message: "Route not found" });
  } catch (error) {
    sendJson(response, 500, {
      message: "Unexpected API error",
      detail: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

server.listen(port, () => {
  console.log(`AI Garden API listening on http://localhost:${port}`);
});

function setCorsHeaders(response: ServerResponse): void {
  response.setHeader("Access-Control-Allow-Origin", "http://localhost:4200");
  response.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function sendJson(response: ServerResponse, status: number, payload: unknown): void {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload));
}

async function sendWebResponse(response: ServerResponse, webResponse: Response): Promise<void> {
  webResponse.headers.forEach((value, key) => {
    response.setHeader(key, value);
  });

  response.writeHead(webResponse.status);

  if (!webResponse.body) {
    response.end();
    return;
  }

  const reader = webResponse.body.getReader();

  for (;;) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    response.write(value);
  }

  response.end();
}

async function readJson<T>(request: IncomingMessage): Promise<T> {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8")) as T;
}
