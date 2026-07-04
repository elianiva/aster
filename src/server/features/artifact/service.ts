import { Context, Effect, Layer } from "effect";
import { eq, and, sql } from "drizzle-orm";
import { Database } from "../../db/client";
import { fetchR2Content, putR2Content, deleteR2Content } from "../../r2-service";
import { ArtifactError } from "../../errors";
import * as schema from "../../db/schema";

// ── Kinds ──────────────────────────────────────────────────────────────────

export type ArtifactKind = "lesson" | "record" | "reference";

const KIND_PREFIXES: Record<ArtifactKind, string> = {
  lesson: "lessons",
  record: "records",
  reference: "references",
};

// ── Types ──────────────────────────────────────────────────────────────────

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

// ── Errors ─────────────────────────────────────────────────────────────────

const fail = (op: string) => (cause: unknown) =>
  new ArtifactError({ message: `${op}: ${cause}` });

// ── Service ────────────────────────────────────────────────────────────────

export class ArtifactService extends Context.Service<ArtifactService>()(
  "@aster/features/artifact/ArtifactService",
  {
    make: Effect.gen(function* () {
      const db = yield* Database;
      const client = db.client;

      const listTitled = (kind: ArtifactKind) =>
        Effect.fn(`ArtifactService.list.${kind}`)(function* (workspaceId: string) {
          const table = titledTable(kind);
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

      const getTitled = (kind: ArtifactKind) =>
        Effect.fn(`ArtifactService.get.${kind}`)(function* (
          id: string,
          workspaceId: string,
        ) {
          const table = titledTable(kind);
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

      const getContent = (kind: ArtifactKind) =>
        Effect.fn(`ArtifactService.getContent.${kind}`)(function* (
          id: string,
          workspaceId: string,
        ) {
          const row = yield* getTitled(kind)(id, workspaceId);
          if (!row) return null;
          return yield* fetchR2Content(row.r2Key);
        });

      const createTitled = (kind: ArtifactKind) =>
        Effect.fn(`ArtifactService.create.${kind}`)(function* (input: {
          workspaceId: string;
          title: string;
          content: string;
        }) {
          const table = titledTable(kind);
          const r2Prefix = KIND_PREFIXES[kind];
          const id = crypto.randomUUID();
          const r2Key = `${r2Prefix}/${id}.openui`;
          const now = new Date();

          yield* putR2Content(r2Key, input.content);
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

      const deleteTitled = (kind: ArtifactKind) =>
        Effect.fn(`ArtifactService.delete.${kind}`)(function* (
          id: string,
          workspaceId: string,
        ) {
          const row = yield* getTitled(kind)(id, workspaceId);
          if (!row) return false;
          const table = titledTable(kind);
          yield* Effect.tryPromise({
            try: () => client.delete(table).where(eq(table.id, id)),
            catch: fail(`delete ${kind}`),
          });
          yield* deleteR2Content(row.r2Key);
          return true;
        });

      // ── Counts ───────────────────────────────────────────────────────

      const getArtifactCounts = Effect.fn("ArtifactService.getArtifactCounts")(function* (
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

      return {
        listTitled,
        getTitled,
        getContent,
        createTitled,
        deleteTitled,
        getArtifactCounts,
      } as const;
    }),
  },
) {
  static readonly layer = Layer.effect(this, this.make);
}

// ── Helpers ────────────────────────────────────────────────────────────────

function titledTable(kind: ArtifactKind) {
  switch (kind) {
    case "lesson": return schema.lessons;
    case "record": return schema.records;
    case "reference": return schema.references;
  }
}
