export interface AiGardenRuntimeConfig {
  apiBaseUrl?: string;
}

declare global {
  interface Window {
    aiGardenConfig?: AiGardenRuntimeConfig;
  }
}

const localApiBaseUrl = "http://localhost:3333/api";

export function getApiBaseUrl(): string {
  return window.aiGardenConfig?.apiBaseUrl ?? localApiBaseUrl;
}
