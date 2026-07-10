import { Context, Effect, Layer, Option, Schema } from "effect";
import { desc, eq, sql } from "drizzle-orm";
import { Database } from "~/server/db/client"
import { ThreadNotFound, PersistenceError } from "~/server/errors"
import { threads } from "~/server/db/schema"

export interface Thread {
  id: string;
  workspaceId: string;
  name: string;
  teachingMode: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RecentThread {
  workspaceId: string;
  threadId: string;
  threadName: string;
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

const fail = (op: string) => (cause: unknown) =>
  new PersistenceError({ service: "thread", message: `${op}: ${cause}` });

export class ThreadService extends Context.Service<ThreadService>()(
  "@aster/features/thread/ThreadService",
  {
    make: Effect.gen(function* () {
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
          catch: fail("list threads"),
        }).pipe(Effect.withSpan("db.listThreads"));
        return rows.map(toThread);
      });

      const get = Effect.fn("ThreadService.get")(function* (id: string) {
        const rows = yield* Effect.tryPromise({
          try: () => client.select().from(threads).where(eq(threads.id, id)).limit(1),
          catch: fail("get thread"),
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
          catch: fail("create thread"),
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
          catch: fail("rename thread"),
        }).pipe(Effect.withSpan("db.renameThread"));
        return updated;
      });

      const delete_ = Effect.fn("ThreadService.delete")(function* (id: string) {
        yield* Effect.tryPromise({
          try: () => client.delete(threads).where(eq(threads.id, id)),
          catch: fail("delete thread"),
        }).pipe(Effect.withSpan("db.deleteThread"));
      });
      const touch = Effect.fn("ThreadService.touch")(function* (id: string) {
        const now = new Date();
        yield* Effect.tryPromise({
          try: () => client.update(threads).set({ updatedAt: now }).where(eq(threads.id, id)),
          catch: fail("touch thread"),
        }).pipe(Effect.withSpan("db.touchThread"));
      });


      const setTeachingMode = Effect.fn("ThreadService.setTeachingMode")(function* (id: string, enabled: boolean) {
        const existing = yield* get(id);
        if (Option.isNone(existing)) {
          return yield* new ThreadNotFound({ message: `Thread ${id} not found` });
        }
        const now = new Date();
        yield* Effect.tryPromise({
          try: () => client.update(threads).set({ teachingMode: enabled, updatedAt: now }).where(eq(threads.id, id)),
          catch: fail("set teaching mode"),
        }).pipe(Effect.withSpan("db.setTeachingMode"));
        const updated: Thread = { ...existing.value, teachingMode: enabled, updatedAt: now.toISOString() };
        return updated;
      });

      const getRecent = Effect.fn("ThreadService.getRecent")(function* () {
        const rows = yield* Effect.tryPromise({
          try: () =>
            client.all<{
              workspace_id: string;
              thread_id: string;
              thread_name: string;
            }>(sql`
              SELECT t.workspace_id, t.id as thread_id, t.name as thread_name
              FROM threads t
              INNER JOIN (
                SELECT workspace_id, MAX(updated_at) as max_updated
                FROM threads
                GROUP BY workspace_id
              ) latest ON t.workspace_id = latest.workspace_id AND t.updated_at = latest.max_updated
            `),
          catch: fail("get recent threads"),
        }).pipe(Effect.withSpan("db.getRecentThreads"));
        return rows.map((row) => ({
          workspaceId: row.workspace_id,
          threadId: row.thread_id,
          threadName: row.thread_name,
        }));
      });
      return { list, get, create, rename, delete: delete_, touch, setTeachingMode, getRecent };
    }),
  },
) {
  static readonly layer = Layer.effect(this, this.make);
}
