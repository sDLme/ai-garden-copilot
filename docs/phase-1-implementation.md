# Phase 1 Implementation

Phase 1 delivers the non-AI foundation for AI Garden Copilot: a working garden application that can display plant context and record observations before LLM features are added.

## Implemented Features

### Garden Overview

- Shows the user's garden profile.
- Displays garden location and climate notes.
- Lists tracked plants as cards.
- Shows each plant's species, nickname, cultivar, location, pot size, sun exposure, and latest observation.
- Links each plant card to its Plant Profile screen.

### Plant Profile

- Shows plant identity and care context.
- Displays species, cultivar, location, pot size, sun exposure, and notes.
- Shows observation history in chronological UI.
- Includes an "Ask Copilot" placeholder panel for the Phase 2 LLM workflow.

### Observation Workflow

- Lets the user add an observation to a specific plant.
- Supports observation types:
  - watering
  - feeding
  - pruning
  - health-check
  - repotting
  - note
- Stores new observations in the in-memory garden state.
- Updates the plant profile UI after saving an observation.

### API

- `GET /api/garden` returns the full garden profile.
- `GET /api/plants` returns all plants.
- `GET /api/plants/:plantId` returns a single plant.
- `POST /api/plants/:plantId/observations` saves a new observation.

### Shared Domain Model

- `Garden`
- `Plant`
- `Observation`
- `CreateObservationInput`
- `SunExposure`
- `ObservationType`

The shared TypeScript model is consumed by both the Angular frontend and Node API so later AI tools can reuse the same garden context contract.

## Technologies Used

### Frontend

- Angular 22
- Standalone components
- Built-in control flow with `@if` and `@for`
- Signals and `toSignal`
- `inject()` dependency injection style
- Reactive forms
- Zoneless change detection
- No `zone.js`
- `@angular/build` using the modern Vite/esbuild pipeline

### Backend

- Node.js
- TypeScript
- Native Node HTTP server
- In-memory repository for Phase 1
- Shared TypeScript interfaces from `apps/shared`

### Tooling

- TypeScript 6
- npm lockfile
- Node `24.19.0` via `.nvmrc` and `.node-version`
- Angular CLI cache disabled because the local macOS/Node 24 environment crashes in Angular's LMDB persistent cache path

## Current Architecture

```text
Angular app
  -> GardenService
  -> Node/TypeScript API
  -> GardenRepository
  -> sample garden data

Shared TypeScript model
  -> used by frontend
  -> used by backend
```

## Verification

The implementation was verified with:

```bash
npm run check
npm run build
```

The API was smoke-tested through:

```bash
GET /api/garden
GET /api/plants
```

## Official Documentation References

- Angular built-in control flow: https://angular.dev/guide/templates/control-flow
- Angular zoneless: https://angular.dev/guide/zoneless
- Angular build system migration: https://angular.dev/tools/cli/build-system-migration

## Phase 1 Boundary

Phase 1 intentionally does not include LLM calls, RAG, weather, MCP, vision, or persistent database storage. Those features build on top of this stable garden context foundation in later phases.
