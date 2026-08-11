import { cp, rm, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";

const appBaseHref = "/ai-garden-copilot/app/";
const pagesApiBaseUrl = process.env["PUBLIC_API_BASE_URL"] ?? "https://your-backend.example.com/api";
const source = "dist/web/browser";
const target = "docs/app";

const build = spawnSync(
  "ng",
  ["build", "web", "--base-href", appBaseHref],
  { stdio: "inherit" }
);

if (build.status !== 0) {
  process.exit(build.status ?? 1);
}

await rm(target, { recursive: true, force: true });
await cp(source, target, { recursive: true });
await writeFile(
  `${target}/app-config.js`,
  `window.aiGardenConfig = {\n  apiBaseUrl: "${pagesApiBaseUrl}"\n};\n`
);
