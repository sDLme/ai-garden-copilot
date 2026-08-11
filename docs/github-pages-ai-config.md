# GitHub Pages AI Configuration

GitHub Pages can host the Angular frontend, but it cannot safely store `OPENAI_API_KEY`.

The frontend must call a deployed backend API. The backend reads `OPENAI_API_KEY` from its own private environment variables and calls OpenAI from the server side.

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

For GitHub Pages, update `apiBaseUrl` to the deployed backend URL:

```js
window.aiGardenConfig = {
  apiBaseUrl: "https://your-backend.example.com/api"
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
      -> OPENAI_API_KEY in backend secret environment
      -> OpenAI Responses API
      -> structured recommendation response
```

## Backend Secret

The backend host should define:

```bash
OPENAI_API_KEY=your_real_key
OPENAI_MODEL=gpt-5-mini
```

Examples of suitable backend hosts:

- Vercel Functions
- Cloudflare Workers
- Render
- Fly.io
- Railway

GitHub repository secrets are useful for GitHub Actions, but they are not runtime secrets for GitHub Pages.
