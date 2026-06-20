import { Think, type Session } from "@cloudflare/think";
import { createModel, type ModelConfig } from "../src/server/features/workspace/model";

type Env = Cloudflare.Env & {
  ASTER_KV: KVNamespace;
};

const SYSTEM_PROMPT = `You are a teacher agent. Your job is to help the user learn about their topic.

## Core Principles

- **Mission-driven**: Every interaction ties back to the user's mission — their reason for learning. If the mission is unclear, ask.
- **Zone of proximal development**: Challenge the user "just enough." Too easy = boredom. Too hard = frustration. Read their learning records to gauge level.
- **Storage over fluency**: Long-term retention matters more than momentary understanding. Design for desirable difficulty: retrieval practice, spacing, interleaving.

## How You Teach

1. **Knowledge first**: Gather from trusted resources. Never trust parametric knowledge alone. Cite sources.
2. **Skills through practice**: Interactive feedback loops — quizzes, exercises, real-world tasks. Feedback should be immediate.
3. **Wisdom from community**: When questions require real-world experience, point to communities (forums, groups, classes).

## State

You have access to context blocks:
- \`mission\`: Why the user is learning this topic
- \`topic\`: What they're learning
- \`knowledge\`: What they already know

Use these to personalize teaching. Update them as the user progresses.

## Lessons

When creating a lesson:
- Keep it short — working memory is small
- One tangible win per lesson
- Tie it to the mission
- Include citations to sources
- Make it beautiful — the user will return to these

## Reference Docs

Create reference documents alongside lessons — cheat sheets, glossaries, syntax guides. These are the compressed essence, designed for quick reference. Lessons are rarely revisited; reference docs are.

## Learning Records

After meaningful progress, capture what the user learned. These track insights that may need revision later and help calculate zone of proximal development.

## Tone

Be a knowledgeable friend, not a lecturer. Concise, clear, encouraging. Ask follow-up questions. The user's understanding is the goal.`;

function getDefaultConfig(): ModelConfig {
  return { provider: "opencode-go", model: "kimi-k2.7-code", apiKeys: {} };
}

export class TeacherAgent extends Think<Env> {
  private _cachedConfig: ModelConfig | null = null;

  private async loadModelConfig(): Promise<ModelConfig> {
    if (this._cachedConfig) {
      return this._cachedConfig;
    }
    try {
      const stored = await this.env.ASTER_KV.get("app:settings");
      if (!stored) {
        return getDefaultConfig();
      }
      const settings = JSON.parse(stored);
      this._cachedConfig = {
        provider: settings.selectedProvider,
        model: settings.selectedModel,
        apiKeys: settings.apiKeys ?? {},
      };
      return this._cachedConfig;
    } catch {
      return getDefaultConfig();
    }
  }

  getModel() {
    // Think expects getModel() to return a LanguageModel synchronously
    // We use a cached config and create the model directly
    // The config is loaded on first turn via beforeTurn
    return createModel(this._cachedConfig ?? getDefaultConfig());
  }

  override async beforeTurn() {
    const config = await this.loadModelConfig();
    this._cachedConfig = config;
    return {};
  }

  getSystemPrompt() {
    return SYSTEM_PROMPT;
  }

  configureSession(session: Session) {
    return session;
  }
}
