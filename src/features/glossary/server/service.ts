import { Context, Effect, Layer } from "effect";
import { and, eq } from "drizzle-orm";
import { Database } from "~/server/db/client"
import { GlossaryPersistenceFailed } from "~/server/errors"
import { glossary } from "~/server/db/schema"

export interface GlossaryEntry {
  id: string;
  term: string;
  definition: string;
  avoid?: string;
}

const fail = (op: string) => (cause: unknown) =>
  new GlossaryPersistenceFailed({ message: `Glossary ${op}: ${cause}` });

export class GlossaryService extends Context.Service<GlossaryService>()(
  "@aster/features/glossary/GlossaryService",
  {
    make: Effect.gen(function* () {
      const db = yield* Database;
      const client = db.client;

      const listGlossary = Effect.fn("GlossaryService.list")(function* (workspaceId: string) {
        const rows = yield* Effect.tryPromise({
          try: () =>
            client
              .select()
              .from(glossary)
              .where(eq(glossary.workspaceId, workspaceId)),
          catch: fail("list"),
        });
        return rows.map((r) => ({
          id: r.id,
          term: r.term,
          definition: r.definition,
          avoid: r.avoid ?? undefined,
        }));
      });

      const getGlossaryById = Effect.fn("GlossaryService.getById")(function* (
        id: string,
        workspaceId: string,
      ) {
        const row = yield* Effect.tryPromise({
          try: () =>
            client
              .select()
              .from(glossary)
              .where(
                and(
                  eq(glossary.id, id),
                  eq(glossary.workspaceId, workspaceId),
                ),
              )
              .limit(1)
              .then((r) => r[0]),
          catch: fail("getById"),
        });
        if (!row) return null;
        return {
          id: row.id,
          term: row.term,
          definition: row.definition,
          avoid: row.avoid ?? undefined,
        };
      });

      const upsertGlossary = Effect.fn("GlossaryService.upsert")(function* (input: {
        workspaceId: string;
        term: string;
        definition: string;
        avoid?: string;
      }) {
        const now = new Date();
        const existing = yield* Effect.tryPromise({
          try: () =>
            client
              .select()
              .from(glossary)
              .where(
                and(
                  eq(glossary.workspaceId, input.workspaceId),
                  eq(glossary.term, input.term),
                ),
              )
              .limit(1)
              .then((r) => r[0]),
          catch: fail("upsert lookup"),
        });

        if (existing) {
          yield* Effect.tryPromise({
            try: () =>
              client
                .update(glossary)
                .set({ definition: input.definition, avoid: input.avoid })
                .where(eq(glossary.id, existing.id)),
            catch: fail("update"),
          });
          return { id: existing.id, term: input.term, updated: true } as const;
        }

        const id = crypto.randomUUID();
        yield* Effect.tryPromise({
          try: () =>
            client.insert(glossary).values({
              id,
              workspaceId: input.workspaceId,
              term: input.term,
              definition: input.definition,
              avoid: input.avoid,
              createdAt: now,
            }),
          catch: fail("insert"),
        });
        return { id, term: input.term, updated: false } as const;
      });

      const deleteGlossary = Effect.fn("GlossaryService.delete")(function* (
        id: string,
        workspaceId: string,
      ) {
        yield* Effect.tryPromise({
          try: () =>
            client
              .delete(glossary)
              .where(
                and(eq(glossary.id, id), eq(glossary.workspaceId, workspaceId)),
              ),
          catch: fail("delete"),
        });
      });

      return { listGlossary, getGlossaryById, upsertGlossary, deleteGlossary } as const;
    }),
  },
) {
  static readonly layer = Layer.effect(this, this.make);
}