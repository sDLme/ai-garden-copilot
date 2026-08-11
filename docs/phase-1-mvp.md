# Phase 1 MVP

Phase 1 establishes the non-AI foundation for AI Garden Copilot.

The goal is to build a working garden app before adding LLM behavior. This gives future AI workflows stable plant context, predictable app state, and a clear product surface.

## MVP Boundaries

Included:

- Shared TypeScript model for Garden, Plant, and Observation
- Sample garden data
- Node/TypeScript API
- Angular Garden overview
- Angular Plant Profile view
- Observation history
- Add-observation workflow

Deferred:

- LLM recommendations
- RAG and embeddings
- Weather tools
- MCP
- Vision/photo analysis
- Persistent database storage

## User Journeys

### 1. View Garden

The user opens the app and sees their garden profile, climate notes, tracked plants, and latest observation for each plant.

### 2. Open Plant Profile

The user selects a plant and sees its identity, cultivar, location, pot size, sun exposure, notes, and observation history.

### 3. Prepare For Copilot Questions

The user can inspect the exact plant context that a future Copilot response will use. In Phase 2, this surface becomes the entry point for structured LLM recommendations.

## Current Technical Shape

- Frontend: Angular standalone components
- Backend: Node HTTP server written in TypeScript
- Shared model: TypeScript interfaces consumed by API and frontend
- Storage: in-memory seed data for Phase 1
