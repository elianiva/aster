import { Think, type Session, type TurnContext, type TurnConfig } from "@cloudflare/think";
import { tool } from "ai";
import { z } from "zod";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import * as schema from "../src/server/db/schema";
import {
  createModel,
  type ModelConfig,
  DEFAULT_MODEL,
} from "../src/server/features/workspace/model";
import SYSTEM_PROMPT from "./prompts/teacher.md?raw";

type Env = Cloudflare.Env & {
  ASTER_KV: KVNamespace;
};

function getDefaultConfig(): ModelConfig {
  return { provider: "opencode-go", model: DEFAULT_MODEL, apiKeys: {} };
}

function parseThreadKey(name: string): { workspaceId: string; threadId: string } {
  const sep = name.indexOf("::");
  if (sep < 0) return { workspaceId: name, threadId: name };
  return { workspaceId: name.slice(0, sep), threadId: name.slice(sep + 2) };
}

export class TeacherAgent extends Think<Env> {
  private _cachedConfig: ModelConfig | null = null;
  private _threadKey = parseThreadKey(this.name);

  private db() {
    return drizzle(this.env.aster_db, { schema });
  }

  private async loadModelConfig(): Promise<ModelConfig> {
    if (this._cachedConfig) return this._cachedConfig;
    try {
      const stored = await this.env.ASTER_KV.get("app:settings");
      if (!stored) return getDefaultConfig();
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
    return createModel(this._cachedConfig ?? getDefaultConfig());
  }

  override async beforeTurn(_ctx: TurnContext): Promise<TurnConfig> {
    const config = await this.loadModelConfig();
    this._cachedConfig = config;
    const model = createModel(config);

    const row = await this.db()
      .select()
      .from(schema.workspaces)
      .where(eq(schema.workspaces.id, this._threadKey.workspaceId))
      .limit(1)
      .then((r) => r[0]);

    const workspaceBlock = row
      ? `\n## Current Workspace\nTopic: ${row.topic}\nMission: ${row.mission}\nCurrent knowledge: ${row.currentKnowledge}`
      : "";

    return {
      model,
      system: `${SYSTEM_PROMPT}${workspaceBlock}`,
      tools: this.threadTools(),
    };
  }

  private threadTools() {
    return {
      createThread: tool({
        description:
          "Start a new thread for a distinct sub-topic or practice session. Use only when the current conversation clearly deserves its own space. Tell the user the thread is ready in their sidebar and stay in the current thread.",
        inputSchema: z.object({
          name: z.string().describe("A short 2-5 word name for the new thread."),
          reason: z.string().describe("Why this deserves its own thread."),
        }),
        execute: async ({ name }) => {
          const now = new Date();
          const id = crypto.randomUUID();
          await this.db().insert(schema.threads).values({
            id,
            workspaceId: this._threadKey.workspaceId,
            name,
            createdAt: now,
            updatedAt: now,
          });
          return { threadId: id, name };
        },
      }),
      updateMission: tool({
        description:
          "Update the user's mission for this workspace when it has meaningfully evolved. Do not call every turn.",
        inputSchema: z.object({ mission: z.string() }),
        execute: async ({ mission }) => {
          await this.db()
            .update(schema.workspaces)
            .set({ mission, updatedAt: new Date() })
            .where(eq(schema.workspaces.id, this._threadKey.workspaceId));
          return { updated: true };
        },
      }),
      updateKnowledge: tool({
        description:
          "Update the user's current knowledge level for this workspace after meaningful progress. Do not call every turn.",
        inputSchema: z.object({ currentKnowledge: z.string() }),
        execute: async ({ currentKnowledge }) => {
          await this.db()
            .update(schema.workspaces)
            .set({ currentKnowledge, updatedAt: new Date() })
            .where(eq(schema.workspaces.id, this._threadKey.workspaceId));
          return { updated: true };
        },
      }),
    };
  }

  getSystemPrompt() {
    return SYSTEM_PROMPT;
  }

  configureSession(session: Session) {
    return session;
  }

  override async onChatResponse() {
    const now = new Date();
    await this.db()
      .update(schema.threads)
      .set({ updatedAt: now })
      .where(eq(schema.threads.id, this._threadKey.threadId))
      .catch(() => { });

    const existing = await this.db()
      .select()
      .from(schema.threads)
      .where(eq(schema.threads.id, this._threadKey.threadId))
      .limit(1)
      .then((r) => r[0]);
    if (!existing || existing.name.trim().length > 0) return;

    const messages = await this.getMessages();
    const firstUser = messages.find((m) => m.role === "user");
    const firstAssistant = messages.find((m) => m.role === "assistant");
    if (!firstUser) return;
    const userText = firstUser.parts
      .filter((p) => p.type === "text")
      .map((p) => (p as { text: string }).text)
      .join(" ")
      .slice(0, 500);
    const assistantText = firstAssistant
      ? firstAssistant.parts
        .filter((p) => p.type === "text")
        .map((p) => (p as { text: string }).text)
        .join(" ")
        .slice(0, 500)
      : "";

    try {
      const { generateText } = await import("ai");
      const result = await generateText({
        model: this.getModel(),
        system:
          "Produce a 2-5 word title summarizing the conversation topic. Plain text, no quotes, no trailing punctuation.",
        prompt: `User: ${userText}\nAssistant: ${assistantText}`,
      });
      const title = result.text.trim().slice(0, 80);
      if (title.length > 0) {
        await this.db()
          .update(schema.threads)
          .set({ name: title, updatedAt: new Date() })
          .where(eq(schema.threads.id, this._threadKey.threadId));
      }
    } catch {
      // Title generation is best-effort; leave untitled rather than failing the turn.
    }
  }
}