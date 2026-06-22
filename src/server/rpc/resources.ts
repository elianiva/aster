import { env } from "cloudflare:workers";
import { createServerFn } from "@tanstack/react-start";
import { Effect, Schema } from "effect";
import { queryOptions } from "@tanstack/react-query";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import * as schema from "../db/schema";
import { AppRuntime } from "../app-runtime";

const db = () => drizzle(env.aster_db, { schema });

export const listResources = createServerFn({ method: "GET" })
	.validator((data: unknown) =>
		Schema.decodeUnknownSync(Schema.Struct({ workspaceId: Schema.String }))(data)
	)
	.handler(({ data }) =>
		AppRuntime.runPromise(
			Effect.gen(function* () {
				const resources = yield* Effect.promise(() =>
					db().select().from(schema.resources).where(eq(schema.resources.workspaceId, data.workspaceId))
				);
				return resources.map((r) => ({
					id: r.id,
					type: r.type,
					title: r.title,
					url: r.url,
					annotation: r.annotation,
					createdAt: r.createdAt.toISOString(),
				}));
			}).pipe(Effect.withSpan("listResources"))
		)
	);

export const ResourceRpc = {
	resources: (workspaceId: string) => ["resources", workspaceId] as const,
	listResources: (workspaceId: string) =>
		queryOptions({
			queryKey: [...ResourceRpc.resources(workspaceId), "list"],
			queryFn: () => listResources({ data: { workspaceId } }),
		}),
};
