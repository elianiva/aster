import { createServerFn } from "@tanstack/react-start";
import { Effect, Schema } from "effect";
import { queryOptions } from "@tanstack/react-query";
import { sql } from "drizzle-orm";
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
		return AppRuntime.runPromise(
			Effect.gen(function* () {
				const { client } = yield* Database;
				const [row] = yield* Effect.tryPromise({
					try: () => client.all<{
						records: number;
						references: number;
						glossary: number;
						resources: number;
						notes: number;
					}>(sql`
						SELECT
							(SELECT COUNT(*) FROM records WHERE workspace_id = ${data.workspaceId}) as records,
							(SELECT COUNT(*) FROM \`references\` WHERE workspace_id = ${data.workspaceId}) as \`references\`,
							(SELECT COUNT(*) FROM glossary WHERE workspace_id = ${data.workspaceId}) as glossary,
							(SELECT COUNT(*) FROM resources WHERE workspace_id = ${data.workspaceId}) as resources,
							(SELECT COUNT(*) FROM notes WHERE workspace_id = ${data.workspaceId}) as notes
					`),
					catch: (cause) => new ArtifactQueryFailed({ message: `Failed to count artifacts: ${cause}` }),
				});
				return row;
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
