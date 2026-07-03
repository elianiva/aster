import { Think, type Session, type TurnContext, type TurnConfig } from "@cloudflare/think";
import { tool } from "ai";
import { z } from "zod";
import { Effect, Layer, Schema } from "effect";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import * as schema from "../src/server/db/schema";
import { logJson } from "../src/server/logger";
import { Database } from "../src/server/db/client";
import { R2 } from "../src/server/r2-service";
import { ThreadService } from "../src/server/features/thread/service";
import { WorkspaceService } from "../src/server/features/workspace/service";
import { ArtifactService } from "../src/server/features/artifact/service";
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


/** Workspace/thread context needed by beforeTurn could not be loaded. */
class ContextLoadFailed extends Schema.TaggedErrorClass<ContextLoadFailed>()("ContextLoadFailed", {
  cause: Schema.Defect(),
}) { }

/** Best-effort post-turn work (thread touch, title generation) failed. */
class PostTurnFailed extends Schema.TaggedErrorClass<PostTurnFailed>()("PostTurnFailed", {
  step: Schema.String,
  cause: Schema.Defect(),
}) { }

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

  /**
   * Run an Effect program with the service layer provisioned from the DO's env.
   * Used by tools that delegate to ThreadService / WorkspaceService / ArtifactService
   * instead of running raw Drizzle queries.
   */
  private runWithServices<A>(
    program: Effect.Effect<A, unknown, ThreadService | WorkspaceService | ArtifactService | Database | R2>,
  ): Promise<A> {
    const dbLayer = Layer.succeed(Database, { client: this.db() });
    const r2Layer = Layer.succeed(R2, { bucket: this.env.ASTER_R2 });
    const layer = Layer.mergeAll(
      dbLayer,
      r2Layer,
      ThreadService.layer.pipe(Layer.provide(dbLayer)),
      WorkspaceService.layer.pipe(Layer.provide(dbLayer)),
      ArtifactService.layer.pipe(Layer.provide(dbLayer)),
    );
    return Effect.runPromise(program.pipe(Effect.provide(layer)));
  }

  private loadModelConfig(): Promise<ModelConfig> {
    if (this._cachedConfig) return Promise.resolve(this._cachedConfig);
    const kv = this.env.ASTER_KV;
    const { workspaceId, threadId } = this.threadKey;
    return Effect.runPromise(
      Effect.gen(function*() {
        const stored = yield* Effect.tryPromise({
          try: () => kv.get("app:settings"),
          catch: (cause) => new ContextLoadFailed({ cause }),
        });
        if (!stored) return getDefaultConfig();
        const settings = yield* Effect.try({
          try: () =>
            JSON.parse(stored) as {
              selectedProvider: string;
              selectedModel: string;
              apiKeys: Record<string, string>;
            },
          catch: (cause) => new ContextLoadFailed({ cause }),
        });
        const config: ModelConfig = {
          provider: settings.selectedProvider,
          model: settings.selectedModel,
          apiKeys: settings.apiKeys ?? {},
        };
        return config;
      }).pipe(
        // A corrupted settings blob used to silently fall back to the default
        // model with no API key — making "why is my model wrong?" un-debuggable.
        Effect.catchTag("ContextLoadFailed", (err) =>
          Effect.sync(() => {
            logJson("warn", "agent.config.fallback", {
              workspaceId,
              threadId,
              cause: String(err.cause),
            });
            return getDefaultConfig();
          }),
        ),
      ),
    ).then((config) => {
      // Only cache configs loaded from KV. Fallback defaults should be
      // re-fetched each turn so that once the user fixes their settings,
      // the agent picks up the change without waiting for DO hibernation.
      const isFallback = config.provider === getDefaultConfig().provider
        && config.model === getDefaultConfig().model
        && Object.keys(config.apiKeys).length === 0;
      if (!isFallback) {
        this._cachedConfig = config;
      }
      return config;
    });
  }

  getModel() {
    return createModel(this._cachedConfig ?? getDefaultConfig());
  }

  override async beforeTurn(_ctx: TurnContext): Promise<TurnConfig> {
    const config = await this.loadModelConfig();
    this._cachedConfig = config;
    const model = createModel(config);

    const db = this.db();
    const { workspaceId, threadId } = this.threadKey;

    const [workspace, thread] = await Effect.runPromise(
      Effect.all(
        [
          Effect.tryPromise({
            try: () =>
              db
                .select()
                .from(schema.workspaces)
                .where(eq(schema.workspaces.id, workspaceId))
                .limit(1)
                .then((r) => r[0]),
            catch: (cause) => new ContextLoadFailed({ cause }),
          }),
          Effect.tryPromise({
            try: () =>
              db
                .select()
                .from(schema.threads)
                .where(eq(schema.threads.id, threadId))
                .limit(1)
                .then((r) => r[0]),
            catch: (cause) => new ContextLoadFailed({ cause }),
          }),
        ],
        { concurrency: "unbounded" },
      ).pipe(
        // Context load failure is fatal to the turn — log then let runPromise
        // reject so the Think framework surfaces it instead of teaching blind.
        Effect.tapError((err) =>
          Effect.sync(() =>
            logJson("error", "agent.beforeTurn.context", {
              workspaceId,
              threadId,
              cause: String(err.cause),
              stack: err.cause instanceof Error ? err.cause.stack : undefined,
            }),
          ),
        ),
      ),
    ).catch((err) => {
      // runPromise rejects with the squashed ContextLoadFailed; rethrow its
      // original cause for Think.
      throw (err as { cause?: unknown })?.cause ?? err;
    });

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
    const { workspaceId, threadId } = this.threadKey;
    const base = {
      createThread: tool({
        description:
          "Start a new thread for a distinct sub-topic or practice session. Use only when the current conversation clearly deserves its own space. Tell the user the thread is ready in their sidebar and stay in the current thread.",
        inputSchema: z.object({
          name: z.string().describe("A short 2-5 word name for the new thread."),
          reason: z.string().describe("Why this deserves its own thread."),
        }),
        execute: ({ name }: { name: string; reason: string }) =>
          this.runWithServices(
            Effect.gen(function*() {
              const service = yield* ThreadService;
              const thread = yield* service.create({ workspaceId, name });
              return { threadId: thread.id, name: thread.name };
            }),
          ),
      }),
      updateMission: tool({
        description:
          "Update the user's mission for this workspace when it has meaningfully evolved. Do not call every turn.",
        inputSchema: z.object({ mission: z.string() }),
        execute: ({ mission }: { mission: string }) =>
          this.runWithServices(
            Effect.gen(function*() {
              const service = yield* WorkspaceService;
              yield* service.update(workspaceId, { mission });
              return { updated: true };
            }),
          ),
      }),
      updateKnowledge: tool({
        description:
          "Update the user's current knowledge level for this workspace after meaningful progress. Do not call every turn.",
        inputSchema: z.object({ currentKnowledge: z.string() }),
        execute: ({ currentKnowledge }: { currentKnowledge: string }) =>
          this.runWithServices(
            Effect.gen(function*() {
              const service = yield* WorkspaceService;
              yield* service.update(workspaceId, { currentKnowledge });
              return { updated: true };
            }),
          ),
      }),
      setTeachingMode: tool({
        description:
          "Enable or disable full teaching mode for this thread. When enabled, detailed format instructions for creating lessons, records, glossary entries, reference docs, resources, and notes are loaded. Suggest enabling when the user would benefit from a structured lesson or record. Ask the user before enabling.",
        inputSchema: z.object({ enabled: z.boolean() }),
        execute: ({ enabled }: { enabled: boolean }) =>
          this.runWithServices(
            Effect.gen(function*() {
              const service = yield* ThreadService;
              yield* service.setTeachingMode(threadId, enabled);
              return { teachingMode: enabled };
            }),
          ),
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
        execute: ({ title, content }: { title: string; content: string }) =>
          this.runWithServices(
            Effect.gen(function*() {
              const service = yield* ArtifactService;
              return yield* service.createTitled("lesson")({ workspaceId, title, content });
            }),
          ),
      }),
      createRecord: tool({
        description:
          "Save a learning record capturing what the user has learned. Use after meaningful progress to track insights and knowledge.",
        inputSchema: z.object({
          title: z.string().describe("Short descriptive title for the learning record"),
          content: z.string().describe("Full OpenUI Lang content for the learning record"),
        }),
        execute: ({ title, content }: { title: string; content: string }) =>
          this.runWithServices(
            Effect.gen(function*() {
              const service = yield* ArtifactService;
              return yield* service.createTitled("record")({ workspaceId, title, content });
            }),
          ),
      }),
      createReference: tool({
        description:
          "Save a reference document to the workspace — cheat sheets, syntax guides, glossaries. These are the compressed essence designed for quick reference, revisited more than lessons.",
        inputSchema: z.object({
          title: z.string().describe("Short descriptive title for the reference doc"),
          content: z.string().describe("Full OpenUI Lang content for the reference doc"),
        }),
        execute: ({ title, content }: { title: string; content: string }) =>
          this.runWithServices(
            Effect.gen(function*() {
              const service = yield* ArtifactService;
              return yield* service.createTitled("reference")({ workspaceId, title, content });
            }),
          ),
      }),
      createNote: tool({
        description:
          "Save the workspace notes scratchpad. One note per workspace — this overwrites the existing note, so append your new content to what's already there before calling. Use for user preferences and working notes, not learning insights.",
        inputSchema: z.object({
          content: z.string().describe("Full OpenUI Lang content for the notes"),
        }),
        execute: ({ content }: { content: string }) =>
          this.runWithServices(
            Effect.gen(function*() {
              const service = yield* ArtifactService;
              return yield* service.upsertNote(workspaceId, content);
            }),
          ),
      }),
      upsertGlossary: tool({
        description:
          "Add or update a glossary term for this workspace. Add a term only when the user understands it — the glossary is compressed knowledge, not a dictionary. If the term already exists, its definition is replaced.",
        inputSchema: z.object({
          term: z.string().describe("The canonical term"),
          definition: z
            .string()
            .describe("One or two sentences. Define what it IS, not what it does."),
          avoid: z.string().optional().describe("Aliases to avoid — comma-separated"),
        }),
        execute: ({
          term,
          definition,
          avoid,
        }: {
          term: string;
          definition: string;
          avoid?: string;
        }) =>
          this.runWithServices(
            Effect.gen(function*() {
              const service = yield* ArtifactService;
              return yield* service.upsertGlossary({ workspaceId, term, definition, avoid });
            }),
          ),
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
        execute: ({
          type,
          title,
          url,
          annotation,
        }: {
          type: "knowledge" | "wisdom";
          title: string;
          url: string;
          annotation: string;
        }) =>
          this.runWithServices(
            Effect.gen(function*() {
              const service = yield* ArtifactService;
              return yield* service.upsertResource({ workspaceId, type, title, url, annotation });
            }),
          ),
      }),
      listGlossary: tool({
        description:
          "List all glossary terms for this workspace. Use before pruning stale or outdated terms, or when you need to check whether a term already exists.",
        inputSchema: z.object({}),
        execute: () =>
          this.runWithServices(
            Effect.gen(function*() {
              const service = yield* ArtifactService;
              return yield* service.listGlossary(workspaceId);
            }),
          ),
      }),
      listResources: tool({
        description:
          "List all curated resources for this workspace. Use before pruning shallow or off-mission resources, or when you need to check whether a resource already exists.",
        inputSchema: z.object({}),
        execute: () =>
          this.runWithServices(
            Effect.gen(function*() {
              const service = yield* ArtifactService;
              return yield* service.listResources(workspaceId);
            }),
          ),
      }),
      listReferences: tool({
        description:
          "List all reference documents for this workspace. Use before pruning stale reference docs.",
        inputSchema: z.object({}),
        execute: () =>
          this.runWithServices(
            Effect.gen(function*() {
              const service = yield* ArtifactService;
              return yield* service.listTitled("reference")(workspaceId);
            }),
          ),
      }),
      deleteGlossary: tool({
        description:
          "Delete a glossary term. Use when a term is stale, redundant, or the user's understanding has moved past it.",
        inputSchema: z.object({ termId: z.string() }),
        execute: ({ termId }: { termId: string }) =>
          this.runWithServices(
            Effect.gen(function*() {
              const service = yield* ArtifactService;
              yield* service.deleteGlossary(termId, workspaceId);
              return { deleted: true };
            }),
          ),
      }),
      deleteResource: tool({
        description:
          "Delete a curated resource. Use when a resource turns out to be wrong, shallow, or off-mission.",
        inputSchema: z.object({ resourceId: z.string() }),
        execute: ({ resourceId }: { resourceId: string }) =>
          this.runWithServices(
            Effect.gen(function*() {
              const service = yield* ArtifactService;
              yield* service.deleteResource(resourceId, workspaceId);
              return { deleted: true };
            }),
          ),
      }),
      deleteLesson: tool({
        description:
          "Delete a lesson and its R2 content. Use when a lesson is stale, incorrect, or the user wants to clean up.",
        inputSchema: z.object({ lessonId: z.string() }),
        execute: ({ lessonId }: { lessonId: string }) =>
          this.runWithServices(
            Effect.gen(function*() {
              const service = yield* ArtifactService;
              const deleted = yield* service.deleteTitled("lesson")(lessonId, workspaceId);
              return { deleted };
            }),
          ),
      }),
      deleteRecord: tool({
        description:
          "Delete a learning record and its R2 content. Use when a record is stale, incorrect, or the user wants to clean up.",
        inputSchema: z.object({ recordId: z.string() }),
        execute: ({ recordId }: { recordId: string }) =>
          this.runWithServices(
            Effect.gen(function*() {
              const service = yield* ArtifactService;
              const deleted = yield* service.deleteTitled("record")(recordId, workspaceId);
              return { deleted };
            }),
          ),
      }),
      deleteReference: tool({
        description:
          "Delete a reference document and its R2 content. Use when a reference doc is stale or no longer accurate.",
        inputSchema: z.object({ referenceId: z.string() }),
        execute: ({ referenceId }: { referenceId: string }) =>
          this.runWithServices(
            Effect.gen(function*() {
              const service = yield* ArtifactService;
              const deleted = yield* service.deleteTitled("reference")(referenceId, workspaceId);
              return { deleted };
            }),
          ),
      }),
    };
  }

  async deleteStorage() {
    await this.ctx.storage.deleteAll();
    await this.ctx.storage.deleteAlarm();
  }

  getSystemPrompt() {
    return SYSTEM_PROMPT;
  }

  configureSession(session: Session) {
    return session;
  }

  override onChatResponse(): Promise<void> {
    const db = this.db();
    const { threadId } = this.threadKey;
    const now = new Date();
    const getModel = () => this.getModel();
    const getMessages = () => this.getMessages();

    return Effect.runPromise(
      Effect.gen(function*() {
        // Best-effort: bump the thread's updatedAt. A failure here must not
        // abort title generation or the post-turn flow.
        yield* Effect.tryPromise({
          try: () =>
            db
              .update(schema.threads)
              .set({ updatedAt: now })
              .where(eq(schema.threads.id, threadId)),
          catch: (cause) => new PostTurnFailed({ step: "touch", cause }),
        }).pipe(
          Effect.catchTag("PostTurnFailed", (err) =>
            Effect.sync(() =>
              logJson("warn", "agent.chatResponse.touch", { threadId, cause: String(err.cause) }),
            ),
          ),
        );

        const existing = yield* Effect.tryPromise({
          try: () =>
            db
              .select()
              .from(schema.threads)
              .where(eq(schema.threads.id, threadId))
              .limit(1)
              .then((r) => r[0]),
          catch: (cause) => new PostTurnFailed({ step: "load", cause }),
        });
        if (!existing || existing.name.trim().length > 0) return;

        const messages = yield* Effect.tryPromise({
          try: () => getMessages(),
          catch: (cause) => new PostTurnFailed({ step: "messages", cause }),
        });
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

        // Title generation is best-effort; leave untitled rather than failing the turn.
        yield* Effect.tryPromise({
          try: async () => {
            const { generateText } = await import("ai");
            const result = await generateText({
              model: getModel(),
              system:
                "Produce a 2-5 word title summarizing the conversation topic. Plain text, no quotes, no trailing punctuation.",
              prompt: `User: ${userText}\nAssistant: ${assistantText}`,
            });
            const title = result.text.trim().slice(0, 80);
            if (title.length > 0) {
              await db
                .update(schema.threads)
                .set({ name: title, updatedAt: new Date() })
                .where(eq(schema.threads.id, threadId));
            }
          },
          catch: (cause) => new PostTurnFailed({ step: "title", cause }),
        }).pipe(
          Effect.catchTag("PostTurnFailed", (err) =>
            Effect.sync(() =>
              logJson("warn", "agent.title.generate", { threadId, cause: String(err.cause) }),
            ),
          ),
        );
      }),
    );
  }
}
