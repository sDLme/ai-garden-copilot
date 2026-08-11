import { GardenRepository } from "./garden.repository";
import { CreateObservationInput, ObservationType, PlantQuestionRequest } from "../../shared/src";
import { PlantCareCopilotService, PlantCareCopilotEnvironment } from "./plant-care-copilot.service";

interface WorkerEnvironment extends PlantCareCopilotEnvironment {
  ALLOWED_ORIGIN?: string;
}

const repository = new GardenRepository();

const observationTypes = new Set<ObservationType>([
  "watering",
  "feeding",
  "pruning",
  "health-check",
  "repotting",
  "note"
]);

export default {
  async fetch(request: Request, env: WorkerEnvironment): Promise<Response> {
    const corsHeaders = createCorsHeaders(request, env);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const url = new URL(request.url);

    try {
      if (request.method === "GET" && url.pathname === "/api/garden") {
        return jsonResponse(repository.getGarden(), 200, corsHeaders);
      }

      if (request.method === "GET" && url.pathname === "/api/plants") {
        return jsonResponse(repository.listPlants(), 200, corsHeaders);
      }

      const plantMatch = url.pathname.match(/^\/api\/plants\/([^/]+)$/);
      if (request.method === "GET" && plantMatch) {
        const plant = repository.getPlant(decodeURIComponent(plantMatch[1]));

        if (!plant) {
          return jsonResponse({ message: "Plant not found" }, 404, corsHeaders);
        }

        return jsonResponse(plant, 200, corsHeaders);
      }

      const observationMatch = url.pathname.match(/^\/api\/plants\/([^/]+)\/observations$/);
      if (request.method === "POST" && observationMatch) {
        const body = await readJson<CreateObservationInput>(request);

        if (!body.summary?.trim() || !observationTypes.has(body.type)) {
          return jsonResponse({ message: "Observation type and summary are required" }, 400, corsHeaders);
        }

        const observation = repository.addObservation(decodeURIComponent(observationMatch[1]), body);

        if (!observation) {
          return jsonResponse({ message: "Plant not found" }, 404, corsHeaders);
        }

        return jsonResponse(observation, 201, corsHeaders);
      }

      const recommendationMatch = url.pathname.match(/^\/api\/plants\/([^/]+)\/recommendations$/);
      if (request.method === "POST" && recommendationMatch) {
        const plantId = decodeURIComponent(recommendationMatch[1]);
        const plant = repository.getPlant(plantId);

        if (!plant) {
          return jsonResponse({ message: "Plant not found" }, 404, corsHeaders);
        }

        const body = await readJson<PlantQuestionRequest>(request);

        if (!body.question?.trim()) {
          return jsonResponse({ message: "Question is required" }, 400, corsHeaders);
        }

        const copilotService = new PlantCareCopilotService(env);
        const recommendation = await copilotService.recommend(plant, body.question);
        return jsonResponse(recommendation, 200, corsHeaders);
      }

      return jsonResponse({ message: "Route not found" }, 404, corsHeaders);
    } catch (error) {
      return jsonResponse(
        {
          message: "Unexpected API error",
          detail: error instanceof Error ? error.message : "Unknown error"
        },
        500,
        corsHeaders
      );
    }
  }
};

function createCorsHeaders(request: Request, env: WorkerEnvironment): Headers {
  const requestOrigin = request.headers.get("Origin");
  const configuredOrigin = env.ALLOWED_ORIGIN ?? "https://sdlme.github.io";
  const allowedOrigins = new Set([configuredOrigin, "https://sdlme.github.io", "http://localhost:4200"]);
  const allowOrigin = requestOrigin && allowedOrigins.has(requestOrigin) ? requestOrigin : configuredOrigin;

  return new Headers({
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin"
  });
}

function jsonResponse(payload: unknown, status: number, headers: Headers): Response {
  const responseHeaders = new Headers(headers);
  responseHeaders.set("Content-Type", "application/json; charset=utf-8");

  return new Response(JSON.stringify(payload), {
    status,
    headers: responseHeaders
  });
}

async function readJson<T>(request: Request): Promise<T> {
  return (await request.json()) as T;
}
