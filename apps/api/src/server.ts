import { createServer, IncomingMessage, ServerResponse } from "node:http";
import { GardenRepository } from "./garden.repository";
import { CreateObservationInput, ObservationType, PlantQuestionRequest } from "../../shared/src";
import { PlantCareCopilotService } from "./plant-care-copilot.service";

const port = Number(process.env["PORT"] ?? 3333);
const repository = new GardenRepository();
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

      const recommendation = await copilotService.recommend(plant, body.question);
      sendJson(response, 200, recommendation);
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

async function readJson<T>(request: IncomingMessage): Promise<T> {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8")) as T;
}
