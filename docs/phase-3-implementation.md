# Phase 3 Implementation

Phase 3 turns Copilot from a single request/response recommendation into a visible AI workflow with tool calls, streaming progress, conversation state, and human-approved writes.

## Implemented Features

### Tool-Style Backend Actions

The backend exposes garden operations as explicit tools:

- `listPlants`
- `getPlant`
- `saveObservation`

Read tools run automatically during the Copilot workflow. Write tools are gated behind human approval.

### SSE Streaming Workflow

The Worker and local Node API now support:

```text
POST /api/plants/:plantId/recommendations/stream
```

The response streams Server-Sent Events:

- `conversation-started`
- `tool-call`
- `tool-result`
- `recommendation`
- `approval-request`
- `done`
- `error`

The Angular app reads the stream with `fetch()` and `ReadableStream`, because this workflow needs a POST body with the plant question and optional conversation ID.

### Conversation State

Each streamed Copilot request gets a `conversationId`. The frontend keeps the active ID and sends it back with the next question so later phases can add persistent conversation memory.

### Human-In-The-Loop Approval

When Copilot wants to write to garden history, it creates an approval request instead of directly saving data.

Approval endpoints:

```text
POST /api/approvals/:approvalId/approve
POST /api/approvals/:approvalId/reject
```

Approving a request executes `saveObservation` and updates the plant observation history in the UI.

In Phase 3, approval requests are stored in memory. This is enough to demonstrate the human-in-the-loop workflow locally and in a warm Worker isolate, but persistent production approvals should move to Cloudflare KV, D1, or Durable Objects in a later phase.

### AI-Native UX

The Plant Profile screen now shows:

- live Copilot workflow trace
- tool calls and tool results
- structured recommendation
- pending approval cards
- approved observation updates

This makes the system behavior visible instead of hiding AI/tool orchestration behind a generic chat bubble.

## Technologies Used

- Angular 22
- Signals
- Reactive forms
- Fetch streaming with `ReadableStream`
- Server-Sent Events
- Cloudflare Workers
- Cloudflare Workers AI
- TypeScript shared contracts
- Node.js local API parity
- Human approval workflow

## Phase Boundary

Phase 3 intentionally keeps the orchestration deterministic and understandable. It does not yet implement RAG, weather tools, MCP, persistent storage, evals, or full autonomous agent planning. Those remain Phase 4 and Phase 5 work.

## Official Documentation References

- MDN Server-Sent Events: https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events
- MDN Streams API: https://developer.mozilla.org/en-US/docs/Web/API/Streams_API
- Cloudflare Workers Streams: https://developers.cloudflare.com/workers/runtime-apis/streams/
- Cloudflare Workers AI bindings: https://developers.cloudflare.com/workers-ai/configuration/bindings/
