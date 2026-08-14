import { GardenRepository } from "./garden.repository";
import { PhotoAnalysisService } from "./photo-analysis.service";

const onePixelPng =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=";

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

  const analysis = await new PhotoAnalysisService({}).analyze(plant, {
    imageDataUrl: onePixelPng,
    fileName: "minerva-check.png",
    note: "Lower leaves look slightly yellow."
  });

  const results: EvalResult[] = [
    {
      name: "photo analysis returns structured fallback",
      passed: analysis.generatedBy === "local-fallback" && analysis.plantId === plant.id,
      detail: analysis.generatedBy
    },
    {
      name: "photo analysis suggests an observation",
      passed: analysis.suggestedObservation.type === "health-check" && Boolean(analysis.suggestedObservation.summary),
      detail: analysis.suggestedObservation.summary
    },
    {
      name: "vision guardrails are attached",
      passed: analysis.safetyChecks.some((check) => check.id === "vision-not-diagnosis"),
      detail: `${analysis.safetyChecks.length} checks`
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
