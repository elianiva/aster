import { Context, Effect, Layer } from "effect";
import { eq } from "drizzle-orm";
import { Database } from "../../db/client";
import { fetchR2Content, putR2Content } from "../../r2-service";
import { ArtifactError } from "../../errors";
import { notes } from "../../db/schema";

export interface NoteContent {
  id: string;
  content: string | null;
  createdAt: string;
  updatedAt: string;
}

const fail = (op: string) => (cause: unknown) =>
  new ArtifactError({ message: `Note ${op}: ${cause}` });

export class NoteService extends Context.Service<NoteService>()(
  "@aster/features/note/NoteService",
  {
    make: Effect.gen(function* () {
      const db = yield* Database;
      const client = db.client;

      const getNote = Effect.fn("NoteService.get")(function* (workspaceId: string) {
        const row = yield* Effect.tryPromise({
          try: () =>
            client
              .select()
              .from(notes)
              .where(eq(notes.workspaceId, workspaceId))
              .limit(1)
              .then((r) => r[0]),
          catch: fail("get"),
        });
        if (!row) return null;
        const content = yield* fetchR2Content(row.r2Key);
        return {
          id: row.id,
          content,
          createdAt: row.createdAt.toISOString(),
          updatedAt: row.updatedAt.toISOString(),
        } satisfies NoteContent;
      });

      const upsertNote = Effect.fn("NoteService.upsert")(function* (
        workspaceId: string,
        content: string,
      ) {
        const now = new Date();
        const existing = yield* Effect.tryPromise({
          try: () =>
            client
              .select()
              .from(notes)
              .where(eq(notes.workspaceId, workspaceId))
              .limit(1)
              .then((r) => r[0]),
          catch: fail("upsert lookup"),
        });

        if (existing) {
          yield* putR2Content(existing.r2Key, content);
          yield* Effect.tryPromise({
            try: () =>
              client
                .update(notes)
                .set({ updatedAt: now })
                .where(eq(notes.id, existing.id)),
            catch: fail("update"),
          });
          return { id: existing.id };
        }

        const id = crypto.randomUUID();
        const r2Key = `notes/${id}.openui`;
        yield* putR2Content(r2Key, content);
        yield* Effect.tryPromise({
          try: () =>
            client.insert(notes).values({
              id,
              workspaceId,
              r2Key,
              createdAt: now,
              updatedAt: now,
            }),
          catch: fail("insert"),
        });
        return { id };
      });

      return { getNote, upsertNote } as const;
    }),
  },
) {
  static readonly layer = Layer.effect(this, this.make);
}