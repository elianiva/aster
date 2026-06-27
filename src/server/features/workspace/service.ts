import { Context, Effect, Layer, Option, Schema } from "effect";
import { eq, sql } from "drizzle-orm";
import { Database } from "../../db/client";
import { workspaces } from "../../db/schema";

export interface Workspace {
  id: string;
  topic: string;
  mission: string;
  currentKnowledge: string;
  threadCount: number;
  lessonCount: number;
  createdAt: string;
  updatedAt: string;
}

export const CreateWorkspaceInput = Schema.Struct({
  topic: Schema.String,
  mission: Schema.String,
  currentKnowledge: Schema.String,
});

export const UpdateWorkspaceInput = Schema.Struct({
  topic: Schema.optional(Schema.String),
  mission: Schema.optional(Schema.String),
  currentKnowledge: Schema.optional(Schema.String),
});

export type CreateWorkspaceInput = typeof CreateWorkspaceInput.Type;
export type UpdateWorkspaceInput = typeof UpdateWorkspaceInput.Type;

export class WorkspaceNotFound extends Schema.TaggedErrorClass<WorkspaceNotFound>()("WorkspaceNotFound", {
  message: Schema.String,
}) {}

export class WorkspaceQueryFailed extends Schema.TaggedErrorClass<WorkspaceQueryFailed>()("WorkspaceQueryFailed", {
  message: Schema.String,
}) {}

export class WorkspaceInsertFailed extends Schema.TaggedErrorClass<WorkspaceInsertFailed>()("WorkspaceInsertFailed", {
  message: Schema.String,
}) {}

export class WorkspaceUpdateFailed extends Schema.TaggedErrorClass<WorkspaceUpdateFailed>()("WorkspaceUpdateFailed", {
  message: Schema.String,
}) {}

export class WorkspaceDeleteFailed extends Schema.TaggedErrorClass<WorkspaceDeleteFailed>()("WorkspaceDeleteFailed", {
  message: Schema.String,
}) {}

function toWorkspace(row: { id: string; topic: string; mission: string; currentKnowledge: string; threadCount: number; lessonCount: number; createdAt: Date; updatedAt: Date }): Workspace {
  return {
    id: row.id,
    topic: row.topic,
    mission: row.mission,
    currentKnowledge: row.currentKnowledge,
    threadCount: row.threadCount,
    lessonCount: row.lessonCount,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export class WorkspaceService extends Context.Service<WorkspaceService, {
  readonly list: () => Effect.Effect<Workspace[], WorkspaceQueryFailed>;
  readonly get: (id: string) => Effect.Effect<Option.Option<Workspace>, WorkspaceQueryFailed>;
  readonly create: (input: CreateWorkspaceInput) => Effect.Effect<Workspace, WorkspaceInsertFailed>;
  readonly update: (id: string, input: UpdateWorkspaceInput) => Effect.Effect<Workspace, WorkspaceNotFound | WorkspaceUpdateFailed | WorkspaceQueryFailed>;
  readonly delete: (id: string) => Effect.Effect<void, WorkspaceDeleteFailed>;
}>()("@aster/features/workspace/WorkspaceService") {
  static readonly layer = Layer.effect(
    this,
    Effect.gen(function* () {
      const db = yield* Database;
      const client = db.client;

      const workspaceCols = {
        id: workspaces.id,
        topic: workspaces.topic,
        mission: workspaces.mission,
        currentKnowledge: workspaces.currentKnowledge,
        createdAt: workspaces.createdAt,
        updatedAt: workspaces.updatedAt,
        threadCount: sql<number>`(SELECT COUNT(*) FROM threads WHERE threads.workspace_id = workspaces.id)`.mapWith(Number),
        lessonCount: sql<number>`(SELECT COUNT(*) FROM lessons WHERE lessons.workspace_id = workspaces.id)`.mapWith(Number),
      };

      const list = Effect.fn("WorkspaceService.list")(function* () {
        const rows = yield* Effect.tryPromise({
          try: () => client.select(workspaceCols).from(workspaces).orderBy(workspaces.createdAt),
          catch: (cause) =>
            new WorkspaceQueryFailed({ message: `Failed to list workspaces: ${cause}` }),
        }).pipe(Effect.withSpan("db.listWorkspaces"));
        return rows.map(toWorkspace);
      });

      const get = Effect.fn("WorkspaceService.get")(function* (id: string) {
        const rows = yield* Effect.tryPromise({
          try: () => client.select(workspaceCols).from(workspaces).where(eq(workspaces.id, id)).limit(1),
          catch: (cause) =>
            new WorkspaceQueryFailed({ message: `Failed to get workspace: ${cause}` }),
        }).pipe(Effect.withSpan("db.getWorkspace"), Effect.annotateLogs({ id }));
        return rows[0] ? Option.some(toWorkspace(rows[0])) : Option.none();
      });

      const create = Effect.fn("WorkspaceService.create")(function* (input: CreateWorkspaceInput) {
        const now = new Date();
        const id = crypto.randomUUID();
        const workspace: Workspace = {
          id,
          topic: input.topic,
          mission: input.mission,
          currentKnowledge: input.currentKnowledge,
          threadCount: 0,
          lessonCount: 0,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        };
        yield* Effect.tryPromise({
          try: () =>
            client.insert(workspaces).values({
              id,
              topic: input.topic,
              mission: input.mission,
              currentKnowledge: input.currentKnowledge,
              createdAt: now,
              updatedAt: now,
            }),
          catch: (cause) =>
            new WorkspaceInsertFailed({ message: `Failed to create workspace: ${cause}` }),
        }).pipe(Effect.withSpan("db.createWorkspace"), Effect.annotateLogs({ topic: input.topic }));
        return workspace;
      });

      const update = Effect.fn("WorkspaceService.update")(function* (id: string, input: UpdateWorkspaceInput) {
        const existing = yield* get(id);
        if (Option.isNone(existing)) {
          return yield* new WorkspaceNotFound({ message: `Workspace ${id} not found` });
        }
        const now = new Date();
        const updated = {
          ...existing.value,
          ...input,
          updatedAt: now.toISOString(),
        };
        yield* Effect.tryPromise({
          try: () =>
            client
              .update(workspaces)
              .set({
                topic: updated.topic,
                mission: updated.mission,
                currentKnowledge: updated.currentKnowledge,
                updatedAt: now,
              })
              .where(eq(workspaces.id, id)),
          catch: (cause) =>
            new WorkspaceUpdateFailed({ message: `Failed to update workspace: ${cause}` }),
        }).pipe(Effect.withSpan("db.updateWorkspace"), Effect.annotateLogs({ id }));
        return updated;
      });

      const delete_ = Effect.fn("WorkspaceService.delete")(function* (id: string) {
        yield* Effect.tryPromise({
          try: () => client.delete(workspaces).where(eq(workspaces.id, id)),
          catch: (cause) =>
            new WorkspaceDeleteFailed({ message: `Failed to delete workspace: ${cause}` }),
        }).pipe(Effect.withSpan("db.deleteWorkspace"), Effect.annotateLogs({ id }));
      });

      return WorkspaceService.of({ list, get, create, update, delete: delete_ });
    }),
  );
}
