# Portfolio Case Study - AI Garden Copilot

## Summary

AI Garden Copilot is a personal AI Product Engineering portfolio project. It demonstrates how to build an AI-native product around real user context, tools, retrieval, streaming, guardrails, and human approval.

The project is intentionally not a generic chatbot. The Copilot knows the user's garden, selected plant, observations, knowledge sources, weather context, and workflow state before it responds.

## Problem

Plant-care advice is usually generic. A useful assistant should know the specific plant, where it lives, recent observations, current context, and what actions are safe to take.

## Product Decisions

- Keep garden state explicit and inspectable.
- Use tools before generation.
- Stream the agent workflow so users can see what the Copilot is doing.
- Ground answers in retrieved sources.
- Require human approval before writing to plant history.
- Treat photo analysis as observational support, not diagnosis.

## AI Engineering Skills Demonstrated

- LLM API integration
- Structured outputs
- Tool calling patterns
- SSE streaming
- Embeddings-ready retrieval
- RAG context injection
- Agent-style orchestration
- MCP-style tool exposure
- Guardrails
- Evaluation smoke tests
- AI-native UX
- Multimodal-ready photo workflow

## Stack

- Angular 22
- TypeScript
- Cloudflare Workers
- Cloudflare Workers AI
- Open-Meteo
- GitHub Pages
- Asana project tracking

## Current Limitations

- Garden data is still in-memory/sample data.
- Approval requests are in-memory.
- Images are analyzed but not persisted.
- Vectorize is not yet used as persistent vector storage.
- Vision fallback is intentionally conservative when live Workers AI vision is unavailable.

## CV Description

AI Garden Copilot - designed and built an agentic AI application using Angular, TypeScript, Cloudflare Workers, Workers AI, structured outputs, tool calling, RAG, contextual memory, MCP-style tool exposure, guardrails, SSE streaming, human-in-the-loop workflows, and multimodal-ready photo observation UX to provide personalized plant-care recommendations.
