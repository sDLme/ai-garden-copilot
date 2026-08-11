import { gardenKnowledgeBase, GardenKnowledgeChunk, KnowledgeContext, Plant } from "../../shared/src";
import { PlantCareCopilotEnvironment } from "./plant-care-copilot.service";

const embeddingModel = "@cf/baai/bge-base-en-v1.5";
const topK = 3;

interface WorkersAiEmbeddingResponse {
  data?: number[][];
  shape?: number[];
}

export class GardenKnowledgeService {
  constructor(private readonly environment: PlantCareCopilotEnvironment = {}) {}

  async retrieve(question: string, plant: Plant): Promise<KnowledgeContext[]> {
    const candidates = gardenKnowledgeBase.filter((chunk) => appliesToPlant(chunk, plant));
    const query = buildRetrievalQuery(question, plant);

    try {
      const embedded = await this.retrieveWithWorkersAi(query, candidates);

      if (embedded.length) {
        return embedded;
      }
    } catch (error) {
      console.warn("Workers AI embedding retrieval failed", error);
    }

    return retrieveLexically(query, candidates);
  }

  private async retrieveWithWorkersAi(query: string, candidates: GardenKnowledgeChunk[]): Promise<KnowledgeContext[]> {
    if (!this.environment.AI || !candidates.length) {
      return [];
    }

    const input = [query, ...candidates.map((chunk) => chunk.content)];
    const response = (await this.environment.AI.run(embeddingModel, {
      text: input
    })) as WorkersAiEmbeddingResponse;

    const vectors = response.data;

    if (!vectors || vectors.length !== input.length) {
      return [];
    }

    const [queryVector, ...chunkVectors] = vectors;

    return candidates
      .map((chunk, index) => toKnowledgeContext(chunk, cosineSimilarity(queryVector, chunkVectors[index] ?? [])))
      .sort((left, right) => right.relevanceScore - left.relevanceScore)
      .slice(0, topK);
  }
}

function buildRetrievalQuery(question: string, plant: Plant): string {
  return [
    question,
    plant.nickname,
    plant.species,
    plant.cultivar ?? "",
    plant.location,
    plant.potSize,
    plant.sunExposure,
    plant.notes,
    plant.observations.slice(0, 3).map((observation) => observation.summary).join(" ")
  ].join(" ");
}

function appliesToPlant(chunk: GardenKnowledgeChunk, plant: Plant): boolean {
  const species = plant.species.toLowerCase();
  const location = plant.location.toLowerCase();
  const speciesMatches = !chunk.appliesTo.species || chunk.appliesTo.species.some((item) => species.includes(item));
  const sunMatches = !chunk.appliesTo.sunExposure || chunk.appliesTo.sunExposure.includes(plant.sunExposure);
  const locationMatches =
    !chunk.appliesTo.locations || chunk.appliesTo.locations.some((item) => location.includes(item.toLowerCase()));

  return speciesMatches && sunMatches && locationMatches;
}

function retrieveLexically(query: string, candidates: GardenKnowledgeChunk[]): KnowledgeContext[] {
  const queryVector = vectorizeText(query);

  return candidates
    .map((chunk) => toKnowledgeContext(chunk, cosineSimilarity(queryVector, vectorizeText(chunk.content))))
    .sort((left, right) => right.relevanceScore - left.relevanceScore)
    .slice(0, topK);
}

function vectorizeText(text: string): number[] {
  const tokens = tokenize(text);
  const buckets = new Array<number>(64).fill(0);

  for (const token of tokens) {
    buckets[hashToken(token) % buckets.length] += 1;
  }

  return buckets;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2);
}

function hashToken(token: string): number {
  let hash = 0;

  for (const char of token) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }

  return hash;
}

function cosineSimilarity(left: number[], right: number[]): number {
  if (!left.length || !right.length || left.length !== right.length) {
    return 0;
  }

  let dot = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;

  for (let index = 0; index < left.length; index += 1) {
    dot += left[index] * right[index];
    leftMagnitude += left[index] ** 2;
    rightMagnitude += right[index] ** 2;
  }

  if (!leftMagnitude || !rightMagnitude) {
    return 0;
  }

  return dot / (Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude));
}

function toKnowledgeContext(chunk: GardenKnowledgeChunk, relevanceScore: number): KnowledgeContext {
  return {
    sourceId: chunk.source.id,
    title: chunk.source.title,
    excerpt: chunk.content,
    relevanceScore: Number(relevanceScore.toFixed(4))
  };
}
