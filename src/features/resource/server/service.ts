import { Context, Effect, Layer } from "effect";
import { and, eq } from "drizzle-orm";
import { Database } from "~/server/db/client"
import { PersistenceError } from "~/server/errors"
import { resources } from "~/server/db/schema"

export interface ResourceEntry {
  id: string;
  type: "knowledge" | "wisdom";
  title: string;
  url: string;
  annotation: string;
}

const fail = (op: string) => (cause: unknown) =>
  new PersistenceError({ service: "resource", message: `${op}: ${cause}` });

export class ResourceService extends Context.Service<ResourceService>()(
  "@aster/features/resource/ResourceService",
  {
    make: Effect.gen(function* () {
      const db = yield* Database;
      const client = db.client;

      const listResources = Effect.fn("ResourceService.list")(function* (workspaceId: string) {
        const rows = yield* Effect.tryPromise({
          try: () =>
            client
              .select()
              .from(resources)
              .where(eq(resources.workspaceId, workspaceId)),
          catch: fail("list"),
        });
        return rows.map((r) => ({
          id: r.id,
          type: r.type,
          title: r.title,
          url: r.url,
          annotation: r.annotation,
        })) satisfies ResourceEntry[];
      });

      const upsertResource = Effect.fn("ResourceService.upsert")(function* (input: {
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
              .from(resources)
              .where(
                and(
                  eq(resources.workspaceId, input.workspaceId),
                  eq(resources.url, input.url),
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
                .update(resources)
                .set({ type: input.type, title: input.title, annotation: input.annotation })
                .where(eq(resources.id, existing.id)),
            catch: fail("update"),
          });
          return { id: existing.id, updated: true } as const;
        }

        const id = crypto.randomUUID();
        yield* Effect.tryPromise({
          try: () =>
            client.insert(resources).values({
              id,
              workspaceId: input.workspaceId,
              type: input.type,
              title: input.title,
              url: input.url,
              annotation: input.annotation,
              createdAt: now,
            }),
          catch: fail("insert"),
        });
        return { id, updated: false } as const;
      });

      const deleteResource = Effect.fn("ResourceService.delete")(function* (
        id: string,
        workspaceId: string,
      ) {
        yield* Effect.tryPromise({
          try: () =>
            client
              .delete(resources)
              .where(
                and(eq(resources.id, id), eq(resources.workspaceId, workspaceId)),
              ),
          catch: fail("delete"),
        });
      });

      return { listResources, upsertResource, deleteResource } as const;
    }),
  },
) {
  static readonly layer = Layer.effect(this, this.make);
}