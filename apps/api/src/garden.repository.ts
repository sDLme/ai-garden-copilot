import { CreateObservationInput, Garden, Observation, Plant, sampleGarden } from "../../shared/src";

export class GardenRepository {
  private garden: Garden = structuredClone(sampleGarden);

  getGarden(): Garden {
    return structuredClone(this.garden);
  }

  listPlants(): Plant[] {
    return structuredClone(this.garden.plants);
  }

  getPlant(plantId: string): Plant | undefined {
    const plant = this.garden.plants.find((item) => item.id === plantId);
    return plant ? structuredClone(plant) : undefined;
  }

  addObservation(plantId: string, input: CreateObservationInput): Observation | undefined {
    const plant = this.garden.plants.find((item) => item.id === plantId);

    if (!plant) {
      return undefined;
    }

    const observation: Observation = {
      id: `obs-${plantId}-${Date.now()}`,
      plantId,
      observedAt: new Date().toISOString().slice(0, 10),
      type: input.type,
      summary: input.summary.trim(),
      details: input.details?.trim() || undefined
    };

    plant.observations = [observation, ...plant.observations];
    return structuredClone(observation);
  }
}
