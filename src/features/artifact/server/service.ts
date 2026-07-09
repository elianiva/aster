import { Context, Effect, Layer } from "effect";
import { eq, and, sql } from "drizzle-orm";
import { Database } from "~/server/db/client";
import { R2 } from "~/server/r2-service";
import { ArtifactError } from "~/server/errors";
import * as schema from "~/server/db/schema";

export type ArtifactKind = "lesson" | "record" | "reference";

const KIND_PREFIXES: Record<ArtifactKind, string> = {
  lesson: "lessons",
  record: "records",
  reference: "references",
};

export interface ArtifactSummary {
  id: string;
  title: string;
  createdAt: string;
}

interface ArtifactRow {
  id: string;
  title: string;
  r2Key: string;
  createdAt: Date;
}

const TITLED_TABLES = {
  lesson: schema.lessons,
  record: schema.records,
  reference: schema.references,
} as const;

const fail = (op: string) => (cause: unknown) => new ArtifactError({ message: `${op}: ${cause}` });

export class ArtifactService extends Context.Service<ArtifactService>()(
  "@aster/features/artifact/ArtifactService",
  {
    make: Effect.gen(function*() {
      const db = yield* Database;
      const client = db.client;
      const r2 = yield* R2;

      const listTitled = Effect.fn(function*(kind: ArtifactKind, workspaceId: string) {
        const table = TITLED_TABLES[kind];
        const rows = yield* Effect.tryPromise({
          try: () =>
            client
              .select({ id: table.id, title: table.title, createdAt: table.createdAt })
              .from(table)
              .where(eq(table.workspaceId, workspaceId)),
          catch: fail(`list ${kind}s`),
        });
        return rows.map((r) => ({
          id: r.id,
          title: r.title,
          createdAt: r.createdAt.toISOString(),
        })) satisfies ArtifactSummary[];
      });

      const getTitled = Effect.fn(function*(kind: ArtifactKind, id: string, workspaceId: string) {
        const table = TITLED_TABLES[kind];
        const rows = yield* Effect.tryPromise({
          try: () =>
            client
              .select()
              .from(table)
              .where(and(eq(table.id, id), eq(table.workspaceId, workspaceId)))
              .limit(1)
              .then((r) => r[0]),
          catch: fail(`get ${kind}`),
        });
        return rows ? (rows as ArtifactRow) : null;
      });

      const getContent = Effect.fn(function*(kind: ArtifactKind, id: string, workspaceId: string) {
        const row = yield* getTitled(kind, id, workspaceId);
        if (!row) return null;
        return yield* r2.fetch(row.r2Key);
      });
      const getArtifact = Effect.fn(function*(kind: ArtifactKind, id: string, workspaceId: string) {
        const row = yield* getTitled(kind, id, workspaceId);
        if (!row) return null;
        const content = yield* r2.fetch(row.r2Key);
        return { title: row.title, content };
      });

      const createTitled = Effect.fn(function*(
        kind: ArtifactKind,
        input: {
          workspaceId: string;
          title: string;
          content: string;
        },
      ) {
        const table = TITLED_TABLES[kind];
        const r2Prefix = KIND_PREFIXES[kind];
        const id = crypto.randomUUID();
        const r2Key = `${r2Prefix}/${id}.openui`;
        const now = new Date();

        yield* r2.put(r2Key, input.content);
        yield* Effect.tryPromise({
          try: () =>
            client.insert(table).values({
              id,
              workspaceId: input.workspaceId,
              title: input.title,
              r2Key,
              createdAt: now,
            }),
          catch: fail(`insert ${kind}`),
        });

        return { id, title: input.title };
      });

      const deleteTitled = Effect.fn(function*(
        kind: ArtifactKind,
        id: string,
        workspaceId: string,
      ) {
        const row = yield* getTitled(kind, id, workspaceId);
        if (!row) return false;
        const table = TITLED_TABLES[kind];
        yield* Effect.tryPromise({
          try: () => client.delete(table).where(eq(table.id, id)),
          catch: fail(`delete ${kind}`),
        });
        yield* r2.delete(row.r2Key);
        return true;
      });

      const getArtifactCounts = Effect.fn("ArtifactService.getArtifactCounts")(function*(
        workspaceId: string,
      ) {
        const [row] = yield* Effect.tryPromise({
          try: () =>
            client.all<{
              threads: number;
              lessons: number;
              records: number;
              references: number;
              glossary: number;
              resources: number;
              notes: number;
            }>(sql`
              SELECT
                (SELECT COUNT(*) FROM threads WHERE workspace_id = ${workspaceId}) as threads,
                (SELECT COUNT(*) FROM lessons WHERE workspace_id = ${workspaceId}) as lessons,
                (SELECT COUNT(*) FROM records WHERE workspace_id = ${workspaceId}) as records,
                (SELECT COUNT(*) FROM \`references\` WHERE workspace_id = ${workspaceId}) as \`references\`,
                (SELECT COUNT(*) FROM glossary WHERE workspace_id = ${workspaceId}) as glossary,
                (SELECT COUNT(*) FROM resources WHERE workspace_id = ${workspaceId}) as resources,
                (SELECT COUNT(*) FROM notes WHERE workspace_id = ${workspaceId}) as notes
            `),
          catch: fail("count artifacts"),
        });
        return row;
      });
      const listAllTitled = Effect.fn(function*(workspaceId: string) {
        const results: Array<{ id: string; title: string; createdAt: string; kind: ArtifactKind }> =
          [];
        for (const [kind, table] of Object.entries(TITLED_TABLES)) {
          const rows = yield* Effect.tryPromise({
            try: () =>
              client
                .select({ id: table.id, title: table.title, createdAt: table.createdAt })
                .from(table)
                .where(eq(table.workspaceId, workspaceId)),
            catch: fail(`list all ${kind}s`),
          });
          results.push(
            ...rows.map((r) => ({
              id: r.id,
              title: r.title,
              createdAt: r.createdAt.toISOString(),
              kind: kind as ArtifactKind,
            })),
          );
        }
        return results.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
      });

      const getArtifactById = Effect.fn(function*(id: string, workspaceId: string) {
        for (const [kind, table] of Object.entries(TITLED_TABLES)) {
          const row = yield* Effect.tryPromise({
            try: () =>
              client
                .select()
                .from(table)
                .where(and(eq(table.id, id), eq(table.workspaceId, workspaceId)))
                .limit(1)
                .then((r) => r[0]),
            catch: fail(`get ${kind} by id`),
          });
          if (row) {
            const content = yield* r2.fetch(row.r2Key);
            return { kind: kind as ArtifactKind, title: row.title, content };
          }
        }
        return null;
      });


      return {
        listTitled,
        getTitled,
        getContent,
        getArtifact,
        createTitled,
        deleteTitled,
        getArtifactCounts,
        listAllTitled,
        getArtifactById,
      } as const;
    }),
  },
) {
  static readonly layer = Layer.effect(this, this.make);
}
