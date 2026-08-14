import { GardenRepository } from "./garden.repository";
import { GardenKnowledgeService } from "./garden-knowledge.service";
import { PlantCareCopilotEnvironment } from "./plant-care-copilot.service";
import { WeatherService } from "./weather.service";

interface JsonRpcRequest {
  jsonrpc?: "2.0";
  id?: string | number | null;
  method?: string;
  params?: unknown;
}

interface ToolCallParams {
  name?: string;
  arguments?: Record<string, unknown>;
}

export class GardenMcpService {
  constructor(
    private readonly repository: GardenRepository,
    private readonly environment: PlantCareCopilotEnvironment
  ) {}

  async handle(request: JsonRpcRequest): Promise<Record<string, unknown>> {
    if (request.method === "initialize") {
      return jsonRpcResult(request.id, {
        protocolVersion: "2026-07-28",
        serverInfo: {
          name: "ai-garden-copilot",
          version: "0.1.0"
        },
        capabilities: {
          tools: {}
        }
      });
    }

    if (request.method === "tools/list") {
      return jsonRpcResult(request.id, {
        tools: gardenTools
      });
    }

    if (request.method === "tools/call") {
      return jsonRpcResult(request.id, await this.callTool(toToolCallParams(request.params)));
    }

    return jsonRpcError(request.id, -32601, `Unsupported MCP method: ${request.method ?? "unknown"}`);
  }

  private async callTool(params: ToolCallParams): Promise<Record<string, unknown>> {
    if (params.name === "getGarden") {
      return textContent(this.repository.getGarden());
    }

    if (params.name === "listPlants") {
      return textContent(this.repository.listPlants());
    }

    if (params.name === "getPlant") {
      const plantId = getStringArgument(params.arguments, "plantId");
      const plant = plantId ? this.repository.getPlant(plantId) : undefined;
      return plant ? textContent(plant) : textContent({ message: "Plant not found" });
    }

    if (params.name === "retrieveKnowledge") {
      const plantId = getStringArgument(params.arguments, "plantId");
      const question = getStringArgument(params.arguments, "question") ?? "";
      const plant = plantId ? this.repository.getPlant(plantId) : undefined;

      if (!plant) {
        return textContent({ message: "Plant not found" });
      }

      const sources = await new GardenKnowledgeService(this.environment).retrieve(question, plant);
      return textContent(sources);
    }

    if (params.name === "getWeather") {
      const weather = await new WeatherService().getGardenWeather(this.repository.getGarden());
      return textContent(weather);
    }

    return textContent({ message: `Unsupported tool: ${params.name ?? "unknown"}` });
  }
}

const gardenTools = [
  {
    name: "getGarden",
    description: "Read the current garden profile and tracked plants.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {}
    }
  },
  {
    name: "listPlants",
    description: "List all tracked plants with their saved context.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {}
    }
  },
  {
    name: "getPlant",
    description: "Load a specific plant by ID.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      required: ["plantId"],
      properties: {
        plantId: { type: "string" }
      }
    }
  },
  {
    name: "retrieveKnowledge",
    description: "Retrieve trusted garden knowledge chunks for a plant question.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      required: ["plantId", "question"],
      properties: {
        plantId: { type: "string" },
        question: { type: "string" }
      }
    }
  },
  {
    name: "getWeather",
    description: "Get current garden weather context from the configured weather provider.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {}
    }
  }
];

export function getMcpMetadata(): Record<string, unknown> {
  return {
    name: "AI Garden Copilot MCP",
    endpoint: "/mcp",
    transport: "streamable-http-json-rpc",
    tools: gardenTools.map((tool) => ({
      name: tool.name,
      description: tool.description
    }))
  };
}

function toToolCallParams(value: unknown): ToolCallParams {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as ToolCallParams;
  }

  return {};
}

function getStringArgument(args: Record<string, unknown> | undefined, key: string): string | undefined {
  const value = args?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function textContent(value: unknown): Record<string, unknown> {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(value, null, 2)
      }
    ]
  };
}

function jsonRpcResult(id: JsonRpcRequest["id"], result: Record<string, unknown>): Record<string, unknown> {
  return {
    jsonrpc: "2.0",
    id: id ?? null,
    result
  };
}

function jsonRpcError(id: JsonRpcRequest["id"], code: number, message: string): Record<string, unknown> {
  return {
    jsonrpc: "2.0",
    id: id ?? null,
    error: {
      code,
      message
    }
  };
}
