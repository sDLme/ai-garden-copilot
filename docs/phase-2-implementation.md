# Phase 2 Implementation

Phase 2 adds the first AI layer to AI Garden Copilot: a selected plant can be used as runtime context for a structured care recommendation.

## Implemented Features

### Plant-Scoped Copilot Question

- The Plant Profile screen now includes an Ask Copilot panel.
- The user asks a question about the selected plant.
- The request is sent to the backend with the plant ID and user question.
- API keys remain server-side.

### Plant Context Strategy

The backend builds runtime context from the selected plant:

- plant ID
- nickname
- species
- cultivar
- location
- pot size
- sun exposure
- notes
- observation history

The system instructions define the assistant role and boundaries. Runtime context is separated from stable instructions so later phases can add tool results, retrieved knowledge, weather, and conversation state without mixing everything into one prompt.

### Structured Recommendation Output

The backend requests a strict JSON schema response for:

- `summary`
- `urgency`
- `confidence`
- `recommendedActions`
- `missingInformation`
- `careNotes`
- `contextUsed`

The frontend renders the structured fields directly instead of treating the model response as generic chat text.

### Local Fallback

If `OPENAI_API_KEY` is not set, the backend returns a clearly labeled local fallback response. This keeps local development usable while making it explicit that the result is not model-generated.

## API

```text
POST /api/plants/:plantId/recommendations
```

Request:

```json
{
  "question": "Should I water Minerva today?"
}
```

Response:

```json
{
  "plantId": "rose-minerva",
  "question": "Should I water Minerva today?",
  "summary": "...",
  "urgency": "medium",
  "confidence": "high",
  "recommendedActions": [],
  "missingInformation": [],
  "careNotes": [],
  "contextUsed": {
    "observationsReviewed": 2,
    "latestObservationDate": "2026-08-08"
  },
  "generatedBy": "openai"
}
```

## Technologies Used

- OpenAI Responses API
- Structured Outputs with JSON schema
- Server-side API key handling
- Angular 22
- Zoneless change detection
- Signals
- Reactive forms
- Node.js
- TypeScript

## Environment

Create a local `.env` or export environment variables before starting the API:

```bash
export OPENAI_API_KEY="your_api_key_here"
export OPENAI_MODEL="gpt-5-mini"
```

`OPENAI_MODEL` is optional. The backend defaults to `gpt-5-mini`.

## Official Documentation References

- OpenAI API quickstart: https://platform.openai.com/docs/quickstart/make-your-first-api-request
- OpenAI Structured Outputs: https://developers.openai.com/api/docs/guides/structured-outputs
- OpenAI Responses API reference: https://platform.openai.com/docs/api-reference/responses

## Phase 2 Boundary

Phase 2 does not implement tool calling, SSE streaming, persistent conversation state, RAG, weather, MCP, or vision. Those are intentionally left for later phases.
