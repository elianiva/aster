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
	ArtifactQueryFailed: "Failed to load glossary. Please try again.",
});

export const listGlossary = createServerFn({ method: "GET" })
	.validator((data: unknown) =>
		Schema.decodeUnknownSync(Schema.Struct({ workspaceId: Schema.String }))(data)
	)
	.handler(({ data }) => {
		const ctx = getRequestContext();
		return AppRuntime.runPromise(
			Effect.gen(function* () {
				const { client } = yield* Database;
				const terms = yield* Effect.tryPromise({
					try: () =>
						client.select().from(schema.glossary).where(eq(schema.glossary.workspaceId, data.workspaceId)),
					catch: (cause) => new ArtifactQueryFailed({ message: `Failed to list glossary: ${cause}` }),
				});
				return terms.map((t) => ({
					id: t.id,
					term: t.term,
					definition: t.definition,
					avoid: t.avoid,
					createdAt: t.createdAt.toISOString(),
				}));
			}).pipe(Effect.withSpan("listGlossary"))
		).catch(onError);
	});

export const GlossaryRpc = {
	glossary: (workspaceId: string) => ["glossary", workspaceId] as const,
	listGlossary: (workspaceId: string) =>
		queryOptions({
			queryKey: [...GlossaryRpc.glossary(workspaceId), "list"],
			queryFn: () => listGlossary({ data: { workspaceId } }),
		}),
};
