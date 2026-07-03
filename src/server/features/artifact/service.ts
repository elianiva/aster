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

export interface NoteContent {
  id: string;
  content: string | null;
  createdAt: string;
  updatedAt: string;
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

      // ── Titled R2 artifacts (lessons, records, references) ────────────

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
          }));
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

      // ── Notes (one per workspace, upsert semantics) ──────────────────

      const getNote = Effect.fn("ArtifactService.getNote")(function* (
        workspaceId: string,
      ) {
        const row = yield* Effect.tryPromise({
          try: () =>
            client
              .select()
              .from(schema.notes)
              .where(eq(schema.notes.workspaceId, workspaceId))
              .limit(1)
              .then((r) => r[0]),
          catch: fail("get note"),
        });
        if (!row) return null;
        const content = yield* fetchR2Content(row.r2Key);
        return {
          id: row.id,
          content,
          createdAt: row.createdAt.toISOString(),
          updatedAt: row.updatedAt.toISOString(),
        };
      });

      const upsertNote = Effect.fn("ArtifactService.upsertNote")(function* (
        workspaceId: string,
        content: string,
      ) {
        const now = new Date();
        const existing = yield* Effect.tryPromise({
          try: () =>
            client
              .select()
              .from(schema.notes)
              .where(eq(schema.notes.workspaceId, workspaceId))
              .limit(1)
              .then((r) => r[0]),
          catch: fail("upsert note"),
        });

        if (existing) {
          yield* putR2Content(existing.r2Key, content);
          yield* Effect.tryPromise({
            try: () =>
              client
                .update(schema.notes)
                .set({ updatedAt: now })
                .where(eq(schema.notes.id, existing.id)),
            catch: fail("update note"),
          });
          return { id: existing.id };
        }

        const id = crypto.randomUUID();
        const r2Key = `notes/${id}.openui`;
        yield* putR2Content(r2Key, content);
        yield* Effect.tryPromise({
          try: () =>
            client.insert(schema.notes).values({
              id,
              workspaceId,
              r2Key,
              createdAt: now,
              updatedAt: now,
            }),
          catch: fail("insert note"),
        });
        return { id };
      });

      // ── Glossary ─────────────────────────────────────────────────────

      const listGlossary = Effect.fn("ArtifactService.listGlossary")(function* (
        workspaceId: string,
      ) {
        const rows = yield* Effect.tryPromise({
          try: () =>
            client
              .select()
              .from(schema.glossary)
              .where(eq(schema.glossary.workspaceId, workspaceId)),
          catch: fail("list glossary"),
        });
        return rows.map((t) => ({
          id: t.id,
          term: t.term,
          definition: t.definition,
          avoid: t.avoid,
        }));
      });

      const upsertGlossary = Effect.fn("ArtifactService.upsertGlossary")(function* (input: {
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
              .from(schema.glossary)
              .where(
                and(
                  eq(schema.glossary.workspaceId, input.workspaceId),
                  eq(schema.glossary.term, input.term),
                ),
              )
              .limit(1)
              .then((r) => r[0]),
          catch: fail("upsert glossary"),
        });

        if (existing) {
          yield* Effect.tryPromise({
            try: () =>
              client
                .update(schema.glossary)
                .set({ definition: input.definition, avoid: input.avoid })
                .where(eq(schema.glossary.id, existing.id)),
            catch: fail("update glossary"),
          });
          return { id: existing.id, term: input.term, updated: true };
        }

        const id = crypto.randomUUID();
        yield* Effect.tryPromise({
          try: () =>
            client.insert(schema.glossary).values({
              id,
              workspaceId: input.workspaceId,
              term: input.term,
              definition: input.definition,
              avoid: input.avoid,
              createdAt: now,
            }),
          catch: fail("insert glossary"),
        });
        return { id, term: input.term, updated: false };
      });

      const deleteGlossary = Effect.fn("ArtifactService.deleteGlossary")(function* (
        id: string,
        workspaceId: string,
      ) {
        yield* Effect.tryPromise({
          try: () =>
            client
              .delete(schema.glossary)
              .where(
                and(
                  eq(schema.glossary.id, id),
                  eq(schema.glossary.workspaceId, workspaceId),
                ),
              ),
          catch: fail("delete glossary"),
        });
      });

      // ── Resources ────────────────────────────────────────────────────

      const listResources = Effect.fn("ArtifactService.listResources")(function* (
        workspaceId: string,
      ) {
        const rows = yield* Effect.tryPromise({
          try: () =>
            client
              .select()
              .from(schema.resources)
              .where(eq(schema.resources.workspaceId, workspaceId)),
          catch: fail("list resources"),
        });
        return rows.map((r) => ({
          id: r.id,
          type: r.type,
          title: r.title,
          url: r.url,
          annotation: r.annotation,
        }));
      });

      const upsertResource = Effect.fn("ArtifactService.upsertResource")(function* (input: {
        workspaceId: string;
        type: "knowledge" | "wisdom";
        title: string;
        url: string;
        annotation: string;
      }) {
        const now = new Date();
        const existing = yield* Effect.tryPromise({
          try: () =>
            client
              .select()
              .from(schema.resources)
              .where(
                and(
                  eq(schema.resources.workspaceId, input.workspaceId),
                  eq(schema.resources.url, input.url),
                ),
              )
              .limit(1)
              .then((r) => r[0]),
          catch: fail("upsert resource"),
        });

        if (existing) {
          yield* Effect.tryPromise({
            try: () =>
              client
                .update(schema.resources)
                .set({ type: input.type, title: input.title, annotation: input.annotation })
                .where(eq(schema.resources.id, existing.id)),
            catch: fail("update resource"),
          });
          return { id: existing.id, updated: true };
        }

        const id = crypto.randomUUID();
        yield* Effect.tryPromise({
          try: () =>
            client.insert(schema.resources).values({
              id,
              workspaceId: input.workspaceId,
              type: input.type,
              title: input.title,
              url: input.url,
              annotation: input.annotation,
              createdAt: now,
            }),
          catch: fail("insert resource"),
        });
        return { id, updated: false };
      });

      const deleteResource = Effect.fn("ArtifactService.deleteResource")(function* (
        id: string,
        workspaceId: string,
      ) {
        yield* Effect.tryPromise({
          try: () =>
            client
              .delete(schema.resources)
              .where(
                and(
                  eq(schema.resources.id, id),
                  eq(schema.resources.workspaceId, workspaceId),
                ),
              ),
          catch: fail("delete resource"),
        });
      });

      // ── Counts ───────────────────────────────────────────────────────

      const getArtifactCounts = Effect.fn("ArtifactService.getArtifactCounts")(function* (
        workspaceId: string,
      ) {
        const [row] = yield* Effect.tryPromise({
          try: () =>
            client.all<{
              records: number;
              references: number;
              glossary: number;
              resources: number;
              notes: number;
            }>(sql`
              SELECT
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
        getNote,
        upsertNote,
        listGlossary,
        upsertGlossary,
        deleteGlossary,
        listResources,
        upsertResource,
        deleteResource,
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
