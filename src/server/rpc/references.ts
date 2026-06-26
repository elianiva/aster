import { env } from "cloudflare:workers";
import { createServerFn } from "@tanstack/react-start";
import { Effect, Schema } from "effect";
import { queryOptions } from "@tanstack/react-query";
import { eq, and } from "drizzle-orm";
import * as schema from "../db/schema";
import { AppRuntime } from "../app-runtime";
import { Database } from "../db/client";
import { ArtifactQueryFailed } from "../errors";
import { createErrorHandler } from "./errors";

const onError = createErrorHandler({
	ArtifactQueryFailed: "Failed to load references. Please try again.",
});

const fail = (msg: string) => (cause: unknown) => new ArtifactQueryFailed({ message: `${msg}: ${cause}` });

export const listReferences = createServerFn({ method: "GET" })
	.validator((data: unknown) =>
		Schema.decodeUnknownSync(Schema.Struct({ workspaceId: Schema.String }))(data)
	)
	.handler(({ data }) => {
		return AppRuntime.runPromise(
			Effect.gen(function* () {
				const { client } = yield* Database;
				const references = yield* Effect.tryPromise({
					try: () =>
						client.select().from(schema.references).where(eq(schema.references.workspaceId, data.workspaceId)),
					catch: fail("Failed to list references"),
				});
				return references.map((r) => ({
					id: r.id,
					title: r.title,
					createdAt: r.createdAt.toISOString(),
				}));
			}).pipe(Effect.withSpan("listReferences"))
		).catch(onError);
	});

export const getReferenceContent = createServerFn({ method: "GET" })
	.validator((data: unknown) =>
		Schema.decodeUnknownSync(
			Schema.Struct({ workspaceId: Schema.String, referenceId: Schema.String })
		)(data)
	)
	.handler(({ data }) => {
		return AppRuntime.runPromise(
			Effect.gen(function* () {
				const { client } = yield* Database;
				const reference = yield* Effect.tryPromise({
					try: () =>
						client.select().from(schema.references)
							.where(and(eq(schema.references.id, data.referenceId), eq(schema.references.workspaceId, data.workspaceId)))
							.limit(1)
							.then((r) => r[0]),
					catch: fail("Failed to load reference"),
				});
				if (!reference) return null;
				const obj = yield* Effect.tryPromise({
					try: () => env.ASTER_R2.get(reference.r2Key),
					catch: fail("Failed to fetch reference content"),
				});
				if (!obj) return null;
				const content = yield* Effect.tryPromise({
					try: () => obj.text(),
					catch: fail("Failed to read reference content"),
				});
				return { content };
			}).pipe(Effect.withSpan("getReferenceContent"))
		).catch(onError);
	});

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
