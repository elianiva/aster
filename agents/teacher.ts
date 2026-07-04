import { Think, type Session, type TurnContext, type TurnConfig } from "@cloudflare/think";
import { Effect, Layer, Schema } from "effect";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import { generateText } from "ai";
import * as schema from "../src/server/db/schema";
import { logJson } from "../src/server/logger";
import { Database } from "../src/server/db/client";
import { R2 } from "../src/server/r2-service";
import { ThreadService } from "../src/server/features/thread/service";
import { WorkspaceService } from "../src/server/features/workspace/service";
import { ArtifactService } from "../src/server/features/artifact/service";
import { NoteService } from "../src/server/features/note/service";
import { GlossaryService } from "../src/server/features/glossary/service";
import { ResourceService } from "../src/server/features/resource/service";
import {
  createModel,
  type ModelConfig,
  DEFAULT_MODEL,
} from "../src/server/features/workspace/model";
import { createTeacherTools } from "../src/lib/teacher-tools";
import SYSTEM_PROMPT from "./prompts/teacher.md?raw";
import TEACH_FORMATS from "./prompts/teach-formats.md?raw";
import OPENUI_PROMPT from "../src/lib/openui/component-prompt.txt?raw";
import TITLE_PROMPT from "./prompts/title-generation.md?raw";

type Env = Cloudflare.Env & {
  ASTER_KV: KVNamespace;
};

type ServiceUnion =
  | ThreadService | WorkspaceService | ArtifactService
  | NoteService | GlossaryService | ResourceService;

function getDefaultConfig(): ModelConfig {
  return { provider: "opencode-go", model: DEFAULT_MODEL, apiKeys: {} };
}

function parseThreadKey(name: string): { workspaceId: string; threadId: string } {
  const sep = name.indexOf("::");
  if (sep < 0) return { workspaceId: name, threadId: name };
  return { workspaceId: name.slice(0, sep), threadId: name.slice(sep + 2) };
}

class ContextLoadFailed extends Schema.TaggedErrorClass<ContextLoadFailed>()("ContextLoadFailed", {
  cause: Schema.Defect(),
}) { }

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

  private runWithServices<A>(
    program: Effect.Effect<A, unknown, ServiceUnion | Database | R2>,
  ): Promise<A> {
    const dbLayer = Layer.succeed(Database, { client: this.db() });
    const r2Layer = Layer.succeed(R2, { bucket: this.env.ASTER_R2 });
    const layer = Layer.mergeAll(
      dbLayer,
      r2Layer,
      ThreadService.layer.pipe(Layer.provide(dbLayer)),
      WorkspaceService.layer.pipe(Layer.provide(dbLayer)),
      ArtifactService.layer.pipe(Layer.provide(dbLayer)),
      NoteService.layer.pipe(Layer.provide(dbLayer)),
      GlossaryService.layer.pipe(Layer.provide(dbLayer)),
      ResourceService.layer.pipe(Layer.provide(dbLayer)),
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
      tools: createTeacherTools(workspaceId, threadId, this.runWithServices.bind(this), teachingMode),
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
    const self = this;
    const db = this.db();
    const { threadId } = this.threadKey;
    const now = new Date();
    const getModel = () => this.getModel();
    const getMessages = () => this.getMessages();

    return Effect.runPromise(
      Effect.gen(function*() {
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

        const collectText = (parts: { type: string; text?: string }[]) =>
          parts
            .filter((p) => p.type === "text" && "text" in p)
            .map((p) => p.text)
            .join(" ")
            .slice(0, 500);

        const userText = collectText(firstUser.parts);
        const assistantText = firstAssistant ? collectText(firstAssistant.parts) : "";

        yield* Effect.tryPromise({
          try: async () => {
            const result = await generateText({
              model: getModel(),
              system: TITLE_PROMPT,
              prompt: `User: ${userText}\nAssistant: ${assistantText}`,
            });
            const title = result.text.trim().slice(0, 80);
            if (title.length > 0) {
              await self.runWithServices(
                Effect.gen(function*() {
                  const service = yield* ThreadService;
                  yield* service.rename(threadId, title);
                }),
              );
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