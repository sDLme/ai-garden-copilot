import { Garden } from "./models";

export const sampleGarden: Garden = {
  id: "garden-stockholm-balcony",
  name: "Balcony Rose Garden",
  location: "Stockholm, Sweden",
  climateNotes: "Container plants on a balcony with cool nights, wind exposure, and changing Nordic daylight.",
  plants: [
    {
      id: "rose-minerva",
      nickname: "Minerva",
      species: "Rose",
      cultivar: "Minerva",
      location: "South-facing balcony, left rail",
      potSize: "35 cm terracotta pot",
      sunExposure: "full-sun",
      notes: "Floribunda rose. Strong fragrance. Watch soil moisture during warm and windy days.",
      observations: [
        {
          id: "obs-minerva-001",
          plantId: "rose-minerva",
          observedAt: "2026-08-01",
          type: "watering",
          summary: "Watered deeply after top soil dried.",
          details: "Soil was dry 3 cm down. Leaves looked slightly soft in afternoon sun."
        },
        {
          id: "obs-minerva-002",
          plantId: "rose-minerva",
          observedAt: "2026-08-08",
          type: "health-check",
          summary: "New buds visible and foliage looks healthy.",
          details: "Removed two yellowing lower leaves. No visible pests."
        }
      ]
    },
    {
      id: "rose-eden",
      nickname: "Eden",
      species: "Climbing rose",
      cultivar: "Pierre de Ronsard",
      location: "Balcony trellis",
      potSize: "45 cm resin container",
      sunExposure: "part-sun",
      notes: "Needs steady moisture and support ties checked after windy weather.",
      observations: [
        {
          id: "obs-eden-001",
          plantId: "rose-eden",
          observedAt: "2026-08-03",
          type: "pruning",
          summary: "Deadheaded spent blooms.",
          details: "Kept new lateral shoots for trellis training."
        }
      ]
    },
    {
      id: "lavender-luna",
      nickname: "Luna",
      species: "Lavender",
      cultivar: "Hidcote",
      location: "Sunny herb shelf",
      potSize: "25 cm clay pot",
      sunExposure: "full-sun",
      notes: "Prefers drying between waterings. Good companion plant near roses.",
      observations: [
        {
          id: "obs-luna-001",
          plantId: "lavender-luna",
          observedAt: "2026-08-06",
          type: "health-check",
          summary: "Compact growth and dry soil surface.",
          details: "No watering needed. Fragrance strong when brushed."
        }
      ]
    }
  ]
};
