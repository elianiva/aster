import { Context, Effect, Layer, Option, Schema } from "effect";
import { eq } from "drizzle-orm";
import { Database } from "../../db/client";
import { WorkspaceNotFound, WorkspacePersistenceFailed } from "../../errors";
import { workspaces, threads, lessons, records, references, glossary, resources, notes } from "../../db/schema";
export interface Workspace {
  id: string;
  topic: string;
  mission: string;
  currentKnowledge: string;
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

function toWorkspace(row: { id: string; topic: string; mission: string; currentKnowledge: string; createdAt: Date; updatedAt: Date }): Workspace {
  return {
    id: row.id,
    topic: row.topic,
    mission: row.mission,
    currentKnowledge: row.currentKnowledge,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

const fail = (op: string) => (cause: unknown) =>
  new WorkspacePersistenceFailed({ message: `${op}: ${cause}` });

export class WorkspaceService extends Context.Service<WorkspaceService, {
  readonly list: () => Effect.Effect<Workspace[], WorkspacePersistenceFailed>;
  readonly get: (id: string) => Effect.Effect<Option.Option<Workspace>, WorkspacePersistenceFailed>;
  readonly create: (input: CreateWorkspaceInput) => Effect.Effect<Workspace, WorkspacePersistenceFailed>;
  readonly update: (id: string, input: UpdateWorkspaceInput) => Effect.Effect<Workspace, WorkspaceNotFound | WorkspacePersistenceFailed>;
  readonly delete: (id: string) => Effect.Effect<void, WorkspacePersistenceFailed>;
  readonly cascadeDelete: (id: string) => Effect.Effect<
    { threadIds: string[]; r2Keys: string[] },
    WorkspacePersistenceFailed
  >;
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
      };

      const list = Effect.fn("WorkspaceService.list")(function* () {
        const rows = yield* Effect.tryPromise({
          try: () => client.select(workspaceCols).from(workspaces).orderBy(workspaces.createdAt),
          catch: fail("list workspaces"),
        }).pipe(Effect.withSpan("db.listWorkspaces"));
        return rows.map(toWorkspace);
      });

      const get = Effect.fn("WorkspaceService.get")(function* (id: string) {
        const rows = yield* Effect.tryPromise({
          try: () => client.select(workspaceCols).from(workspaces).where(eq(workspaces.id, id)).limit(1),
          catch: fail("get workspace"),
        }).pipe(Effect.withSpan("db.getWorkspace"), Effect.annotateLogs({ id }));
        if (!rows[0]) return Option.none();
        return Option.some(toWorkspace(rows[0]));
      });

      const create = Effect.fn("WorkspaceService.create")(function* (input: CreateWorkspaceInput) {
        const now = new Date();
        const id = crypto.randomUUID();
        const workspace: Workspace = {
          id,
          topic: input.topic,
          mission: input.mission,
          currentKnowledge: input.currentKnowledge,
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
          catch: fail("create workspace"),
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
          catch: fail("update workspace"),
        }).pipe(Effect.withSpan("db.updateWorkspace"), Effect.annotateLogs({ id }));
        return updated;
      });

      const delete_ = Effect.fn("WorkspaceService.delete")(function* (id: string) {
        yield* Effect.tryPromise({
          try: () => client.delete(workspaces).where(eq(workspaces.id, id)),
          catch: fail("delete workspace"),
        }).pipe(Effect.withSpan("db.deleteWorkspace"), Effect.annotateLogs({ id }));
      });

      const cascadeDelete = Effect.fn("WorkspaceService.cascadeDelete")(function* (id: string) {
        yield* Effect.log("cascadeDelete workspace artifacts").pipe(Effect.annotateLogs({ id }));

        const threadRows = yield* Effect.tryPromise({
          try: () => client.select({ id: threads.id }).from(threads).where(eq(threads.workspaceId, id)),
          catch: fail("list threads for cascade"),
        });
        const threadIds = threadRows.map((r) => r.id);

        const r2Tables = [lessons, records, references, notes] as const;
        const r2Keys: string[] = [];
        for (const table of r2Tables) {
          const rows = yield* Effect.tryPromise({
            try: () => client.select({ r2Key: table.r2Key }).from(table).where(eq(table.workspaceId, id)),
            catch: fail("list R2 keys for cascade"),
          });
          for (const row of rows) r2Keys.push(row.r2Key);
        }

        const childTables = [threads, lessons, records, references, glossary, resources, notes] as const;
        yield* Effect.all(
          childTables.map((table) =>
            Effect.tryPromise({
              try: () => client.delete(table).where(eq(table.workspaceId, id)),
              catch: fail("delete child rows"),
            }),
          ),
          { concurrency: "unbounded" },
        );

        yield* Effect.tryPromise({
          try: () => client.delete(workspaces).where(eq(workspaces.id, id)),
          catch: fail("delete workspace"),
        });

        return { threadIds, r2Keys };
      });

      return WorkspaceService.of({ list, get, create, update, delete: delete_, cascadeDelete });
    }),
  );
}
