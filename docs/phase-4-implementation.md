# Phase 4 Implementation - Knowledge, RAG & Context Engineering

Phase 4 adds the first retrieval layer to AI Garden Copilot. The product now grounds plant-care answers in a trusted garden knowledge base before asking the model for a recommendation.

## Implemented Features

- Project-authored garden knowledge base with small, trusted care notes for container roses, balcony microclimates, lavender watering, rose maintenance, and diagnosis safety.
- Plant-aware retrieval service that builds a query from the user's question, selected plant profile, recent observations, location, pot size, and sun exposure.
- Workers AI embeddings path using the Cloudflare AI binding when available.
- Deterministic lexical vector fallback so retrieval still works locally and on the deployed free demo when Workers AI quota or model availability is unavailable.
- New `retrieveKnowledge` tool step in the SSE Copilot workflow.
- Server-side context injection so recommendations receive retrieved knowledge alongside plant history.
- Source-backed structured output: `contextUsed.sources` records the exact knowledge chunks used by the backend.
- Angular recommendation UI now shows retrieved sources and relevance scores.

## Retrieval Strategy

The current implementation intentionally keeps the knowledge base in TypeScript source code. This keeps the Phase 4 demo simple, reviewable, and free to run.

The retrieval pipeline is still shaped like a production RAG flow:

1. Filter candidate chunks by plant species, sun exposure, and location metadata.
2. Build a retrieval query from the user question and selected plant context.
3. Try Workers AI embeddings with `@cf/baai/bge-base-en-v1.5`.
4. Score candidate chunks by cosine similarity.
5. Fall back to a deterministic lexical vector scorer if embeddings are unavailable.
6. Inject the top knowledge chunks into the recommendation prompt.
7. Return the server-trusted source list in `contextUsed.sources`.

Vectorize is the natural next storage step once the knowledge base grows beyond a small checked-in corpus. It is not required for this slice because the current corpus is tiny and can be searched in-process without extra Cloudflare resources.

## Technology Used

- TypeScript shared models for knowledge sources and retrieved context
- Cloudflare Workers AI binding for optional embedding generation
- Cosine similarity retrieval
- SSE workflow events for transparent tool execution
- Angular standalone component template with built-in `@if` / `@for`
- Zoneless Angular runtime and Vite/esbuild production build

## Official References

- Cloudflare Workers AI bindings: https://developers.cloudflare.com/workers-ai/configuration/bindings/
- Cloudflare Vectorize and Workers AI embeddings: https://developers.cloudflare.com/vectorize/get-started/embeddings/

## Phase Boundary

This phase does not yet create a persistent Vectorize index, ingestion admin UI, document upload flow, or evaluation dataset. Those belong to later Phase 4 hardening and Phase 5 safety/evaluation work.
