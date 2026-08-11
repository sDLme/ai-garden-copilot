import { CreateObservationInput, Garden, Observation, Plant, sampleGarden } from "../../shared/src";

export class GardenRepository {
  private garden: Garden = structuredClone(sampleGarden);

  getGarden(): Garden {
    return this.cloneGarden();
  }

  listPlants(): Plant[] {
    return this.cloneGarden().plants;
  }

  getPlant(plantId: string): Plant | undefined {
    const plant = this.garden.plants.find((item) => item.id === plantId);
    return plant ? this.clonePlant(plant) : undefined;
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

  private cloneGarden(): Garden {
    return {
      ...this.garden,
      plants: this.garden.plants.map((plant) => this.clonePlant(plant))
    };
  }

  private clonePlant(plant: Plant): Plant {
    return {
      ...plant,
      observations: [...plant.observations].sort((left, right) =>
        right.observedAt.localeCompare(left.observedAt)
      )
    };
  }
}
