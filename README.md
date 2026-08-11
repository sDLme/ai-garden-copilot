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
- Node.js backend
- LLM integration
- Tool calling
- Database-backed garden context

The first implementation phase keeps the stack primarily TypeScript-based so the project can focus on AI engineering concepts before introducing additional services.

## Roadmap

### Phase 1 - Foundation & MVP

- Garden, plant, and observation data models
- Basic Angular UI
- Basic backend API

### Phase 2 - LLM Core & Structured Output

- LLM integration
- Prompt strategy
- Plant context injection
- Structured care recommendations

### Phase 3 - Tool Calling, State & Streaming

- `getPlant`
- `listPlants`
- `saveObservation`
- Conversation state
- SSE streaming
- Human approval UX

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
