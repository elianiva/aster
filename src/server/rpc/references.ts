import { env } from "cloudflare:workers";
import { createServerFn } from "@tanstack/react-start";
import { Effect, Schema } from "effect";
import { queryOptions } from "@tanstack/react-query";
import { drizzle } from "drizzle-orm/d1";
import { eq, and } from "drizzle-orm";
import * as schema from "../db/schema";
import { AppRuntime } from "../app-runtime";

const db = () => drizzle(env.aster_db, { schema });

export const listReferences = createServerFn({ method: "GET" })
	.validator((data: unknown) =>
		Schema.decodeUnknownSync(Schema.Struct({ workspaceId: Schema.String }))(data)
	)
	.handler(({ data }) =>
		AppRuntime.runPromise(
			Effect.gen(function* () {
				const references = yield* Effect.promise(() =>
					db().select().from(schema.references).where(eq(schema.references.workspaceId, data.workspaceId))
				);
				return references.map((r) => ({
					id: r.id,
					title: r.title,
					createdAt: r.createdAt.toISOString(),
				}));
			}).pipe(Effect.withSpan("listReferences"))
		)
	);

export const getReferenceContent = createServerFn({ method: "GET" })
	.validator((data: unknown) =>
		Schema.decodeUnknownSync(
			Schema.Struct({ workspaceId: Schema.String, referenceId: Schema.String })
		)(data)
	)
	.handler(({ data }) =>
		AppRuntime.runPromise(
			Effect.gen(function* () {
				const reference = yield* Effect.promise(() =>
					db().select().from(schema.references)
						.where(and(eq(schema.references.id, data.referenceId), eq(schema.references.workspaceId, data.workspaceId)))
						.limit(1)
						.then((r) => r[0])
				);
				if (!reference) return null;
				const obj = yield* Effect.promise(() => env.ASTER_R2.get(reference.r2Key));
				if (!obj) return null;
				return yield* Effect.promise(() => obj.text());
			}).pipe(Effect.withSpan("getReferenceContent"))
		)
	);

export const ReferenceRpc = {
	references: (workspaceId: string) => ["references", workspaceId] as const,
	listReferences: (workspaceId: string) =>
		queryOptions({
			queryKey: [...ReferenceRpc.references(workspaceId), "list"],
			queryFn: () => listReferences({ data: { workspaceId } }),
		}),
	getReferenceContent: (workspaceId: string, referenceId: string) =>
		queryOptions({
			queryKey: [...ReferenceRpc.references(workspaceId), referenceId],
			queryFn: () => getReferenceContent({ data: { workspaceId, referenceId } }),
		}),
};
