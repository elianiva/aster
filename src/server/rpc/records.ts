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
	ArtifactQueryFailed: "Failed to load records. Please try again.",
});

const fail = (msg: string) => (cause: unknown) => new ArtifactQueryFailed({ message: `${msg}: ${cause}` });

export const listRecords = createServerFn({ method: "GET" })
	.validator((data: unknown) =>
		Schema.decodeUnknownSync(Schema.Struct({ workspaceId: Schema.String }))(data)
	)
	.handler(({ data }) => {
		return AppRuntime.runPromise(
			Effect.gen(function* () {
				const { client } = yield* Database;
				const records = yield* Effect.tryPromise({
					try: () =>
						client.select().from(schema.records).where(eq(schema.records.workspaceId, data.workspaceId)),
					catch: fail("Failed to list records"),
				});
				return records.map((r) => ({
					id: r.id,
					title: r.title,
					r2Key: r.r2Key,
					createdAt: r.createdAt.toISOString(),
				}));
			}).pipe(Effect.withSpan("listRecords"))
		).catch(onError);
	});

export const getRecordContent = createServerFn({ method: "GET" })
	.validator((data: unknown) =>
		Schema.decodeUnknownSync(
			Schema.Struct({ workspaceId: Schema.String, recordId: Schema.String })
		)(data)
	)
	.handler(({ data }) => {
		return AppRuntime.runPromise(
			Effect.gen(function* () {
				const { client } = yield* Database;
				const record = yield* Effect.tryPromise({
					try: () =>
						client.select().from(schema.records)
							.where(and(eq(schema.records.id, data.recordId), eq(schema.records.workspaceId, data.workspaceId)))
							.limit(1)
							.then((r) => r[0]),
					catch: fail("Failed to load record"),
				});
				if (!record) return null;
				const obj = yield* Effect.tryPromise({
					try: () => env.ASTER_R2.get(record.r2Key),
					catch: fail("Failed to fetch record content"),
				});
				if (!obj) return null;
				const content = yield* Effect.tryPromise({
					try: () => obj.text(),
					catch: fail("Failed to read record content"),
				});
				return { content };
			}).pipe(Effect.withSpan("getRecordContent"))
		).catch(onError);
	});

export const RecordRpc = {
	records: (workspaceId: string) => ["records", workspaceId] as const,
	listRecords: (workspaceId: string) =>
		queryOptions({
			queryKey: [...RecordRpc.records(workspaceId), "list"],
			queryFn: () => listRecords({ data: { workspaceId } }),
		}),
	getRecordContent: (workspaceId: string, recordId: string) =>
		queryOptions({
			queryKey: [...RecordRpc.records(workspaceId), recordId],
			queryFn: () => getRecordContent({ data: { workspaceId, recordId } }),
		}),
};
