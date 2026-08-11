import { KnowledgeSource, SunExposure } from "./models";

export interface GardenKnowledgeChunk {
  id: string;
  source: KnowledgeSource;
  appliesTo: {
    species?: string[];
    sunExposure?: SunExposure[];
    locations?: string[];
  };
  content: string;
}

export const gardenKnowledgeBase: GardenKnowledgeChunk[] = [
  {
    id: "container-roses-watering",
    source: {
      id: "ai-garden-notes-container-roses",
      title: "AI Garden Notes: Container Rose Watering",
      sourceType: "project-note"
    },
    appliesTo: {
      species: ["rose"],
      sunExposure: ["full-sun", "part-sun"],
      locations: ["balcony", "patio", "container", "pot"]
    },
    content:
      "Container roses should be watered deeply when the top 2-3 cm of potting mix are dry. Avoid shallow daily watering because it can leave lower roots dry while keeping the surface constantly damp."
  },
  {
    id: "balcony-wind-drying",
    source: {
      id: "ai-garden-notes-balcony-microclimate",
      title: "AI Garden Notes: Balcony Microclimates",
      sourceType: "care-principle"
    },
    appliesTo: {
      locations: ["balcony", "terrace", "window box"]
    },
    content:
      "Balcony plants can dry faster than garden-bed plants because wind and reflected heat increase evaporation. Small pots and terracotta containers usually need closer moisture checks during warm or windy spells."
  },
  {
    id: "rose-deadheading",
    source: {
      id: "ai-garden-notes-rose-maintenance",
      title: "AI Garden Notes: Rose Maintenance",
      sourceType: "project-note"
    },
    appliesTo: {
      species: ["rose"]
    },
    content:
      "Deadheading repeat-flowering roses can encourage more blooms, but heavy pruning should wait if the plant is heat-stressed, recently repotted, or showing signs of drought stress."
  },
  {
    id: "lavender-water-restraint",
    source: {
      id: "ai-garden-notes-lavender",
      title: "AI Garden Notes: Lavender in Pots",
      sourceType: "care-principle"
    },
    appliesTo: {
      species: ["lavender"],
      sunExposure: ["full-sun"]
    },
    content:
      "Lavender prefers a free-draining mix and should usually dry between waterings. Yellowing, soft growth, or persistently wet soil can point to overwatering rather than thirst."
  },
  {
    id: "diagnosis-safety",
    source: {
      id: "ai-garden-safety-observation-first",
      title: "AI Garden Safety: Observe Before Treating",
      sourceType: "safety-guideline"
    },
    appliesTo: {},
    content:
      "When symptoms are uncertain, record a fresh observation before treatment. Note soil moisture, leaf texture, discoloration, pests, new growth, and recent watering or feeding before applying fertilizer or pest products."
  }
];
