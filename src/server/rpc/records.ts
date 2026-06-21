import { env } from "cloudflare:workers";
import { createServerFn } from "@tanstack/react-start";
import { Effect, Schema } from "effect";
import { queryOptions } from "@tanstack/react-query";
import { drizzle } from "drizzle-orm/d1";
import { eq, and } from "drizzle-orm";
import * as schema from "../db/schema";
import { AppRuntime } from "../app-runtime";

const db = () => drizzle(env.aster_db, { schema });

export const listRecords = createServerFn({ method: "GET" })
	.validator((data: unknown) =>
		Schema.decodeUnknownSync(Schema.Struct({ workspaceId: Schema.String }))(data)
	)
	.handler(({ data }) =>
		AppRuntime.runPromise(
			Effect.gen(function* () {
				const records = yield* Effect.promise(() =>
					db().select().from(schema.records).where(eq(schema.records.workspaceId, data.workspaceId))
				);
				return records.map((r) => ({
					id: r.id,
					r2Key: r.r2Key,
					createdAt: r.createdAt.toISOString(),
				}));
			}).pipe(Effect.withSpan("listRecords"))
		)
	);

export const getRecordContent = createServerFn({ method: "GET" })
	.validator((data: unknown) =>
		Schema.decodeUnknownSync(
			Schema.Struct({ workspaceId: Schema.String, recordId: Schema.String })
		)(data)
	)
	.handler(({ data }) =>
		AppRuntime.runPromise(
			Effect.gen(function* () {
				const record = yield* Effect.promise(() =>
					db().select().from(schema.records)
						.where(and(eq(schema.records.id, data.recordId), eq(schema.records.workspaceId, data.workspaceId)))
						.limit(1)
						.then((r) => r[0])
				);
				if (!record) return null;
				const obj = yield* Effect.promise(() => env.ASTER_R2.get(record.r2Key));
				if (!obj) return null;
				return yield* Effect.promise(() => obj.text());
			}).pipe(Effect.withSpan("getRecordContent"))
		)
	);

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
