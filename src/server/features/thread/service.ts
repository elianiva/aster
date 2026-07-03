import { Context, Effect, Layer, Option, Schema } from "effect";
import { desc, eq } from "drizzle-orm";
import { Database } from "../../db/client";
import { threads } from "../../db/schema";

export interface Thread {
  id: string;
  workspaceId: string;
  name: string;
  teachingMode: boolean;
  createdAt: string;
  updatedAt: string;
}

export const SetTeachingModeInput = Schema.Struct({
  id: Schema.String,
  enabled: Schema.Boolean,
});
export type SetTeachingModeInput = typeof SetTeachingModeInput.Type;

export const CreateThreadInput = Schema.Struct({
  workspaceId: Schema.String,
  name: Schema.optional(Schema.String),
});

export const RenameThreadInput = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
});

export type CreateThreadInput = typeof CreateThreadInput.Type;
export type RenameThreadInput = typeof RenameThreadInput.Type;

export class ThreadNotFound extends Schema.TaggedErrorClass<ThreadNotFound>()("ThreadNotFound", {
  message: Schema.String,
}) {}

export class ThreadQueryFailed extends Schema.TaggedErrorClass<ThreadQueryFailed>()("ThreadQueryFailed", {
  message: Schema.String,
}) {}

export class ThreadInsertFailed extends Schema.TaggedErrorClass<ThreadInsertFailed>()("ThreadInsertFailed", {
  message: Schema.String,
}) {}

export class ThreadUpdateFailed extends Schema.TaggedErrorClass<ThreadUpdateFailed>()("ThreadUpdateFailed", {
  message: Schema.String,
}) {}

export class ThreadDeleteFailed extends Schema.TaggedErrorClass<ThreadDeleteFailed>()("ThreadDeleteFailed", {
  message: Schema.String,
}) {}

function toThread(row: typeof threads.$inferSelect): Thread {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    name: row.name,
    teachingMode: row.teachingMode,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export class ThreadService extends Context.Service<ThreadService, {
  readonly list: (workspaceId: string) => Effect.Effect<Thread[], ThreadQueryFailed>;
  readonly get: (id: string) => Effect.Effect<Option.Option<Thread>, ThreadQueryFailed>;
  readonly create: (input: CreateThreadInput) => Effect.Effect<Thread, ThreadInsertFailed>;
  readonly rename: (id: string, name: string) => Effect.Effect<Thread, ThreadNotFound | ThreadQueryFailed | ThreadUpdateFailed>;
  readonly delete: (id: string) => Effect.Effect<void, ThreadDeleteFailed>;
  readonly setTeachingMode: (id: string, enabled: boolean) => Effect.Effect<Thread, ThreadNotFound | ThreadQueryFailed | ThreadUpdateFailed>;
}>()("@aster/features/thread/ThreadService") {
  static readonly layer = Layer.effect(
    this,
    Effect.gen(function* () {
      const db = yield* Database;
      const client = db.client;

      const list = Effect.fn("ThreadService.list")(function* (workspaceId: string) {
        const rows = yield* Effect.tryPromise({
          try: () =>
            client
              .select()
              .from(threads)
              .where(eq(threads.workspaceId, workspaceId))
              .orderBy(desc(threads.updatedAt)),
          catch: (cause) => new ThreadQueryFailed({ message: `Failed to list threads: ${cause}` }),
        }).pipe(Effect.withSpan("db.listThreads"));
        return rows.map(toThread);
      });

      const get = Effect.fn("ThreadService.get")(function* (id: string) {
        const rows = yield* Effect.tryPromise({
          try: () => client.select().from(threads).where(eq(threads.id, id)).limit(1),
          catch: (cause) => new ThreadQueryFailed({ message: `Failed to get thread: ${cause}` }),
        }).pipe(Effect.withSpan("db.getThread"));
        return rows[0] ? Option.some(toThread(rows[0])) : Option.none();
      });

      const create = Effect.fn("ThreadService.create")(function* (input: CreateThreadInput) {
        const now = new Date();
        const id = crypto.randomUUID();
        const thread: Thread = {
          id,
          workspaceId: input.workspaceId,
          name: input.name ?? "",
          teachingMode: true,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        };
        yield* Effect.tryPromise({
          try: () =>
            client.insert(threads).values({
              id,
              workspaceId: input.workspaceId,
              name: input.name ?? "",
              createdAt: now,
              updatedAt: now,
            }),
          catch: (cause) => new ThreadInsertFailed({ message: `Failed to create thread: ${cause}` }),
        }).pipe(Effect.withSpan("db.createThread"));
        return thread;
      });

      const rename = Effect.fn("ThreadService.rename")(function* (id: string, name: string) {
        const existing = yield* get(id);
        if (Option.isNone(existing)) {
          return yield* new ThreadNotFound({ message: `Thread ${id} not found` });
        }
        const now = new Date();
        const updated: Thread = { ...existing.value, name, updatedAt: now.toISOString() };
        yield* Effect.tryPromise({
          try: () => client.update(threads).set({ name, updatedAt: now }).where(eq(threads.id, id)),
          catch: (cause) => new ThreadUpdateFailed({ message: `Failed to rename thread: ${cause}` }),
        }).pipe(Effect.withSpan("db.renameThread"));
        return updated;
      });

      const delete_ = Effect.fn("ThreadService.delete")(function* (id: string) {
        yield* Effect.tryPromise({
          try: () => client.delete(threads).where(eq(threads.id, id)),
          catch: (cause) => new ThreadDeleteFailed({ message: `Failed to delete thread: ${cause}` }),
        }).pipe(Effect.withSpan("db.deleteThread"));
      });

      const setTeachingMode = Effect.fn("ThreadService.setTeachingMode")(function* (id: string, enabled: boolean) {
        const existing = yield* get(id);
        if (Option.isNone(existing)) {
          return yield* new ThreadNotFound({ message: `Thread ${id} not found` });
        }
        const now = new Date();
        yield* Effect.tryPromise({
          try: () => client.update(threads).set({ teachingMode: enabled, updatedAt: now }).where(eq(threads.id, id)),
          catch: (cause) => new ThreadUpdateFailed({ message: `Failed to set teaching mode: ${cause}` }),
        }).pipe(Effect.withSpan("db.setTeachingMode"));
        const updated: Thread = { ...existing.value, teachingMode: enabled, updatedAt: now.toISOString() };
        return updated;
      });

      return ThreadService.of({
        list,
        get,
        create,
        rename,
        delete: delete_,
        setTeachingMode,
      });
    }),
  );
}
