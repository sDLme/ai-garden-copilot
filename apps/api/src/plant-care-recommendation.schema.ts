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
      required: ["observationsReviewed", "latestObservationDate"],
      properties: {
        observationsReviewed: { type: "number" },
        latestObservationDate: { type: "string" }
      }
    }
  }
} as const;
