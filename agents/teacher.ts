import { Think, type Session, type TurnContext, type TurnConfig } from "@cloudflare/think";
import { tool } from "ai";
import { z } from "zod";
import { drizzle } from "drizzle-orm/d1";
import { eq, and } from "drizzle-orm";
import * as schema from "../src/server/db/schema";
import {
  createModel,
  type ModelConfig,
  DEFAULT_MODEL,
} from "../src/server/features/workspace/model";
import SYSTEM_PROMPT from "./prompts/teacher.md?raw";
import TEACH_FORMATS from "./prompts/teach-formats.md?raw";
import OPENUI_PROMPT from "../src/lib/openui/component-prompt.txt?raw";

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
  private _threadKey: { workspaceId: string; threadId: string } | null = null;

  private get threadKey() {
    if (!this._threadKey) this._threadKey = parseThreadKey(this.name);
    return this._threadKey;
  }

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

    const [workspace, thread] = await Promise.all([
      this.db()
        .select()
        .from(schema.workspaces)
        .where(eq(schema.workspaces.id, this.threadKey.workspaceId))
        .limit(1)
        .then((r) => r[0]),
      this.db()
        .select()
        .from(schema.threads)
        .where(eq(schema.threads.id, this.threadKey.threadId))
        .limit(1)
        .then((r) => r[0]),
    ]);

    const workspaceBlock = workspace
      ? `\n## Current Workspace\nTopic: ${workspace.topic}\nMission: ${workspace.mission}\nCurrent knowledge: ${workspace.currentKnowledge}`
      : "";

    const teachingMode = thread?.teachingMode ?? true;
    const formatsBlock = teachingMode ? `\n\n${TEACH_FORMATS}` : "";

    return {
      model,
      system: `${SYSTEM_PROMPT}${workspaceBlock}${formatsBlock}\n\n${OPENUI_PROMPT}`,
      tools: this.threadTools(teachingMode),
    };
  }

  private threadTools(teachingMode: boolean) {
    const base = {
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
            workspaceId: this.threadKey.workspaceId,
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
            .where(eq(schema.workspaces.id, this.threadKey.workspaceId));
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
            .where(eq(schema.workspaces.id, this.threadKey.workspaceId));
          return { updated: true };
        },
      }),
      setTeachingMode: tool({
        description:
          "Enable or disable full teaching mode for this thread. When enabled, detailed format instructions for creating lessons, records, glossary entries, reference docs, resources, and notes are loaded. Suggest enabling when the user would benefit from a structured lesson or record. Ask the user before enabling.",
        inputSchema: z.object({ enabled: z.boolean() }),
        execute: async ({ enabled }) => {
          await this.db()
            .update(schema.threads)
            .set({ teachingMode: enabled, updatedAt: new Date() })
            .where(eq(schema.threads.id, this.threadKey.threadId));
          return { teachingMode: enabled };
        },
      }),
    };

    if (!teachingMode) return base;

    return {
      ...base,
      createLesson: tool({
        description:
          "Save a lesson to the workspace. Use when you've produced substantial teaching content worth preserving, or when the user asks to save something as a lesson.",
        inputSchema: z.object({
          title: z.string().describe("Short descriptive title for the lesson"),
          content: z.string().describe("Full OpenUI Lang content for the lesson"),
        }),
        execute: async ({ title, content }) => {
          const id = crypto.randomUUID();
          const r2Key = `lessons/${id}.openui`;
          const now = new Date();

          await this.env.ASTER_R2.put(r2Key, content);
          await this.db().insert(schema.lessons).values({
            id,
            workspaceId: this.threadKey.workspaceId,
            title,
            r2Key,
            createdAt: now,
          });
          await this.db()
            .update(schema.workspaces)
            .set({ lessonCount: (await this.getWorkspaceLessonCount()) + 1, updatedAt: now })
            .where(eq(schema.workspaces.id, this.threadKey.workspaceId));

          return { lessonId: id, title };
        },
      }),
      createRecord: tool({
        description:
          "Save a learning record capturing what the user has learned. Use after meaningful progress to track insights and knowledge.",
        inputSchema: z.object({
          content: z.string().describe("Full OpenUI Lang content for the learning record"),
        }),
        execute: async ({ content }) => {
          const id = crypto.randomUUID();
          const r2Key = `records/${id}.openui`;
          const now = new Date();

          await this.env.ASTER_R2.put(r2Key, content);
          await this.db().insert(schema.records).values({
            id,
            workspaceId: this.threadKey.workspaceId,
            r2Key,
            createdAt: now,
          });

          return { recordId: id };
        },
      }),
      createReference: tool({
        description:
          "Save a reference document to the workspace — cheat sheets, syntax guides, glossaries. These are the compressed essence designed for quick reference, revisited more than lessons.",
        inputSchema: z.object({
          title: z.string().describe("Short descriptive title for the reference doc"),
          content: z.string().describe("Full OpenUI Lang content for the reference doc"),
        }),
        execute: async ({ title, content }) => {
          const id = crypto.randomUUID();
          const r2Key = `references/${id}.openui`;
          const now = new Date();

          await this.env.ASTER_R2.put(r2Key, content);
          await this.db().insert(schema.references).values({
            id,
            workspaceId: this.threadKey.workspaceId,
            title,
            r2Key,
            createdAt: now,
          });

          return { referenceId: id, title };
        },
      }),
      createNote: tool({
        description:
          "Save the workspace notes scratchpad. One note per workspace — this overwrites the existing note, so append your new content to what's already there before calling. Use for user preferences and working notes, not learning insights.",
        inputSchema: z.object({
          content: z.string().describe("Full OpenUI Lang content for the notes"),
        }),
        execute: async ({ content }) => {
          const now = new Date();
          const existing = await this.db()
            .select()
            .from(schema.notes)
            .where(eq(schema.notes.workspaceId, this.threadKey.workspaceId))
            .limit(1)
            .then((r) => r[0]);

          if (existing) {
            const r2Key = existing.r2Key;
            await this.env.ASTER_R2.put(r2Key, content);
            await this.db()
              .update(schema.notes)
              .set({ updatedAt: now })
              .where(eq(schema.notes.id, existing.id));
            return { noteId: existing.id };
          }

          const id = crypto.randomUUID();
          const r2Key = `notes/${id}.openui`;
          await this.env.ASTER_R2.put(r2Key, content);
          await this.db().insert(schema.notes).values({
            id,
            workspaceId: this.threadKey.workspaceId,
            r2Key,
            createdAt: now,
            updatedAt: now,
          });

          return { noteId: id };
        },
      }),
      upsertGlossary: tool({
        description:
          "Add or update a glossary term for this workspace. Add a term only when the user understands it — the glossary is compressed knowledge, not a dictionary. If the term already exists, its definition is replaced.",
        inputSchema: z.object({
          term: z.string().describe("The canonical term"),
          definition: z.string().describe("One or two sentences. Define what it IS, not what it does."),
          avoid: z.string().optional().describe("Aliases to avoid — comma-separated"),
        }),
        execute: async ({ term, definition, avoid }) => {
          const now = new Date();
          const existing = await this.db()
            .select()
            .from(schema.glossary)
            .where(
              and(
                eq(schema.glossary.workspaceId, this.threadKey.workspaceId),
                eq(schema.glossary.term, term),
              ),
            )
            .limit(1)
            .then((r) => r[0]);

          if (existing) {
            await this.db()
              .update(schema.glossary)
              .set({ definition, avoid })
              .where(eq(schema.glossary.id, existing.id));
            return { glossaryId: existing.id, term, updated: true };
          }

          const id = crypto.randomUUID();
          await this.db().insert(schema.glossary).values({
            id,
            workspaceId: this.threadKey.workspaceId,
            term,
            definition,
            avoid,
            createdAt: now,
          });

          return { glossaryId: id, term, updated: false };
        },
      }),
      upsertResource: tool({
        description:
          "Add or update a resource for this workspace. Use type 'knowledge' for books, articles, documentation. Use type 'wisdom' for communities — forums, subreddits, classes.",
        inputSchema: z.object({
          type: z.enum(["knowledge", "wisdom"]),
          title: z.string().describe("Title of the resource"),
          url: z.string().describe("URL to the resource"),
          annotation: z.string().describe("One line: what it covers and when to reach for it"),
        }),
        execute: async ({ type, title, url, annotation }) => {
          const now = new Date();
          const existing = await this.db()
            .select()
            .from(schema.resources)
            .where(
              and(
                eq(schema.resources.workspaceId, this.threadKey.workspaceId),
                eq(schema.resources.url, url),
              ),
            )
            .limit(1)
            .then((r) => r[0]);

          if (existing) {
            await this.db()
              .update(schema.resources)
              .set({ type, title, annotation })
              .where(eq(schema.resources.id, existing.id));
            return { resourceId: existing.id, updated: true };
          }

          const id = crypto.randomUUID();
          await this.db().insert(schema.resources).values({
            id,
            workspaceId: this.threadKey.workspaceId,
            type,
            title,
            url,
            annotation,
            createdAt: now,
          });

          return { resourceId: id, updated: false };
        },
      }),
    };
  }

  private async getWorkspaceLessonCount(): Promise<number> {
    const row = await this.db()
      .select({ lessonCount: schema.workspaces.lessonCount })
      .from(schema.workspaces)
      .where(eq(schema.workspaces.id, this.threadKey.workspaceId))
      .limit(1)
      .then((r) => r[0]);
    return row?.lessonCount ?? 0;
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
      .where(eq(schema.threads.id, this.threadKey.threadId))
      .catch(() => { });

    const existing = await this.db()
      .select()
      .from(schema.threads)
      .where(eq(schema.threads.id, this.threadKey.threadId))
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
          .where(eq(schema.threads.id, this.threadKey.threadId));
      }
    } catch {
      // Title generation is best-effort; leave untitled rather than failing the turn.
    }
  }
}
