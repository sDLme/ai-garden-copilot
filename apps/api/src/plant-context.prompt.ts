import { Plant } from "../../shared/src";

export function buildPlantCareInput(plant: Plant, question: string): string {
  const observations = plant.observations
    .map((observation) => {
      const details = observation.details ? ` Details: ${observation.details}` : "";
      return `- ${observation.observedAt} [${observation.type}]: ${observation.summary}${details}`;
    })
    .join("\n");

  return [
    "User question:",
    question,
    "",
    "Selected plant context:",
    `Plant ID: ${plant.id}`,
    `Nickname: ${plant.nickname}`,
    `Species: ${plant.species}`,
    `Cultivar: ${plant.cultivar ?? "Unknown"}`,
    `Location: ${plant.location}`,
    `Pot size: ${plant.potSize}`,
    `Sun exposure: ${plant.sunExposure}`,
    `Notes: ${plant.notes}`,
    "",
    "Observation history:",
    observations || "No observations recorded yet."
  ].join("\n");
}

export const plantCareSystemInstructions = [
  "You are AI Garden Copilot, a careful plant-care assistant.",
  "Use only the selected plant context supplied in the request.",
  "Do not claim to have checked weather, images, RAG sources, reminders, or tools in Phase 2.",
  "If important data is missing, add it to missingInformation instead of guessing.",
  "Keep advice practical, cautious, and suitable for a home gardener.",
  "Recommend observation or monitoring when diagnosis is uncertain.",
  "Do not recommend unsafe chemical treatment as a first step.",
  "Return a structured recommendation that matches the provided JSON schema."
].join(" ");
