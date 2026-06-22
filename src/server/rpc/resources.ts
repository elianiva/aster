import { createServerFn } from "@tanstack/react-start";
import { Effect, Schema } from "effect";
import { queryOptions } from "@tanstack/react-query";
import { eq } from "drizzle-orm";
import * as schema from "../db/schema";
import { AppRuntime } from "../app-runtime";
import { Database } from "../db/client";
import { ArtifactQueryFailed } from "../errors";
import { createErrorHandler } from "./errors";

const onError = createErrorHandler({
	ArtifactQueryFailed: "Failed to load resources. Please try again.",
});

export const listResources = createServerFn({ method: "GET" })
	.validator((data: unknown) =>
		Schema.decodeUnknownSync(Schema.Struct({ workspaceId: Schema.String }))(data)
	)
	.handler(({ data }) => {
		const ctx = getRequestContext();
		return AppRuntime.runPromise(
			Effect.gen(function* () {
				const { client } = yield* Database;
				const resources = yield* Effect.tryPromise({
					try: () =>
						client.select().from(schema.resources).where(eq(schema.resources.workspaceId, data.workspaceId)),
					catch: (cause) => new ArtifactQueryFailed({ message: `Failed to list resources: ${cause}` }),
				});
				return resources.map((r) => ({
					id: r.id,
					type: r.type,
					title: r.title,
					url: r.url,
					annotation: r.annotation,
					createdAt: r.createdAt.toISOString(),
				}));
			}).pipe(Effect.withSpan("listResources"))
		).catch(onError);
	});

export const ResourceRpc = {
	resources: (workspaceId: string) => ["resources", workspaceId] as const,
	listResources: (workspaceId: string) =>
		queryOptions({
			queryKey: [...ResourceRpc.resources(workspaceId), "list"],
			queryFn: () => listResources({ data: { workspaceId } }),
		}),
};
