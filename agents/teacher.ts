import { Think, type Session, type TurnContext, type TurnConfig } from "@cloudflare/think";
import { Effect, Layer, Option, Schema } from "effect";
import { drizzle } from "drizzle-orm/d1";
import { FetchHttpClient } from "effect/unstable/http";
import { generateText } from "ai";
import { logJson } from "../src/server/logger";
import { Database } from "../src/server/db/client";
import { R2 } from "../src/server/r2-service";
import { KvLayer } from "../src/server/kv-service";
import { ThreadService } from "../src/features/thread/server/service";
import { WorkspaceService } from "../src/features/workspace/server/service";
import { ArtifactService } from "../src/features/artifact/server/service";
import { NoteService } from "../src/features/artifact/server/note-service";
import { GlossaryService } from "../src/features/glossary/server/service";
import { ResourceService } from "../src/features/resource/server/service";
import { SettingsService } from "../src/features/settings/server/service";
import {
  createModel,
  type ModelConfig,
  DEFAULT_MODEL,
} from "../src/features/workspace/server/model";
import { createTeacherTools } from "../src/features/thread/server/tools";
import SYSTEM_PROMPT from "./prompts/teacher.md?raw";
import TEACH_FORMATS from "./prompts/teach-formats.md?raw";
import OPENUI_PROMPT from "../src/lib/openui/component-prompt.txt?raw";
import TITLE_PROMPT from "./prompts/title-generation.md?raw";
import * as schema from "../src/server/db/schema";

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

  private get layer() {
    const base = Layer.mergeAll(
      Layer.succeed(Database, { client: drizzle((this.env as Env).aster_db, { schema }) }),
      R2.layer((this.env as Env).ASTER_R2),
      KvLayer,
      FetchHttpClient.layer,
    );
    return Layer.mergeAll(
      base,
      SettingsService.layer.pipe(Layer.provide(base)),
      ThreadService.layer.pipe(Layer.provide(base)),
      WorkspaceService.layer.pipe(Layer.provide(base)),
      ArtifactService.layer.pipe(Layer.provide(base)),
      NoteService.layer.pipe(Layer.provide(base)),
      GlossaryService.layer.pipe(Layer.provide(base)),
      ResourceService.layer.pipe(Layer.provide(base)),
    );
  }

  private loadModelConfig(): Promise<ModelConfig> {
    if (this._cachedConfig) return Promise.resolve(this._cachedConfig);
    const self = this;

    return Effect.runPromise(
      Effect.gen(function* () {
        const settings = yield* SettingsService.use((svc) => svc.get());
        if (Option.isNone(settings)) return getDefaultConfig();
        const s = settings.value;
        return {
          provider: s.selectedProvider,
          model: s.selectedModel,
          apiKeys: s.apiKeys ?? {},
        } satisfies ModelConfig;
      }).pipe(
        Effect.catchCause(() => Effect.succeed(getDefaultConfig())),
        Effect.provide(self.layer),
      ),
    ).then((config) => {
      const fallback = getDefaultConfig();
      const isFallback =
        config.provider === fallback.provider &&
        config.model === fallback.model &&
        Object.keys(config.apiKeys).length === 0;
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
    const self = this;
    const { workspaceId, threadId } = this.threadKey;

    const [workspace, thread] = await Effect.all(
      [
        WorkspaceService.use((svc) => svc.get(workspaceId)),
        ThreadService.use((svc) => svc.get(threadId)),
      ],
      { concurrency: "unbounded" },
    )
      .pipe(
        Effect.tapError((err) =>
          Effect.sync(() =>
            logJson("error", "agent.beforeTurn.context", {
              workspaceId,
              threadId,
              cause: String(err),
            }),
          ),
        ),
        Effect.provide(self.layer),
        Effect.runPromise,
      )
      .catch(() => [Option.none(), Option.none()] as const);

    const ws = Option.getOrNull(workspace);
    const workspaceBlock = ws
      ? `\n## Current Workspace\nTopic: ${ws.topic}\nMission: ${ws.mission}\nCurrent knowledge: ${ws.currentKnowledge}`
      : "";

    const th = Option.getOrNull(thread);
    const teachingMode = th?.teachingMode ?? true;
    const formatsBlock = teachingMode ? `\n\n${TEACH_FORMATS}` : "";

    return {
      model,
      system: `${SYSTEM_PROMPT}${workspaceBlock}${formatsBlock}\n\n${OPENUI_PROMPT}`,
      tools: createTeacherTools(workspaceId, threadId, teachingMode),
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
    const { threadId } = this.threadKey;
    const getMessages = () => this.getMessages();

    return Effect.runPromise(
      Effect.gen(function* () {
        yield* ThreadService.use((svc) => svc.touch(threadId)).pipe(
          Effect.catchCause(() =>
            Effect.sync(() =>
              logJson("warn", "agent.chatResponse.touch", { threadId }),
            ),
          ),
        );

        const existing = yield* ThreadService.use((svc) => svc.get(threadId));
        if (Option.isNone(existing) || existing.value.name.trim().length > 0) return;

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
              model: self.getModel(),
              system: TITLE_PROMPT,
              prompt: `User: ${userText}\nAssistant: ${assistantText}`,
            });
            const title = result.text.trim().slice(0, 80);
            if (title.length > 0) {
              await Effect.runPromise(
                Effect.gen(function* () {
                  yield* ThreadService.use((svc) => svc.rename(threadId, title));
                }).pipe(Effect.provide(self.layer)),
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
      }).pipe(Effect.provide(self.layer)),
    );
  }
}
