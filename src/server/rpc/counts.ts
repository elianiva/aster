import { createServerFn } from "@tanstack/react-start";
import { Effect, Schema } from "effect";
import { queryOptions } from "@tanstack/react-query";
import { count, eq, sql } from "drizzle-orm";
import * as schema from "../db/schema";
import { AppRuntime } from "../app-runtime";
import { Database } from "../db/client";
import { ArtifactQueryFailed } from "../errors";
import { createErrorHandler } from "./errors";

const onError = createErrorHandler({
  ArtifactQueryFailed: "Failed to load. Please try again.",
});

export const getArtifactCounts = createServerFn({ method: "GET" })
	.validator((data: unknown) =>
		Schema.decodeUnknownSync(Schema.Struct({ workspaceId: Schema.String }))(data)
	)
	.handler(({ data }) => {
		const ctx = getRequestContext();
		return AppRuntime.runPromise(
			Effect.gen(function* () {
				const { client } = yield* Database;
				const countOf = (q: Promise<{ c: number }[]>) =>
					Effect.tryPromise({
						try: () => q.then((r) => r[0]?.c ?? 0),
						catch: (cause) => new ArtifactQueryFailed({ message: `Failed to count artifacts: ${cause}` }),
					});
				const [records, references, glossary, resources, notes] = yield* Effect.all(
					[
						countOf(client.select({ c: count() }).from(schema.records).where(eq(schema.records.workspaceId, data.workspaceId))),
						countOf(client.select({ c: count() }).from(schema.references).where(eq(schema.references.workspaceId, data.workspaceId))),
						countOf(client.select({ c: count() }).from(schema.glossary).where(eq(schema.glossary.workspaceId, data.workspaceId))),
						countOf(client.select({ c: count() }).from(schema.resources).where(eq(schema.resources.workspaceId, data.workspaceId))),
						countOf(client.select({ c: sql<number>`count(*)` }).from(schema.notes).where(eq(schema.notes.workspaceId, data.workspaceId))),
					],
					{ concurrency: "unbounded" }
				);
				return { records, references, glossary, resources, notes };
			}).pipe(Effect.withSpan("getArtifactCounts"))
		).catch(onError);
	});

export const CountRpc = {
	counts: (workspaceId: string) => ["counts", workspaceId] as const,
	getArtifactCounts: (workspaceId: string) =>
		queryOptions({
			queryKey: [...CountRpc.counts(workspaceId)],
			queryFn: () => getArtifactCounts({ data: { workspaceId } }),
		}),
};
