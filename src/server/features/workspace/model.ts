import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export const DEFAULT_MODEL = "kimi-k2.7-code";

export interface ModelConfig {
  provider: string;
  model: string;
  apiKeys: Record<string, string>;
}

export function createModel(config: ModelConfig) {
  return createOpenCodeGo(config.model, config.apiKeys["opencode-go"]);
}

function createOpenCodeGo(model: string, apiKey?: string) {
  const provider = createOpenAICompatible({
    baseURL: "https://opencode.ai/zen/go/v1",
    name: "opencode-go",
    apiKey: apiKey ?? "",
  });
  return provider.chatModel(model || DEFAULT_MODEL);
}
