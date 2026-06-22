import { env } from "cloudflare:workers";
import { createServerFn } from "@tanstack/react-start";
import { Effect, Schema } from "effect";
import { queryOptions } from "@tanstack/react-query";
import { drizzle } from "drizzle-orm/d1";
import { eq, sql, count } from "drizzle-orm";
import * as schema from "../db/schema";
import { AppRuntime } from "../app-runtime";

const db = () => drizzle(env.aster_db, { schema });

export const getArtifactCounts = createServerFn({ method: "GET" })
	.validator((data: unknown) =>
		Schema.decodeUnknownSync(Schema.Struct({ workspaceId: Schema.String }))(data)
	)
	.handler(({ data }) =>
		AppRuntime.runPromise(
			Effect.gen(function* () {
				const [records, references, glossary, resources, notes] = yield* Effect.all(
					[
						Effect.promise(() =>
							db().select({ c: count() }).from(schema.records)
								.where(eq(schema.records.workspaceId, data.workspaceId)).then((r) => r[0]?.c ?? 0)
						),
						Effect.promise(() =>
							db().select({ c: count() }).from(schema.references)
								.where(eq(schema.references.workspaceId, data.workspaceId)).then((r) => r[0]?.c ?? 0)
						),
						Effect.promise(() =>
							db().select({ c: count() }).from(schema.glossary)
								.where(eq(schema.glossary.workspaceId, data.workspaceId)).then((r) => r[0]?.c ?? 0)
						),
						Effect.promise(() =>
							db().select({ c: count() }).from(schema.resources)
								.where(eq(schema.resources.workspaceId, data.workspaceId)).then((r) => r[0]?.c ?? 0)
						),
						Effect.promise(() =>
							db().select({ c: sql<number>`count(*)` }).from(schema.notes)
								.where(eq(schema.notes.workspaceId, data.workspaceId)).then((r) => r[0]?.c ?? 0)
						),
					],
					{ concurrency: "unbounded" }
				);
				return { records, references, glossary, resources, notes };
			}).pipe(Effect.withSpan("getArtifactCounts"))
		)
	);

export const CountRpc = {
	counts: (workspaceId: string) => ["counts", workspaceId] as const,
	getArtifactCounts: (workspaceId: string) =>
		queryOptions({
			queryKey: [...CountRpc.counts(workspaceId)],
			queryFn: () => getArtifactCounts({ data: { workspaceId } }),
		}),
};
