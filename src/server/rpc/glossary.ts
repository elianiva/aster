import { env } from "cloudflare:workers";
import { createServerFn } from "@tanstack/react-start";
import { Effect, Schema } from "effect";
import { queryOptions } from "@tanstack/react-query";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import * as schema from "../db/schema";
import { AppRuntime } from "../app-runtime";

const db = () => drizzle(env.aster_db, { schema });

export const listGlossary = createServerFn({ method: "GET" })
	.validator((data: unknown) =>
		Schema.decodeUnknownSync(Schema.Struct({ workspaceId: Schema.String }))(data)
	)
	.handler(({ data }) =>
		AppRuntime.runPromise(
			Effect.gen(function* () {
				const terms = yield* Effect.promise(() =>
					db().select().from(schema.glossary).where(eq(schema.glossary.workspaceId, data.workspaceId))
				);
				return terms.map((t) => ({
					id: t.id,
					term: t.term,
					definition: t.definition,
					avoid: t.avoid,
					createdAt: t.createdAt.toISOString(),
				}));
			}).pipe(Effect.withSpan("listGlossary"))
		)
	);

export const GlossaryRpc = {
	glossary: (workspaceId: string) => ["glossary", workspaceId] as const,
	listGlossary: (workspaceId: string) =>
		queryOptions({
			queryKey: [...GlossaryRpc.glossary(workspaceId), "list"],
			queryFn: () => listGlossary({ data: { workspaceId } }),
		}),
};
