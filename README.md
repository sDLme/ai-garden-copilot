# AI Garden Copilot

AI Garden Copilot is a personal portfolio project designed to demonstrate a practical transition from frontend/software engineering into AI Product Engineering.

The goal is not to build a simple plant-care chatbot. The goal is to build an AI-native product that understands a user's real garden, remembers plant context and history, uses tools and knowledge sources, and provides personalized care recommendations.

## Live Demo

The project has a GitHub Pages landing page:

[https://sdlme.github.io/ai-garden-copilot/](https://sdlme.github.io/ai-garden-copilot/)

For now, this page presents the portfolio concept and roadmap. As the product grows, it can become the public demo entry point for the Angular application.

## Product Idea

Users create a garden profile and add plants with details such as:

- cultivar
- location
- pot size
- sun exposure
- observations
- care history

They can then ask questions like:

- "Should I water Minerva today?"
- "What changed with this rose during the last two weeks?"
- "What should I do with my roses this week?"

The copilot should retrieve the relevant plant data, inspect recent history, use garden knowledge, check external context such as weather, and then produce a practical recommendation.

## AI Engineering Scope

This project is intended to demonstrate hands-on work with:

- LLM APIs
- structured outputs
- tool and function calling
- streaming and SSE
- embeddings
- RAG
- agent orchestration
- MCP
- context engineering
- evaluations
- guardrails
- AI-native UX

Later iterations may also include multimodal plant photo analysis and external integrations such as weather data.

## Initial Tech Stack

- Angular
- TypeScript
- Node.js backend for local development
- Cloudflare Workers backend for the deployed AI API
- LLM integration
- Tool calling
- Database-backed garden context

The first implementation phase keeps the stack primarily TypeScript-based so the project can focus on AI engineering concepts before introducing additional services.

## Local Development

Install dependencies:

```bash
npm install
```

Use Node.js `^22.22.3`, `^24.15.0`, or newer. The project is currently aligned with Angular 22 and TypeScript 6.

Start the TypeScript API:

```bash
npm run dev:api
```

Or run the Cloudflare Workers API locally:

```bash
npm run dev:worker
```

Start the Angular app in a second terminal:

```bash
npm run dev:web
```

The Phase 1 app uses:

- Angular frontend: [http://localhost:4200](http://localhost:4200)
- Node/TypeScript API: [http://localhost:3333/api/garden](http://localhost:3333/api/garden)

For GitHub Pages, the Angular app reads its backend URL from `apps/web/public/app-config.js`. See [GitHub Pages AI Configuration](docs/github-pages-ai-config.md) for the safe production setup.

Deploy the backend to Cloudflare Workers:

```bash
npm run deploy:worker
```

The deployed Worker uses Cloudflare Workers AI as the free-first AI provider. OpenAI is optional and can be added later as a backend-only secret.

Then rebuild the GitHub Pages app with the deployed Worker API URL:

```bash
PUBLIC_API_BASE_URL="https://ai-garden-copilot-api.ai-garden-copilot.workers.dev/api" npm run build:pages
```

Build the GitHub Pages app:

```bash
npm run build:pages
```

This publishes the Angular app into `docs/app`, which is served at [https://sdlme.github.io/ai-garden-copilot/app/](https://sdlme.github.io/ai-garden-copilot/app/).

## Roadmap

### Phase 1 - Foundation & MVP

- Garden, plant, and observation data models
- Basic Angular UI
- Basic backend API

Current Phase 1 implementation includes a shared TypeScript data model, sample garden data, a small Node API, Garden overview screen, Plant Profile screen, and observation history workflow.

See [Phase 1 MVP](docs/phase-1-mvp.md) for MVP boundaries and user journeys.

See [Phase 1 Implementation](docs/phase-1-implementation.md) for implemented features, technology choices, architecture, and verification notes.

The Angular implementation uses standalone components, `inject()`, signals, zoneless change detection without `zone.js`, the modern `@angular/build` Vite/esbuild pipeline, and built-in control flow (`@if` / `@for`) instead of legacy structural directives.

### Phase 2 - LLM Core & Structured Output

- LLM integration
- Prompt strategy
- Plant context injection
- Structured care recommendations

Current Phase 2 implementation includes a Cloudflare Workers AI production integration, optional server-side OpenAI Responses API fallback, plant-scoped prompt/context builder, structured recommendation schema, local fallback mode, and Angular Copilot recommendation UI.

See [Phase 2 Implementation](docs/phase-2-implementation.md) for the API, schema, environment setup, official documentation references, and phase boundary.

### Phase 3 - Tool Calling, State & Streaming

- `getPlant`
- `listPlants`
- `saveObservation`
- Conversation state
- SSE streaming
- Human approval UX

Current Phase 3 implementation includes explicit garden tools, streamed Copilot workflow events, conversation IDs, approval-gated observation writes, and an Angular workflow trace UI.

See [Phase 3 Implementation](docs/phase-3-implementation.md) for the streaming API, tool events, approval workflow, technology choices, and phase boundary.

### Phase 4 - Knowledge, RAG & Context Engineering

- Embeddings
- Vector retrieval
- Garden knowledge base
- Source-backed answers
- Context strategy

### Phase 5 - Agentic Workflow, MCP & Safety

- Agent orchestration
- Weather tool
- MCP server
- Evaluations
- Guardrails

### Phase 6 - AI-Native UX & Portfolio Release

- Photo and vision support
- UX polish
- Architecture documentation
- Deployed demo
- Portfolio case study

## Portfolio Goal

AI Garden Copilot is meant to show that I can design and build an agentic AI product end to end: application state, user context, model tools, controlled actions, human-in-the-loop approvals, retrieval, error handling, probabilistic testing, and AI-native user experience.
