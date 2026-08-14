export const plantCareRecommendationSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "plantId",
    "question",
    "summary",
    "urgency",
    "confidence",
    "recommendedActions",
    "missingInformation",
    "careNotes",
    "contextUsed"
  ],
  properties: {
    plantId: { type: "string" },
    question: { type: "string" },
    summary: { type: "string" },
    urgency: {
      type: "string",
      enum: ["low", "medium", "high", "critical"]
    },
    confidence: {
      type: "string",
      enum: ["low", "medium", "high"]
    },
    recommendedActions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["label", "rationale", "timing", "requiresApproval"],
        properties: {
          label: { type: "string" },
          rationale: { type: "string" },
          timing: { type: "string" },
          requiresApproval: { type: "boolean" }
        }
      }
    },
    missingInformation: {
      type: "array",
      items: { type: "string" }
    },
    careNotes: {
      type: "array",
      items: { type: "string" }
    },
    contextUsed: {
      type: "object",
      additionalProperties: false,
      required: ["observationsReviewed", "latestObservationDate", "knowledgeSourcesReviewed", "sources", "safetyChecks"],
      properties: {
        observationsReviewed: { type: "number" },
        latestObservationDate: { type: "string" },
        knowledgeSourcesReviewed: { type: "number" },
        sources: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["sourceId", "title", "excerpt", "relevanceScore"],
            properties: {
              sourceId: { type: "string" },
              title: { type: "string" },
              excerpt: { type: "string" },
              relevanceScore: { type: "number" }
            }
          }
        },
        weather: {
          type: "object",
          additionalProperties: false,
          required: [
            "location",
            "observedAt",
            "temperatureC",
            "relativeHumidity",
            "precipitationMm",
            "windGustKmh",
            "precipitationProbabilityMax",
            "source",
            "summary"
          ],
          properties: {
            location: { type: "string" },
            observedAt: { type: "string" },
            temperatureC: { type: ["number", "null"] },
            relativeHumidity: { type: ["number", "null"] },
            precipitationMm: { type: ["number", "null"] },
            windGustKmh: { type: ["number", "null"] },
            precipitationProbabilityMax: { type: ["number", "null"] },
            source: { type: "string", enum: ["open-meteo", "local-fallback"] },
            summary: { type: "string" }
          }
        },
        safetyChecks: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["id", "severity", "message"],
            properties: {
              id: { type: "string" },
              severity: { type: "string", enum: ["info", "warning", "blocked"] },
              message: { type: "string" }
            }
          }
        }
      }
    }
  }
} as const;
