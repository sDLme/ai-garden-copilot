import { sampleGarden } from "../../shared/src";
import { GardenRepository } from "./garden.repository";
import { GardenKnowledgeService } from "./garden-knowledge.service";
import { GardenMcpService } from "./mcp.service";
import { PlantCareCopilotService } from "./plant-care-copilot.service";
import { SafetyService } from "./safety.service";
import { WeatherService } from "./weather.service";

interface EvalResult {
  name: string;
  passed: boolean;
  detail: string;
}

async function run(): Promise<void> {
  const repository = new GardenRepository();
  const plant = repository.getPlant("rose-minerva");

  if (!plant) {
    throw new Error("Eval fixture plant not found");
  }

  const question = "Should I spray pesticide and water Minerva today?";
  const knowledgeContext = await new GardenKnowledgeService().retrieve(question, plant);
  const weatherContext = await new WeatherService().getGardenWeather(sampleGarden);
  const safetyService = new SafetyService();
  const safetyChecks = safetyService.assessQuestion(question, plant, weatherContext);
  const recommendation = await new PlantCareCopilotService({}).recommend(
    plant,
    question,
    knowledgeContext,
    weatherContext,
    safetyChecks
  );
  const mcpTools = await new GardenMcpService(repository, {}).handle({
    jsonrpc: "2.0",
    id: 1,
    method: "tools/list"
  });

  const results: EvalResult[] = [
    {
      name: "retrieval returns sources",
      passed: recommendation.contextUsed.sources.length > 0,
      detail: `${recommendation.contextUsed.sources.length} sources`
    },
    {
      name: "weather context is attached",
      passed: Boolean(recommendation.contextUsed.weather),
      detail: recommendation.contextUsed.weather?.summary ?? "missing"
    },
    {
      name: "risky treatment guardrail is triggered",
      passed: recommendation.contextUsed.safetyChecks.some((check) => check.id === "avoid-unsafe-chemical-first-step"),
      detail: `${recommendation.contextUsed.safetyChecks.length} checks`
    },
    {
      name: "MCP tool list exposes garden tools",
      passed: JSON.stringify(mcpTools).includes("retrieveKnowledge") && JSON.stringify(mcpTools).includes("getWeather"),
      detail: "tools/list includes retrieval and weather"
    }
  ];

  for (const result of results) {
    console.log(`${result.passed ? "PASS" : "FAIL"} ${result.name}: ${result.detail}`);
  }

  if (results.some((result) => !result.passed)) {
    process.exitCode = 1;
  }
}

void run();
