# GitHub Pages AI Configuration

GitHub Pages can host the Angular frontend, but it cannot safely store model provider API keys.

The frontend must call a deployed backend API. For the free-first production path, the backend runs on Cloudflare Workers and calls Cloudflare Workers AI through an `env.AI` binding.

## Runtime Frontend Config

The Angular app reads its API URL from:

```text
apps/web/public/app-config.js
```

Default local config:

```js
window.aiGardenConfig = {
  apiBaseUrl: "http://localhost:3333/api"
};
```

For GitHub Pages, update `apiBaseUrl` to the deployed backend URL. The planned backend host for this project is Cloudflare Workers:

```js
window.aiGardenConfig = {
  apiBaseUrl: "https://ai-garden-copilot-api.ai-garden-copilot.workers.dev/api"
};
```

This file may contain a public backend URL. It must never contain `OPENAI_API_KEY`.

## Build For GitHub Pages

```bash
npm run build:pages
```

When the backend is deployed, pass its public API URL:

```bash
PUBLIC_API_BASE_URL="https://your-backend.example.com/api" npm run build:pages
```

This builds the Angular app with:

```text
/ai-garden-copilot/app/
```

as the base href and copies the generated browser bundle into:

```text
docs/app
```

The GitHub Pages app URL is:

```text
https://sdlme.github.io/ai-garden-copilot/app/
```

## Required Production Shape

```text
GitHub Pages Angular app
  -> deployed backend API
      -> Cloudflare Workers AI binding
      -> structured recommendation response
```

## Free AI Provider

The deployed Worker uses Cloudflare Workers AI:

```json
{
  "ai": {
    "binding": "AI"
  }
}
```

The default model is configured as:

```bash
CLOUDFLARE_AI_MODEL=@cf/meta/llama-3.1-8b-instruct-fast
```

Workers AI includes a free daily allocation. If that free allocation is exceeded, the API falls back to a local structured recommendation so the portfolio demo remains usable.

## Optional OpenAI Fallback

OpenAI can still be used later as an optional fallback. If enabled, store the key only as a backend secret:

```bash
npx wrangler secret put OPENAI_API_KEY
```

GitHub repository secrets are useful for GitHub Actions, but they are not runtime secrets for GitHub Pages. Never put provider keys in `docs/app`, `apps/web/public`, or browser code.

## Cloudflare Workers Deployment

This repo includes a Worker entrypoint at:

```text
apps/api/src/worker.ts
```

The Worker uses the same shared garden models and Copilot recommendation service as the local Node API, but runs through Cloudflare's Fetch API runtime.

Install dependencies, then authenticate Wrangler:

```bash
npm install
npx wrangler login
```

Deploy the backend:

```bash
npm run deploy:worker
```

After deployment, rebuild GitHub Pages with the Worker API URL:

```bash
PUBLIC_API_BASE_URL="https://ai-garden-copilot-api.ai-garden-copilot.workers.dev/api" npm run build:pages
```

Commit and push the regenerated `docs/app` files so the public frontend calls the deployed Worker.
